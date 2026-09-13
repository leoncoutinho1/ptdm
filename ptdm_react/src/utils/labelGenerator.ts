import { Product } from './db';

export interface LabelPrintItem {
  product: Product;
  quantity: number;
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
    const rawBarcode =
      (Array.isArray(item.product.barcodes) && item.product.barcodes.length > 0
        ? item.product.barcodes[0]
        : item.product.mainBarcode) || '';
    const codigoEAN = formatEan13(rawBarcode);
    const precoFormatado = formatLabelPrice(item.product.price);
    const descricao = (item.product.description || '').replace(/[\r\n]/g, ' ').trim();
    const quantidade = Math.max(1, Math.floor(item.quantity || 1));
    const isUnitUN = (item.product.unit || 'UN').trim().toUpperCase() === 'UN';

    if (labelSize === '40x40') {
      const valDate = new Date(today);
      const validityDays = Number(item.product.validityDays) || 0;
      valDate.setDate(valDate.getDate() + validityDays);
      const valDateStr = formatDateBR(valDate);

      const infoLinha1 = isUnitUN ? `FAB: ${fabDateStr}` : `PRECO/kg R$: ${precoFormatado}`;
      const infoLinha2 = isUnitUN ? `VAL: ${valDateStr}` : `PESO (kg):`;

      zplScript += `^XA
^PW320
^LL320
^CI28
^MD8
^LH0,0

^CF0,30,25
^A0,25,25^FO20,20^FD${descricao}^FS

^CF0,20,18
^A0,20,20^FO20,55^FD${infoLinha1}^FS
^A0,20,20^FO20,80^FD${infoLinha2}^FS

^CF0,40,35
^FO30,110^FDR$:^FS
^CF0,50,45
^A0,80,80^FO110,110^FD${precoFormatado}^FS

^FO20,190^GB280,3,3^FS

^FO70,200^BY2
^BEN,50,Y,N
^FD${codigoEAN}^FS

^A0,20,20^FO50,285^FDPADARIA TREM DE MINAS^FS
^PQ${quantidade}
^XZ
`;
    } else {
      // 100x30 mm
      zplScript += `^XA
^PW799
^LL240
^CI28
^MD8
^LH0,0

^CF0,30,30
^A0,50,50^FO30,30^FD${descricao}^FS

^CF0,40,35
^FO430,130^FDR$:^FS
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

  return zplScript;
}
