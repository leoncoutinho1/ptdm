import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, NumberInput, Select, Stack, TextInput, Title, ActionIcon } from '@mantine/core';
import { MainLayout } from '../../layouts/MainLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@/utils/apiHelper';
import { db } from '@/utils/db';
import { genericSubmit, genericDelete } from '@/utils/syncHelper';
import { Trash2 } from 'lucide-react';

interface ProductFormValues {
  id?: string;
  description: string;
  cost: number;
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

  const form = useForm<ProductFormValues>({
    initialValues: {
      description: '',
      cost: 0,
      price: 0,
      quantity: 0,
      barcodes: [''],
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
        price: Number(product.price ?? 0),
        quantity: Number(product.quantity ?? 0),
        barcodes: Array.isArray((product as any).barcodes) ? ((product as any).barcodes as string[]) : (product?.barcodes ? [String(product.barcodes)] : ['']),
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
            price: Number(found.price ?? 0),
            quantity: Number(found.quantity ?? 0),
            barcodes: Array.isArray(found.barcodes) ? found.barcodes : [''],
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
                price: Number(foundApi.price || foundApi.Price || 0),
                quantity: Number(foundApi.quantity || foundApi.Quantity || 0),
                barcodes: foundApi.barcodes || [foundApi.barcode] || [''],
                categoryId: String(foundApi.categoryId || foundApi.CategoryId || '')
              });
            }
          });
        }
      });
    }
  }, [id, product]);

  const addBarcode = () => {
    form.setFieldValue('barcodes', [...form.values.barcodes, '']);
  };

  const removeBarcode = (index: number) => {
    const next = form.values.barcodes.slice();
    next.splice(index, 1);
    form.setFieldValue('barcodes', next.length ? next : ['']);
  };

  const submit = async (values: ProductFormValues) => {
    if (!values.description || !values.categoryId || !values.cost || !values.price || !values.quantity || !values.barcodes.length || !values.barcodes.every(code => code.trim())) {
      notifications.show({
        title: 'Erro',
        message: 'Preencha todos os campos',
        color: 'red'
      });
      return;
    }
    await genericSubmit(db.products, 'product', id, values, navigate, '/products');
  };

  const handleDelete = async () => {
    await genericDelete(db.products, 'product', id, navigate, '/products');
  };

  return (
    <MainLayout>
      <Group justify="space-between" mb="md" style={{ paddingLeft: '2.5rem' }}>
        <Title order={3}>{id ? 'Editar Produto' : 'Novo Produto'}</Title>
        {id && (
          <ActionIcon color="red" variant="light" onClick={handleDelete} size="lg">
            <Trash2 size={20} />
          </ActionIcon>
        )}
      </Group>

      <form onSubmit={form.onSubmit(submit)}>
        <Stack>
          <TextInput label="Descrição" placeholder="Descrição" {...form.getInputProps('description')} required />
          <Select
            label="Categoria"
            placeholder="Selecione uma categoria"
            data={categories}
            {...form.getInputProps('categoryId')}
            searchable
            clearable
            required
          />
          <NumberInput label="Custo" {...form.getInputProps('cost')} min={0} decimalScale={2} required />
          <NumberInput label="Preço" {...form.getInputProps('price')} min={0} decimalScale={2} required />
          <NumberInput label="Quantidade" {...form.getInputProps('quantity')} min={0} required />

          <Title order={5}>Códigos de barras</Title>
          {form.values.barcodes.map((code, idx) => (
            <Group key={idx} align="flex-end">
              <TextInput style={{ flex: 1 }} value={code} onChange={(e) => {
                const next = form.values.barcodes.slice();
                next[idx] = e.currentTarget.value;
                form.setFieldValue('barcodes', next);
              }} placeholder="Código de barras" />
              <Button variant="default" onClick={() => removeBarcode(idx)}>Remover</Button>
            </Group>
          ))}
          <Button variant="light" onClick={addBarcode}>Adicionar código</Button>

          <Group mt="md" justify="flex-end">
            <Button variant="subtle" onClick={() => navigate('/products')}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </Group>
        </Stack>
      </form>
    </MainLayout>
  );
}
