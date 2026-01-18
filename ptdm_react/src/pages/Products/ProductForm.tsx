import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, NumberInput, Select, Stack, TextInput, Title, ActionIcon, Paper, Grid, Pill, InputBase, Checkbox, Modal, Table } from '@mantine/core';
import { MainLayout } from '../../layouts/MainLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { db } from '@/utils/db';
import { genericSubmit, genericDelete } from '@/utils/syncHelper';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConfirmDelete } from '@/hooks/useConfirmModal';

interface ProductComposition {
  componentProductId: string;
  componentProductDescription?: string;
  quantity: number;
}

interface ProductFormValues {
  id?: string;
  description: string;
  cost: number;
  profitMargin: number;
  price: number;
  quantity: number;
  unit: string;
  barcodes: string[];
  categoryId: string;
  composite: boolean;
  componentProducts: ProductComposition[];
}

export function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const product = (location.state as any)?.product as Partial<ProductFormValues> | undefined;
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  // Estados para produtos compostos
  const [composeModalOpened, setComposeModalOpened] = useState(false);
  const [componentQuantity, setComponentQuantity] = useState(1);
  const [componentSearchTerm, setComponentSearchTerm] = useState('');
  const [componentOptions, setComponentOptions] = useState<any[]>([]);
  const [selectedComponentValue, setSelectedComponentValue] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    initialValues: {
      description: '',
      cost: 0,
      profitMargin: 0,
      price: 0,
      quantity: 0,
      unit: '',
      barcodes: [],
      categoryId: '',
      composite: false,
      componentProducts: []
    }
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const localData = await db.categories.toArray();
        setCategories(localData.map((cat: any) => ({ value: String(cat.id), label: cat.description })));
      } catch (err) {
        console.error('Erro ao buscar categorias localmente', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (product) {
      form.setValues({
        description: product.description ?? '',
        cost: Number(product.cost ?? 0),
        profitMargin: Number(product.profitMargin ?? 0),
        price: Number(product.price ?? 0),
        quantity: Number(product.quantity ?? 0),
        unit: String((product as any).unit ?? ''),
        barcodes: Array.isArray((product as any).barcodes)
          ? ((product as any).barcodes as string[]).filter(b => b.trim() !== '')
          : (product?.barcodes ? [String(product.barcodes)].filter(b => b.trim() !== '') : []),
        categoryId: String(product.categoryId ?? ''),
        composite: Boolean((product as any).composite ?? false),
        componentProducts: Array.isArray((product as any).componentProducts) ? (product as any).componentProducts : []
      });
      return;
    }

    if (id) {
      db.products.get(id).then(found => {
        if (found) {
          form.setValues({
            description: found.description ?? '',
            cost: Number(found.cost ?? 0),
            profitMargin: Number(found.profitMargin ?? 0),
            price: Number(found.price ?? 0),
            quantity: Number(found.quantity ?? 0),
            unit: String((found as any).unit ?? ''),
            barcodes: Array.isArray(found.barcodes) ? found.barcodes.filter(b => b.trim() !== '') : [],
            categoryId: String(found.categoryId ?? ''),
            composite: Boolean((found as any).composite ?? false),
            componentProducts: Array.isArray((found as any).componentProducts) ? (found as any).componentProducts : []
          });
        }
      });
    }
  }, [id, product]);

  // Funções para calcular valores apenas no blur
  const handleCostBlur = () => {
    const cost = form.values.cost;
    const profitMargin = form.values.profitMargin;
    if (cost > 0 && profitMargin > 0) {
      const calculatedPrice = cost + (cost * profitMargin / 100);
      form.setFieldValue('price', Number(calculatedPrice.toFixed(2)));
    }
  };

  const handleProfitMarginBlur = () => {
    const cost = form.values.cost;
    const profitMargin = form.values.profitMargin;
    if (cost > 0 && profitMargin >= 0) {
      const calculatedPrice = cost + (cost * profitMargin / 100);
      form.setFieldValue('price', Number(calculatedPrice.toFixed(2)));
    }
  };

  const handlePriceBlur = () => {
    const cost = form.values.cost;
    const price = form.values.price;
    if (cost > 0 && price > 0) {
      const calculatedMargin = ((price - cost) / cost) * 100;
      form.setFieldValue('profitMargin', Number(calculatedMargin.toFixed(2)));
    }
  };

  const addBarcode = (barcode: string) => {
    if (barcode.trim()) {
      const currentBarcodes = form.values.barcodes.filter(b => b.trim() !== '');
      form.setFieldValue('barcodes', [...currentBarcodes, barcode.trim()]);
      setBarcodeInput('');
    }
  };

  const removeBarcode = (index: number) => {
    const next = form.values.barcodes.filter((_, i) => i !== index);
    form.setFieldValue('barcodes', next.length ? next : []);
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBarcode(barcodeInput);
    }
  };

  // Funções para produtos compostos
  const searchComponentProducts = async () => {
    if (!componentSearchTerm || componentSearchTerm.length < 1) {
      setComponentOptions([]);
      return;
    }

    try {
      const lowerSearch = componentSearchTerm.toLowerCase();

      // Busca por código de barras
      const foundById = await db.products
        .filter(p =>
          (Array.isArray(p.barcodes) && p.barcodes.some(b => b.toLowerCase() === lowerSearch)) &&
          !(p as any).composite // Não permite produtos compostos como componentes
        ).toArray();

      if (foundById.length === 1) {
        addComponentToProduct(foundById[0]);
      } else {
        // Busca por descrição
        const foundByDescription = await db.products
          .filter(p =>
            p.description.toLowerCase().includes(lowerSearch) &&
            !(p as any).composite // Não permite produtos compostos como componentes
          ).toArray();
        setComponentOptions(foundByDescription);
      }
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao buscar produto', message: String(err) });
    }
  };

  const addComponentToProduct = (product?: any) => {
    if (!product) {
      notifications.show({ color: 'yellow', title: 'Atenção', message: 'Selecione um produto primeiro' });
      return;
    }

    if (componentQuantity <= 0) {
      notifications.show({ color: 'yellow', title: 'Atenção', message: 'Quantidade deve ser maior que zero' });
      return;
    }

    // Verifica se o produto já está na composição
    const existingIndex = form.values.componentProducts.findIndex(
      cp => cp.componentProductId === product.id
    );

    if (existingIndex >= 0) {
      // Atualiza quantidade se já existe
      const updated = [...form.values.componentProducts];
      updated[existingIndex].quantity += componentQuantity;
      form.setFieldValue('componentProducts', updated);
    } else {
      // Adiciona novo componente
      const newComponent: ProductComposition = {
        componentProductId: product.id,
        componentProductDescription: product.description,
        quantity: componentQuantity
      };
      form.setFieldValue('componentProducts', [...form.values.componentProducts, newComponent]);
    }

    // Limpa campos
    setComponentSearchTerm('');
    setComponentOptions([]);
    setSelectedComponentValue(null);
    setComponentQuantity(1);
  };

  const removeComponent = (componentProductId: string) => {
    form.setFieldValue(
      'componentProducts',
      form.values.componentProducts.filter(cp => cp.componentProductId !== componentProductId)
    );
  };

  const handleComponentSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchComponentProducts();
    }
  };

  const handleComponentSelect = (productId: string | null) => {
    if (productId) {
      const product = componentOptions.find(p => String(p.id) === productId);
      addComponentToProduct(product);
    }
  };

  const submit = async (values: ProductFormValues) => {
    const validBarcodes = values.barcodes.filter(code => code.trim() !== '');

    if (!values.description || !values.categoryId || !values.cost || !values.price || !values.quantity || !values.unit || validBarcodes.length === 0) {
      notifications.show({
        title: 'Erro',
        message: 'Preencha todos os campos e adicione pelo menos um código de barras',
        color: 'red'
      });
      return;
    }

    // Enviar apenas os códigos de barras válidos e componentProducts no formato correto
    const submitValues = {
      ...values,
      barcodes: validBarcodes,
      componentProducts: values.composite
        ? values.componentProducts.map(cp => ({
          componentProductId: cp.componentProductId,
          quantity: cp.quantity
        }))
        : []
    };

    await genericSubmit(db.products, 'product', id, submitValues, navigate, '/products');
  };

  const { openDeleteModal } = useConfirmDelete();

  const handleDelete = () => {
    openDeleteModal({
      title: 'Excluir Produto',
      message: 'Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        await genericDelete(db.products, 'product', id, navigate, '/products');
      },
    });
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Group justify="space-between" mb="md" style={{ paddingLeft: '2.5rem' }}>
          <Title order={3}>{id ? 'Editar Produto' : 'Novo Produto'}</Title>
          {id && (
            <ActionIcon color="red" variant="light" onClick={handleDelete} size="lg">
              <Trash2 size={20} />
            </ActionIcon>
          )}
        </Group>

        <Paper p="xl" shadow="sm">
          <form onSubmit={form.onSubmit(submit)}>
            <Grid>
              <Grid.Col span={8}>
                <TextInput label="Descrição" placeholder="Descrição" {...form.getInputProps('description')} required />
              </Grid.Col>
              <Grid.Col span={4}>
                <Select
                  label="Categoria"
                  placeholder="Selecione uma categoria"
                  data={categories}
                  {...form.getInputProps('categoryId')}
                  searchable
                  clearable
                  required
                />
              </Grid.Col>
            </Grid>
            <Grid>
              <Grid.Col span={3}>
                <NumberInput
                  label="Custo"
                  {...form.getInputProps('cost')}
                  min={0}
                  decimalScale={2}
                  prefix='R$ '
                  required
                  onBlur={handleCostBlur}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <NumberInput
                  label="Margem (%)"
                  {...form.getInputProps('profitMargin')}
                  min={0}
                  decimalScale={2}
                  required
                  onBlur={handleProfitMarginBlur}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <NumberInput
                  label="Preço"
                  {...form.getInputProps('price')}
                  min={0}
                  decimalScale={2}
                  prefix='R$ '
                  required
                  onBlur={handlePriceBlur}
                />
              </Grid.Col>
              <Grid.Col span={2}>
                <NumberInput
                  label="Quantidade"
                  {...form.getInputProps('quantity')}
                  min={0}
                  decimalScale={3}
                  required
                />
              </Grid.Col>
              <Grid.Col span={1}>
                <Select
                  label="Unidade"
                  placeholder="UN"
                  {...form.getInputProps('unit')}
                  data={[
                    { value: 'UN', label: 'UN' },
                    { value: 'KG', label: 'KG' },
                    { value: 'LT', label: 'LT' },
                    { value: 'PC', label: 'PC' }
                  ]}
                  required
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={12}>
                <Stack gap="xs">
                  <Title order={5}>Códigos de barras</Title>
                  <InputBase
                    component="div"
                    multiline
                    label=""
                    styles={{
                      input: {
                        minHeight: '60px',
                        padding: '8px',
                      }
                    }}
                  >
                    <Pill.Group>
                      {form.values.barcodes
                        .map((code, originalIdx) => ({ code, originalIdx }))
                        .filter(({ code }) => code.trim() !== '')
                        .map(({ code, originalIdx }) => (
                          <Pill
                            key={originalIdx}
                            withRemoveButton
                            onRemove={() => removeBarcode(originalIdx)}
                          >
                            {code}
                          </Pill>
                        ))}
                    </Pill.Group>
                  </InputBase>
                  <TextInput
                    placeholder="Digite um código de barras e pressione Enter"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.currentTarget.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    rightSection={
                      <Button
                        size="xs"
                        onClick={() => addBarcode(barcodeInput)}
                        disabled={!barcodeInput.trim()}
                      >
                        Adicionar
                      </Button>
                    }
                    rightSectionWidth={100}
                  />
                </Stack>
              </Grid.Col>
            </Grid>

            {/* Seção de Produto Composto */}
            <Grid>
              <Grid.Col span={12}>
                <Group align="flex-end" gap="md">
                  <Checkbox
                    label="Produto Composto"
                    {...form.getInputProps('composite', { type: 'checkbox' })}
                    disabled={!id} // Desabilitado na criação, habilitado na edição
                  />
                  {form.values.composite && (
                    <Button
                      variant="light"
                      onClick={() => setComposeModalOpened(true)}
                    >
                      Compor ({form.values.componentProducts.length} {form.values.componentProducts.length === 1 ? 'item' : 'itens'})
                    </Button>
                  )}
                </Group>
              </Grid.Col>
            </Grid>
            <Grid>
              <Grid.Col span={12}>
                <Group mt="md" justify="flex-end">
                  <Button variant="subtle" onClick={() => navigate('/products')}>Cancelar</Button>
                  <Button type="submit">Salvar</Button>
                </Group>
              </Grid.Col>
            </Grid>
          </form>
        </Paper>
      </motion.div>

      {/* Modal de Composição */}
      <Modal
        opened={composeModalOpened}
        onClose={() => setComposeModalOpened(false)}
        title="Compor Produto"
        size="lg"
        centered
      >
        <Stack gap="md">
          {/* Campo de busca de produtos */}
          <Group align="flex-end">
            <NumberInput
              label="Quantidade"
              value={componentQuantity}
              onChange={(val) => setComponentQuantity(Number(val) || 1)}
              min={0.01}
              decimalScale={3}
              fixedDecimalScale={false}
              step={0.01}
              style={{ width: 100 }}
            />
            <Select
              label="Buscar Produto"
              placeholder="Pesquisar..."
              searchable
              searchValue={componentSearchTerm}
              value={selectedComponentValue}
              onSearchChange={setComponentSearchTerm}
              onChange={handleComponentSelect}
              data={componentOptions.map(p => ({ value: String(p.id), label: p.description }))}
              filter={({ options }) => options}
              style={{ flex: 1 }}
              clearable
              onKeyDown={handleComponentSearchKeyDown}
            />
          </Group>

          {/* Tabela de componentes */}
          {form.values.componentProducts.length > 0 && (
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Produto</Table.Th>
                  <Table.Th w={100}>Quantidade</Table.Th>
                  <Table.Th w={50}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {form.values.componentProducts.map((component) => (
                  <Table.Tr key={component.componentProductId}>
                    <Table.Td>{component.componentProductDescription}</Table.Td>
                    <Table.Td>{component.quantity}</Table.Td>
                    <Table.Td>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => removeComponent(component.componentProductId)}
                      >
                        <Trash2 size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {form.values.componentProducts.length === 0 && (
            <Paper p="md" withBorder style={{ textAlign: 'center', color: 'var(--mantine-color-dimmed)' }}>
              Nenhum componente adicionado. Use o campo acima para buscar e adicionar produtos.
            </Paper>
          )}

          <Group justify="flex-end" gap="xs">
            <Button variant="subtle" onClick={() => setComposeModalOpened(false)}>
              Fechar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </MainLayout>
  );
}
