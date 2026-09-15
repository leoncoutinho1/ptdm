import { Product } from './db';

export interface LabelPrintItem {
  product: Product;
  quantity: number; // Quantidade de cópias
  itemQuantity?: number; // Quantidade / Peso do item
}

/**
 * Gera o código de barras conforme as regras de negócio:
 * 1º dígito: 2 para UN, 5 para KG
 * Próximos 5 dígitos: mainBarcode com padLeft(0)
 * Próximos 6 dígitos: quantidade informada com padLeft(0) (em gramas para KG)
 */
export function generateLabelBarcode(product: Product, itemQuantity: number = 1): string {
  const isKg = (product.unit || '').trim().toUpperCase() === 'KG';
  const firstDigit = isKg ? '5' : '2';

  const rawMain = (
    product.mainBarcode ||
    (Array.isArray(product.barcodes) && product.barcodes.length > 0 ? product.barcodes[0] : '') ||
    ''
  ).replace(/\D/g, '');
  const mainBarcode5 = rawMain.padStart(5, '0').slice(-5);

  let qtyCode = '';
  if (isKg) {
    const grams = Math.round((itemQuantity || 0) * 1000);
    qtyCode = String(grams).padStart(6, '0').slice(-6);
  } else {
    const qty = Math.round(itemQuantity || 1);
    qtyCode = String(qty).padStart(6, '0').slice(-6);
  }

  return `${firstDigit}${mainBarcode5}${qtyCode}`;
}

/**
 * Formata ou calcula o código de barras no padrão EAN-13 com dígito verificador válido.
 */
export function formatEan13(rawBarcode?: string): string {
  const digitsOnly = (rawBarcode || '').replace(/\D/g, '');
  const base12 = (
    digitsOnly.length >= 12
      ? digitsOnly.slice(0, 12)
      : digitsOnly.padStart(12, '0')
  ).slice(-12);

  let eanSum = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(base12[i], 10);
    eanSum += i % 2 === 0 ? d : d * 3;
  }
  const checkDigit = (10 - (eanSum % 10)) % 10;
  return `${base12}${checkDigit}`;
}

/**
 * Formata o valor numérico de preço no padrão brasileiro (ex: 21,08 ou 59,90).
 */
export function formatLabelPrice(price?: number): string {
  if (price === undefined || price === null || isNaN(price)) {
    return '0,00';
  }
  return price.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata data no formato DD/MM/YYYY.
 */
export function formatDateBR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Gera o script ZPL para impressão de etiquetas (suporta tamanhos 100x30 e 40x40).
 */
export function generateZplScript(
  items: LabelPrintItem[],
  labelSize: string = '100x30'
): string {
  let zplScript = '';

  const today = new Date();
  const fabDateStr = formatDateBR(today);

  for (const item of items) {
    const descricao = (item.product.description || '').replace(/[\r\n]/g, ' ').trim();
    const quantidade = Math.max(1, Math.floor(item.quantity || 1));
    const isKg = (item.product.unit || '').trim().toUpperCase() === 'KG';
    const itemQty = isKg ? (item.itemQuantity ?? 1) : 1;

    if (labelSize === '40x40') {
      const totalPrice = (item.product.price || 0) * itemQty;
      const precoTotalFormatado = formatLabelPrice(totalPrice);
      const precoKgFormatado = formatLabelPrice(item.product.price);
      const pesoFormatado = itemQty.toLocaleString('pt-BR', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      });

      const hasValidity = Boolean(
        item.product.validityDays !== undefined &&
        item.product.validityDays !== null &&
        Number(item.product.validityDays) > 0
      );

      let valDateStr = '';
      if (hasValidity) {
        const valDate = new Date(today);
        const validityDays = Number(item.product.validityDays) || 0;
        valDate.setDate(valDate.getDate() + validityDays);
        valDateStr = formatDateBR(valDate);
      }

      // Linhas intermediárias
      let intermediateLines = '';

      if (isKg && hasValidity) {
        intermediateLines = `^A0,23,20^FO10,63^FDPreço/Kg: R$ ${precoKgFormatado}^FS
^A0,23,20^FO175,63^FDPeso(Kg): ${pesoFormatado}^FS

^A0,23,20^FO10,95^FDFab: ${fabDateStr}^FS
^A0,23,20^FO175,95^FDVal: ${valDateStr}^FS`;
      } else if (isKg && !hasValidity) {
        intermediateLines = `^A0,23,20^FO10,75^FDPreço/Kg: R$ ${precoKgFormatado}^FS
^A0,23,20^FO175,75^FDPeso(Kg): ${pesoFormatado}^FS`;
      } else if (!isKg && hasValidity) {
        intermediateLines = `^A0,23,20^FO10,75^FDFab: ${fabDateStr}^FS
^A0,23,20^FO175,75^FDVal: ${valDateStr}^FS`;
      }

      const barcodeValue = generateLabelBarcode(item.product, itemQty);

      zplScript += `^XA
^PW319
^LL319
^CI28
^MD8
^LH0,0

^A0,50,35^FO10,10^FD${descricao}^FS
${intermediateLines ? '\n' + intermediateLines + '\n' : ''}
^A0,40,35^FO45,160^FDR$^FS

^A0,80,80^FO95,130^FD${precoTotalFormatado}^FS

^FO10,200^GB300,3,3^FS

^FO70,210^BY2
^BEN,40,Y,N
^FD${barcodeValue}^FS

^A0,25,22^FO55,285^FDPadaria Trem de Minas^FS
^PQ${quantidade}
^XZ
`;
    } else {
      // 100x30 mm
      const rawBarcode =
        (Array.isArray(item.product.barcodes) && item.product.barcodes.length > 0
          ? item.product.barcodes[0]
          : item.product.mainBarcode) || '';
      const codigoEAN = formatEan13(rawBarcode);
      const precoFormatado = formatLabelPrice(item.product.price);

      zplScript += `^XA
^PW799
^LL240
^CI28
^MD8
^LH0,0

^CF0,30,30
^A0,50,50^FO30,30^FD${descricao}^FS

^CF0,40,35
^FO430,130^FDR$^FS
^CF0,50,45
^A0,100,100^FO530,80^FD${precoFormatado}^FS

^FO70,120^BY3
^BEN,70,Y,N
^FD${codigoEAN}^FS

^FO430,180^GB320,3,3^FS

^A0,30,30^FO430,190^FDPADARIA TREM DE MINAS^FS
^PQ${quantidade}
^XZ
`;
    }
  }
  console.log(zplScript);
  return zplScript;
}
