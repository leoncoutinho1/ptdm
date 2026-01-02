import { useEffect, useState } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { ActionIcon, Button, Group, Table, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@/utils/apiHelper';
import { Link, useNavigate } from 'react-router-dom';
import { CirclePlus } from 'lucide-react';

interface Product {
  id?: string | number;
  description: string;
  barcode?: string;
  barcodes?: string[];
  cost: number;
  price: number;
  quantity: number;
}


export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      notifications.show({
        color: 'red',
        title: 'Sem token',
        message: 'Você precisa estar autenticado para ver os produtos.'
      });
      return;
    }

    const fetchProducts = async () => {
      try {
        const result = await apiRequest<any>('product/listproduct');
        setProducts(Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []));
      } catch (err) {
        notifications.show({ color: 'red', title: 'Erro ao carregar produtos', message: String(err) });
      }
    };

    fetchProducts();
  }, []);

  const searchProducts = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { return; }

    if (!search) {
      try {
        const data = await apiRequest<any>('product/listproduct');
        setProducts(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
      } catch (err) {
        notifications.show({ color: 'red', title: 'Erro ao carregar produtos', message: String(err) });
      }
      return;
    }

    try {
      const data = await apiRequest<any>(`product/GetProductByDescOrBarcode/${encodeURIComponent(search)}`);
      setProducts(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro de rede', message: String(err) });
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

  return (
    <MainLayout>
      <Group justify="space-between" mb="md">
        <Title order={3} style={{ paddingLeft: '2.5rem' }}>Produtos</Title>
        <ActionIcon component={Link} to="/products/new" variant="light" size="lg" aria-label="Adicionar">
          <CirclePlus size={20} />
        </ActionIcon>
      </Group>

      <Group mb="md">
        <TextInput value={search} onChange={(e) => setSearch(e.currentTarget.value)} placeholder="Pesquisar por descrição ou código de barras" style={{ flex: 1 }} />
        <Button onClick={searchProducts}>Pesquisar</Button>
        <Button variant="default" onClick={() => { setSearch(''); }}>Limpar</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Descrição</Table.Th>
            <Table.Th>Código de barras</Table.Th>
            <Table.Th>Custo</Table.Th>
            <Table.Th>Preço de venda</Table.Th>
            <Table.Th>Quantidade</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {products.map((p) => (
            <Table.Tr key={p.id ?? (Array.isArray(p.barcodes) ? p.barcodes[0] : p.barcode)} style={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${p.id}`, { state: { product: p } })}>
              <Table.Td>{p.description}</Table.Td>
              <Table.Td>{Array.isArray(p.barcodes) ? p.barcodes.join(', ') : p.barcode}</Table.Td>
              <Table.Td>{formatCurrency(p.cost)}</Table.Td>
              <Table.Td>{formatCurrency(p.price)}</Table.Td>
              <Table.Td>{p.quantity}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </MainLayout>
  );
}
