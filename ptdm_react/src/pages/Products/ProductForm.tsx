import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, NumberInput, Select, Stack, TextInput, Title } from '@mantine/core';
import { MainLayout } from '../../layouts/MainLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@/utils/apiHelper';

interface ProductFormValues {
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
  const product = (location.state as any)?.product as Partial<ProductFormValues & { id: string | number }> | undefined;

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
        const result = await apiRequest<any>('category/listCategory');
        const data = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
        setCategories(data.map((cat: any) => ({ value: String(cat.id), label: cat.description })));
      } catch (err) {
        console.error('Erro ao buscar categorias', err);
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
      const fetchOne = async () => {
        try {
          const data = await apiRequest<any>('product/listproduct');
          const found = Array.isArray(data) ? data.find((p: any) => String(p.id) === String(id)) : undefined;
          if (found) {
            form.setValues({
              description: found.description ?? '',
              cost: Number(found.cost ?? 0),
              price: Number(found.price ?? 0),
              quantity: Number(found.quantity ?? 0),
              barcodes: found.barcodes && Array.isArray(found.barcodes) ? found.barcodes : found.barcode ? [found.barcode] : [''],
              categoryId: String(found.categoryId ?? '')
            });
          } else {
            notifications.show({ color: 'yellow', title: 'Produto não encontrado', message: 'Não foi possível carregar o produto.' });
          }
        } catch (err) {
          notifications.show({ color: 'red', title: 'Erro de rede', message: String(err) });
        }
      };
      fetchOne();
    }
  }, [id]);

  const addBarcode = () => {
    form.setFieldValue('barcodes', [...form.values.barcodes, '']);
  };

  const removeBarcode = (index: number) => {
    const next = form.values.barcodes.slice();
    next.splice(index, 1);
    form.setFieldValue('barcodes', next.length ? next : ['']);
  };

  const submit = async (values: ProductFormValues) => {
    try {
      if (id) {
        await apiRequest(`product/${id}`, 'PUT', { ...values, id });
      } else {
        await apiRequest('product', 'POST', values);
      }
      notifications.show({ color: 'green', title: 'Sucesso', message: 'Produto salvo com sucesso.' });
      navigate('/products');
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao salvar', message: 'Verifique os dados e tente novamente.' });
      console.error(err);
    }
  };

  return (
    <MainLayout>
      <Group justify="space-between" mb="md">
        <Title order={3} style={{ paddingLeft: '2.5rem' }}>{id ? 'Editar Produto' : 'Novo Produto'}</Title>
      </Group>

      <form onSubmit={form.onSubmit(submit)}>
        <Stack>
          <TextInput label="Descrição" placeholder="Descrição" value={form.values.description} onChange={(e) => form.setFieldValue('description', e.currentTarget.value)} required />
          <Select
            label="Categoria"
            placeholder="Selecione uma categoria"
            data={categories}
            value={form.values.categoryId}
            onChange={(val) => form.setFieldValue('categoryId', val || '')}
            searchable
            clearable
          />
          <NumberInput label="Custo" value={form.values.cost} onChange={(v) => form.setFieldValue('cost', Number(v ?? 0))} min={0} />
          <NumberInput label="Preço" value={form.values.price} onChange={(v) => form.setFieldValue('price', Number(v ?? 0))} min={0} />
          <NumberInput label="Quantidade" value={form.values.quantity} onChange={(v) => form.setFieldValue('quantity', Number(v ?? 0))} min={0} />

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

          <Group mt="md">
            <Button type="submit">Salvar</Button>
          </Group>
        </Stack>
      </form>
    </MainLayout>
  );
}
