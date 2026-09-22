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
  SimpleGrid,
  Box,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { db, Product, Category } from '@/utils/db';
import { formatCurrency } from '@/utils/currency';
import { generateZplScript } from '@/utils/labelGenerator';
import { MainLayout } from '../../../layouts/MainLayout';
import { Trash2, Printer, Search, Plus, Tag, Layers, Package } from 'lucide-react';

interface PrintItem {
  id: string;
  product: Product;
  quantity: number; // Quantidade de cópias
  itemQuantity: number; // Quantidade do item (peso para KG, 1 para UN)
}

export function LabelsReport() {
  const [labelSize, setLabelSize] = useState<string | null>('100x30');
  const [printMode, setPrintMode] = useState<'section' | 'product'>('section');
  const [printQuality, setPrintQuality] = useState<string>('^MD0');
  
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
              itemQuantity: 1,
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
          message: `Quantidade de cópias de "${prod.description}" incrementada para ${updated[index].quantity}.`,
        });
        return updated;
      }
      notifications.show({
        color: 'green',
        title: 'Produto adicionado',
        message: `"${prod.description}" adicionado à lista de impressão.`,
      });
      return [
        ...prev,
        {
          id: prod.id,
          product: prod,
          quantity: 1,
          itemQuantity: 1,
        },
      ];
    });
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    setItemsToPrint((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, qty) } : item
      )
    );
  };

  const handleUpdateItemQuantity = (id: string, itemQty: number) => {
    setItemsToPrint((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, itemQuantity: Math.max(0.001, itemQty) } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setItemsToPrint((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearList = () => {
    setItemsToPrint([]);
  };

  // Dispara a impressão de etiquetas ZPL para a impressora
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
      const zplScript = generateZplScript(
        itemsToPrint,
        labelSize || '100x30',
        printQuality
      );

      // Conversão para o array de bytes (Uint8Array)
      const encoder = new TextEncoder();
      const finalEncoded = encoder.encode(zplScript);
      const byteArray = Array.from(finalEncoded);

      const response = await fetch('http://localhost:3031/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: byteArray,
          jobName: 'Etiquetas ZPL',
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
          {/* Configurações Iniciais: Tamanho, Modo e Qualidade */}
          <Card withBorder p="md" radius="sm">
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Stack gap={6} justify="space-between" style={{ height: '100%' }}>
                <Box>
                  <Text size="sm" fw={500}>
                    Tamanho da Etiqueta
                  </Text>
                  <Text size="xs" c="dimmed">
                    Selecione o formato da etiqueta
                  </Text>
                </Box>
                <Select
                  value={labelSize}
                  onChange={setLabelSize}
                  data={[
                    { value: '100x30', label: '100x30 mm' },
                    { value: '40x40', label: '40x40 mm' },
                  ]}
                  allowDeselect={false}
                />
              </Stack>

              <Stack gap={6} justify="space-between" style={{ height: '100%' }}>
                <Box>
                  <Text size="sm" fw={500}>
                    Tipo de Seleção
                  </Text>
                  <Text size="xs" c="dimmed">
                    Escolha o modo de inclusão
                  </Text>
                </Box>
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

              <Stack gap={6} justify="space-between" style={{ height: '100%' }}>
                <Box>
                  <Text size="sm" fw={500}>
                    Qualidade
                  </Text>
                  <Text size="xs" c="dimmed">
                    Densidade térmica de impressão
                  </Text>
                </Box>
                <SegmentedControl
                  value={printQuality}
                  onChange={setPrintQuality}
                  data={[
                    { value: '^MD0', label: 'Normal' },
                    { value: '^MD4', label: 'Melhor' },
                    { value: '^MD8', label: 'Superior' },
                  ]}
                  fullWidth
                />
              </Stack>
            </SimpleGrid>
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
                            <Paper
                              key={prod.id}
                              withBorder
                              p="xs"
                              radius="sm"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                addProductToPrint(prod);
                                setProductSearchResults([]);
                                setSearchTerm('');
                              }}
                            >
                              <Group justify="space-between">
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
                            </Paper>
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
                      backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))',
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
                      <Table.Th style={{ width: '130px', textAlign: 'center' }}>
                        Quantidade
                      </Table.Th>
                      <Table.Th style={{ width: '160px', textAlign: 'center' }}>
                        Quantidade de cópias
                      </Table.Th>
                      <Table.Th style={{ width: '80px', textAlign: 'center' }}>
                        Remover
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {itemsToPrint.map((item) => {
                      const isKg = (item.product.unit || '').trim().toUpperCase() === 'KG';
                      return (
                        <Table.Tr key={item.id}>
                          <Table.Td>
                            <Text size="sm" fw={500}>
                              {item.product.description}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {item.product.mainBarcode
                                ? `Cód: ${item.product.mainBarcode}`
                                : Array.isArray(item.product.barcodes) && item.product.barcodes[0]
                                ? item.product.barcodes[0]
                                : '-'}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>
                            <Text size="sm" fw={600}>
                              {formatCurrency(item.product.price)}
                            </Text>
                            {isKg && (
                              <Text size="xs" c="dimmed">
                                Total: {formatCurrency((item.product.price || 0) * (item.itemQuantity || 1))}
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'center' }}>
                            <Badge variant="light" size="sm">
                              {item.product.unit || 'UN'}
                            </Badge>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'center' }}>
                            <NumberInput
                              value={isKg ? item.itemQuantity : 1}
                              onChange={(val) =>
                                handleUpdateItemQuantity(
                                  item.id,
                                  typeof val === 'number' ? val : parseFloat(String(val)) || 0
                                )
                              }
                              disabled={!isKg}
                              min={0.001}
                              step={0.05}
                              decimalScale={3}
                              fixedDecimalScale={isKg}
                              size="xs"
                              style={{ maxWidth: 100, margin: '0 auto' }}
                            />
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
                      );
                    })}
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
