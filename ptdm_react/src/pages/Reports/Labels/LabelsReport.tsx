import { useEffect, useState, useRef } from 'react';
import {
  Title,
  Button,
  Group,
  Stack,
  Paper,
  Text,
  Select,
  SegmentedControl,
  MultiSelect,
  TextInput,
  Table,
  NumberInput,
  ActionIcon,
  ScrollArea,
  Badge,
  Card,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { db, Product, Category } from '@/utils/db';
import { formatCurrency } from '@/utils/currency';
import { MainLayout } from '../../../layouts/MainLayout';
import { Trash2, Printer, Search, Plus, Tag, Layers, Package } from 'lucide-react';

interface PrintItem {
  id: string;
  product: Product;
  quantity: number;
}

export function LabelsReport() {
  const [labelSize, setLabelSize] = useState<string | null>('100x30');
  const [printMode, setPrintMode] = useState<'section' | 'product'>('section');
  
  // Categorias / Seções
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Busca de produtos
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Lista de itens para impressão
  const [itemsToPrint, setItemsToPrint] = useState<PrintItem[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await db.categories
          .filter((c) => c.syncStatus !== 'pending-delete')
          .toArray();
        data.sort((a, b) => a.description.localeCompare(b.description));
        setCategories(data);
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
        notifications.show({
          color: 'red',
          title: 'Erro',
          message: 'Não foi possível carregar as categorias.',
        });
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Adiciona produtos das seções selecionadas à lista
  const handleAddProductsFromSections = async () => {
    if (selectedCategories.length === 0) {
      notifications.show({
        color: 'yellow',
        title: 'Selecione uma seção',
        message: 'Selecione ao menos uma categoria para carregar os produtos.',
      });
      return;
    }

    try {
      const prods = await db.products
        .filter(
          (p) =>
            p.syncStatus !== 'pending-delete' &&
            selectedCategories.includes(p.categoryId)
        )
        .toArray();

      if (prods.length === 0) {
        notifications.show({
          color: 'yellow',
          title: 'Nenhum produto encontrado',
          message: 'Não há produtos cadastrados nas seções selecionadas.',
        });
        return;
      }

      setItemsToPrint((prev) => {
        const existingIds = new Set(prev.map((item) => item.product.id));
        const newItems: PrintItem[] = [];

        prods.forEach((p) => {
          if (!existingIds.has(p.id)) {
            newItems.push({
              id: p.id,
              product: p,
              quantity: 1,
            });
          }
        });

        if (newItems.length === 0) {
          notifications.show({
            color: 'blue',
            title: 'Produtos já adicionados',
            message: 'Todos os produtos desta seção já estão na lista de impressão.',
          });
          return prev;
        }

        notifications.show({
          color: 'green',
          title: 'Produtos adicionados',
          message: `${newItems.length} produto(s) adicionado(s) à lista de impressão.`,
        });

        return [...prev, ...newItems];
      });
    } catch (err) {
      console.error('Erro ao buscar produtos por categoria:', err);
      notifications.show({
        color: 'red',
        title: 'Erro',
        message: 'Erro ao buscar produtos da seção.',
      });
    }
  };

  // Busca produtos por código de barras ou descrição
  const handleSearchProducts = async (term: string) => {
    if (!term || term.trim().length === 0) {
      setProductSearchResults([]);
      return;
    }

    setSearchingProducts(true);
    try {
      const lower = term.toLowerCase().trim();

      // Busca exata por código de barras primeiro
      const byBarcode = await db.products
        .filter(
          (p) =>
            p.syncStatus !== 'pending-delete' &&
            Array.isArray(p.barcodes) &&
            p.barcodes.some((b) => b.toLowerCase() === lower)
        )
        .toArray();

      if (byBarcode.length === 1) {
        addProductToPrint(byBarcode[0]);
        setSearchTerm('');
        setProductSearchResults([]);
        return;
      }

      // Busca por descrição
      const byDesc = await db.products
        .filter(
          (p) =>
            p.syncStatus !== 'pending-delete' &&
            p.description.toLowerCase().includes(lower)
        )
        .limit(10)
        .toArray();

      setProductSearchResults(byDesc);
      if (byDesc.length === 0) {
        notifications.show({
          color: 'yellow',
          title: 'Não encontrado',
          message: 'Nenhum produto encontrado com o termo digitado.',
        });
      }
    } catch (err) {
      console.error('Erro ao pesquisar produto:', err);
      notifications.show({
        color: 'red',
        title: 'Erro',
        message: 'Erro ao pesquisar produtos.',
      });
    } finally {
      setSearchingProducts(false);
    }
  };

  const addProductToPrint = (prod: Product) => {
    setItemsToPrint((prev) => {
      const index = prev.findIndex((item) => item.product.id === prod.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          quantity: updated[index].quantity + 1,
        };
        notifications.show({
          color: 'blue',
          title: 'Quantidade incrementada',
          message: `Quantidade de "${prod.description}" incrementada para ${updated[index].quantity}.`,
        });
        return updated;
      }
      notifications.show({
        color: 'green',
        title: 'Produto adicionado',
        message: `"${prod.description}" adicionado à lista de impressão.`,
      });
      return [...prev, { id: prod.id, product: prod, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    setItemsToPrint((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, qty) } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setItemsToPrint((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearList = () => {
    setItemsToPrint([]);
  };

  // Dispara a impressão de etiquetas EPL para a impressora
  const dispararImpressao = async () => {
    if (itemsToPrint.length === 0) {
      notifications.show({
        color: 'yellow',
        title: 'Lista vazia',
        message: 'Adicione ao menos um produto para imprimir etiquetas.',
      });
      return;
    }

    setIsPrinting(true);

    try {
      let eplScript = '';

      for (const item of itemsToPrint) {
        const rawBarcode =
          Array.isArray(item.product.barcodes) && item.product.barcodes.length > 0
            ? item.product.barcodes[0]
            : '';
        const digitsOnly = rawBarcode.replace(/\D/g, '');

        // Calcula ou valida o dígito verificador do EAN-13 para a impressora não rejeitar o comando
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
        const codigoEAN = `${base12}${checkDigit}`;

        const precoProduto = formatCurrency(item.product.price);
        const unidadeMedida = (item.product.unit || 'UN').replace(/"/g, "'");
        const quantidade = Math.max(1, Math.floor(item.quantity || 1));

        eplScript += 'N\r\n'; // Limpa o buffer de imagem
        eplScript += 'ZT\r\n'; // Força orientação padrão (Top-to-Bottom / não invertido)
        eplScript += 'D11\r\n'; // Densidade térmica adequada (contraste)
        eplScript += 'S2\r\n'; // Velocidade de impressão

        if (labelSize === '40x40') {
          const nomeProduto = (item.product.description || '')
            .replace(/"/g, "'")
            .substring(0, 22);

          // A cabeça de impressão térmica possui largura de 800 pontos (100mm)
          // e o rolo de 40mm (320 pontos) fica centralizado na impressora.
          // Offset para centralizar: (800 - 320) / 2 = 240 pontos
          const offsetX = 240;

          eplScript += 'q800\r\n'; // Largura total da cabeça de impressão (800 pontos)
          eplScript += 'Q320,24\r\n'; // Altura útil da etiqueta de 40mm (320 pontos) + 24 pontos de GAP

          // 1. Nome do produto (X=260, Y=20). Fonte '3'
          eplScript += `A${offsetX + 20},20,0,3,1,1,N,"${nomeProduto}"\r\n`;

          // 2. Preço com destaque (X=260, Y=55). Fonte '4' com altura dobrada (1,2)
          eplScript += `A${offsetX + 20},55,0,4,1,2,N,"${precoProduto}"\r\n`;

          // 3. Código de barras EAN-13 (X=285, Y=125) centralizado com parâmetro 'B'
          eplScript += `B${offsetX + 45},125,0,E,2,4,80,B,"${codigoEAN}"\r\n`;
        } else {
          const nomeProduto = (item.product.description || '')
            .replace(/"/g, "'")
            .substring(0, 32);

          eplScript += 'q800\r\n'; // Largura total de 100mm (800 pontos)
          eplScript += 'Q240,24\r\n'; // Altura útil de 30mm (240 pontos) + 24 pontos de GAP

          // -------------------------------------------------------------------------
          // LADO ESQUERDO: PRODUTO E CÓDIGO DE BARRAS
          // -------------------------------------------------------------------------

          // 1. Nome do produto (X=40, Y=20). Fonte '3' é média e ideal para legibilidade.
          eplScript += `A40,20,0,3,1,1,N,"${nomeProduto}"\r\n`;

          // 2. Código de barras EAN-13 (X=40, Y=60)
          // Tipo 'E' = EAN-13 | Largura barra=2 | Altura barras=90 pontos
          // O parâmetro 'B' no final faz a impressora renderizar os números embaixo das barras automaticamente.
          eplScript += `B40,60,0,E,2,4,90,B,"${codigoEAN}"\r\n`;

          // -------------------------------------------------------------------------
          // LADO DIREITO: PREÇO E UNIDADE DE MEDIDA
          // -------------------------------------------------------------------------

          // 3. Preço com altura de duas linhas (X=560, Y=50).
          // Usamos multiplicador Vertical = 2 (dobro da altura) para dar destaque.
          eplScript += `A560,50,0,4,1,2,N,"${precoProduto}"\r\n`;

          // 4. Unidade de medida (X=560, Y=160).
          // Posicionado logo abaixo do preço, com tamanho normal (altura de 1 linha).
          eplScript += `A560,160,0,3,1,1,N,"${unidadeMedida}"\r\n`;
        }

        // -------------------------------------------------------------------------

        eplScript += `P${quantidade}\r\n`; // Comando para imprimir N cópias
      }

      // Conversão para o array de bytes (Uint8Array)
      const encoder = new TextEncoder();
      const finalEncoded = encoder.encode(eplScript);
      const byteArray = Array.from(finalEncoded);

      const response = await fetch('http://localhost:3031/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: byteArray,
          jobName: 'Cupom de Venda',
          defaultPrinter: true,
        }),
      });

      if (response.ok) {
        notifications.show({
          color: 'green',
          title: 'Sucesso',
          message: 'Etiqueta(s) de gôndola enviada(s) para impressão!',
        });
      } else {
        throw new Error('Falha ao enviar etiquetas para a impressora');
      }
    } catch (error) {
      console.error('Erro na comunicação com a API:', error);
      notifications.show({
        color: 'red',
        title: 'Erro na Impressão',
        message: 'Erro na comunicação com a API de impressão (localhost:3031).',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const totalLabels = itemsToPrint.reduce((acc, item) => acc + (item.quantity || 1), 0);

  return (
    <MainLayout>
      <Group justify="space-between" mb="md">
        <Title order={3} style={{ paddingLeft: '2.5rem' }}>
          Impressão de Etiquetas
        </Title>
      </Group>

      <Paper withBorder shadow="md" p={24} radius="md">
        <Stack gap="lg">
          {/* Configurações Iniciais: Tamanho e Modo */}
          <Card withBorder p="md" radius="sm" style={{ backgroundColor: 'var(--mantine-color-body)' }}>
            <Group grow align="flex-start">
              <Select
                label="Tamanho da Etiqueta"
                description="Selecione o formato da etiqueta de gôndola"
                value={labelSize}
                onChange={setLabelSize}
                data={[
                  { value: '100x30', label: '100x30 mm' },
                  { value: '40x40', label: '40x40 mm' },
                  { value: '60x40', label: '60x40 mm (Em breve)', disabled: true },
                ]}
                allowDeselect={false}
              />

              <Stack gap={6}>
                <Text size="sm" fw={500}>
                  Tipo de Seleção
                </Text>
                <SegmentedControl
                  value={printMode}
                  onChange={(val) => setPrintMode(val as 'section' | 'product')}
                  data={[
                    {
                      value: 'section',
                      label: (
                        <Group gap="xs" justify="center">
                          <Layers size={16} />
                          <span>Por Seção</span>
                        </Group>
                      ),
                    },
                    {
                      value: 'product',
                      label: (
                        <Group gap="xs" justify="center">
                          <Package size={16} />
                          <span>Por Produto</span>
                        </Group>
                      ),
                    },
                  ]}
                  fullWidth
                />
              </Stack>
            </Group>
          </Card>

          {/* Área Dinâmica dependendo do Tipo de Seleção */}
          {printMode === 'section' ? (
            <Card withBorder p="md" radius="sm">
              <Stack gap="sm">
                <Text size="sm" fw={600}>
                  Seleção de Seção / Categoria
                </Text>
                <MultiSelect
                  label="Seções"
                  placeholder={
                    loadingCategories
                      ? 'Carregando seções...'
                      : 'Selecione uma ou mais seções'
                  }
                  data={categories.map((c) => ({
                    value: c.id,
                    label: c.description,
                  }))}
                  value={selectedCategories}
                  onChange={setSelectedCategories}
                  searchable
                  clearable
                />
                <Group justify="flex-end" mt="xs">
                  <Button
                    leftSection={<Plus size={16} />}
                    onClick={handleAddProductsFromSections}
                    disabled={selectedCategories.length === 0}
                  >
                    Carregar Produtos da Seção
                  </Button>
                </Group>
              </Stack>
            </Card>
          ) : (
            <Card withBorder p="md" radius="sm">
              <Stack gap="sm">
                <Text size="sm" fw={600}>
                  Pesquisa de Produtos
                </Text>
                <Group align="flex-end">
                  <TextInput
                    ref={searchInputRef}
                    label="Código de Barras ou Descrição"
                    placeholder="Digite o código ou nome do produto e pressione Enter"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchProducts(searchTerm);
                      }
                    }}
                    style={{ flex: 1 }}
                    leftSection={<Search size={16} />}
                  />
                  <Button
                    onClick={() => handleSearchProducts(searchTerm)}
                    loading={searchingProducts}
                  >
                    Pesquisar
                  </Button>
                </Group>

                {productSearchResults.length > 0 && (
                  <Stack gap="xs" mt="xs">
                    <Text size="xs" c="dimmed">
                      Resultados encontrados (clique para adicionar à lista de impressão):
                    </Text>
                    <Paper withBorder p="xs">
                      <ScrollArea.Autosize mah={180}>
                        <Stack gap={6}>
                          {productSearchResults.map((prod) => (
                            <Group
                              key={prod.id}
                              justify="space-between"
                              p="xs"
                              style={{
                                borderRadius: 4,
                                cursor: 'pointer',
                                backgroundColor: 'var(--mantine-color-gray-0)',
                              }}
                              onClick={() => {
                                addProductToPrint(prod);
                                setProductSearchResults([]);
                                setSearchTerm('');
                              }}
                            >
                              <div>
                                <Text size="sm" fw={500}>
                                  {prod.description}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {Array.isArray(prod.barcodes) && prod.barcodes[0]
                                    ? `Código: ${prod.barcodes[0]}`
                                    : 'Sem código'} | Unidade: {prod.unit || 'UN'}
                                </Text>
                              </div>
                              <Group gap="sm">
                                <Badge color="teal" variant="light">
                                  {formatCurrency(prod.price)}
                                </Badge>
                                <Button size="xs" variant="light">
                                  Adicionar
                                </Button>
                              </Group>
                            </Group>
                          ))}
                        </Stack>
                      </ScrollArea.Autosize>
                    </Paper>
                  </Stack>
                )}
              </Stack>
            </Card>
          )}

          {/* Tabela de Produtos para Impressão */}
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <Text size="md" fw={600}>
                  Lista de Etiquetas para Impressão
                </Text>
                <Badge variant="filled" color="blue">
                  {itemsToPrint.length} item(ns)
                </Badge>
                {totalLabels > 0 && (
                  <Badge variant="outline" color="gray">
                    Total de {totalLabels} etiqueta(s)
                  </Badge>
                )}
              </Group>

              {itemsToPrint.length > 0 && (
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  onClick={handleClearList}
                >
                  Limpar Lista
                </Button>
              )}
            </Group>

            {itemsToPrint.length === 0 ? (
              <Paper withBorder p="xl" style={{ textAlign: 'center' }}>
                <Tag size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <Text size="sm" c="dimmed">
                  Nenhum produto adicionado à lista de impressão ainda.
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  {printMode === 'section'
                    ? 'Selecione uma seção e clique em "Carregar Produtos da Seção".'
                    : 'Pesquise produtos pelo código de barras ou descrição para adicioná-los.'}
                </Text>
              </Paper>
            ) : (
              <ScrollArea h={350} offsetScrollbars>
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                  <Table.Thead
                    style={{
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'var(--mantine-color-body)',
                      zIndex: 1,
                    }}
                  >
                    <Table.Tr>
                      <Table.Th>Descrição</Table.Th>
                      <Table.Th style={{ width: '130px', textAlign: 'right' }}>
                        Preço
                      </Table.Th>
                      <Table.Th style={{ width: '90px', textAlign: 'center' }}>
                        Unidade
                      </Table.Th>
                      <Table.Th style={{ width: '140px', textAlign: 'center' }}>
                        Qtd. Etiquetas
                      </Table.Th>
                      <Table.Th style={{ width: '80px', textAlign: 'center' }}>
                        Remover
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {itemsToPrint.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {item.product.description}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {Array.isArray(item.product.barcodes) && item.product.barcodes[0]
                              ? item.product.barcodes[0]
                              : '-'}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text size="sm" fw={600}>
                            {formatCurrency(item.product.price)}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Badge variant="light" size="sm">
                            {item.product.unit || 'UN'}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <NumberInput
                            value={item.quantity}
                            onChange={(val) =>
                              handleUpdateQuantity(item.id, Number(val) || 1)
                            }
                            min={1}
                            max={999}
                            size="xs"
                            style={{ maxWidth: 100, margin: '0 auto' }}
                          />
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remover produto da lista"
                          >
                            <Trash2 size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </Stack>

          <Divider />

          {/* Botão de Envio para a Impressora */}
          <Group justify="flex-end">
            <Button
              size="md"
              leftSection={<Printer size={20} />}
              onClick={dispararImpressao}
              loading={isPrinting}
              disabled={itemsToPrint.length === 0}
              color="blue"
            >
              Enviar para Impressora ({totalLabels} etiqueta{totalLabels !== 1 ? 's' : ''})
            </Button>
          </Group>
        </Stack>
      </Paper>
    </MainLayout>
  );
}
