import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, NumberInput, Select, Stack, TextInput, Title, ActionIcon, Paper, Grid, Pill, InputBase } from '@mantine/core';
import { MainLayout } from '../../layouts/MainLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@/utils/apiHelper';
import { db } from '@/utils/db';
import { genericSubmit, genericDelete } from '@/utils/syncHelper';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConfirmDelete } from '@/hooks/useConfirmModal';

interface ProductFormValues {
  id?: string;
  description: string;
  cost: number;
  profitMargin: number;
  price: number;
  quantity: number;
  barcodes: string[];
  categoryId: string;
}

export function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const product = (location.state as any)?.product as Partial<ProductFormValues> | undefined;
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  const form = useForm<ProductFormValues>({
    initialValues: {
      description: '',
      cost: 0,
      profitMargin: 0,
      price: 0,
      quantity: 0,
      barcodes: [],
      categoryId: ''
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
        barcodes: Array.isArray((product as any).barcodes)
          ? ((product as any).barcodes as string[]).filter(b => b.trim() !== '')
          : (product?.barcodes ? [String(product.barcodes)].filter(b => b.trim() !== '') : []),
        categoryId: String(product.categoryId ?? '')
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
            barcodes: Array.isArray(found.barcodes) ? found.barcodes.filter(b => b.trim() !== '') : [],
            categoryId: String(found.categoryId ?? '')
          });
        } else {
          // Fallback to API
          apiRequest<any>(`product/listproduct`).then(data => {
            const foundApi = Array.isArray(data) ? data.find((p: any) => String(p.id) === String(id)) : undefined;
            if (foundApi) {
              form.setValues({
                description: foundApi.description || foundApi.Description,
                cost: Number(foundApi.cost || foundApi.Cost || 0),
                profitMargin: Number(foundApi.profitMargin || foundApi.ProfitMargin || 0),
                price: Number(foundApi.price || foundApi.Price || 0),
                quantity: Number(foundApi.quantity || foundApi.Quantity || 0),
                barcodes: Array.isArray(foundApi.barcodes)
                  ? foundApi.barcodes.filter((b: string) => b.trim() !== '')
                  : (foundApi.barcode ? [foundApi.barcode].filter((b: string) => b.trim() !== '') : []),
                categoryId: String(foundApi.categoryId || foundApi.CategoryId || '')
              });
            }
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

  const submit = async (values: ProductFormValues) => {
    const validBarcodes = values.barcodes.filter(code => code.trim() !== '');

    if (!values.description || !values.categoryId || !values.cost || !values.price || !values.quantity || validBarcodes.length === 0) {
      notifications.show({
        title: 'Erro',
        message: 'Preencha todos os campos e adicione pelo menos um código de barras',
        color: 'red'
      });
      return;
    }

    // Enviar apenas os códigos de barras válidos
    const submitValues = {
      ...values,
      barcodes: validBarcodes
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
              <Grid.Col span={3}>
                <NumberInput label="Quantidade" {...form.getInputProps('quantity')} min={0} required />
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
    </MainLayout>
  );
}
