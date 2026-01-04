import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { ActionIcon, Button, Group, Table, TextInput, Title, Pagination, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { db, Product } from '@/utils/db';
import { Link, useNavigate } from 'react-router-dom';
import { CirclePlus } from 'lucide-react';

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [activePage, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const navigate = useNavigate();

  const fetchProducts = useCallback(async (page: number, searchString: string = '') => {
    try {
      const offset = (page - 1) * pageSize;

      let collection = db.products.filter(p => p.syncStatus !== 'pending-delete');

      if (searchString) {
        const lowerSearch = searchString.toLowerCase();
        const barcodeCollection = db.products.filter(p =>
          p.syncStatus !== 'pending-delete' &&
          (Array.isArray(p.barcodes) && p.barcodes.some(b => b.toLowerCase() === lowerSearch))
        );

        if (await barcodeCollection.count() === 1) {
          collection = barcodeCollection;
        } else {
          collection = db.products.filter(p =>
            p.syncStatus !== 'pending-delete' &&
            p.description.toLowerCase().includes(lowerSearch)
          );
        }
      }

      const total = await collection.count();
      const data = await collection
        .offset(offset)
        .limit(pageSize)
        .toArray();

      data.sort((a, b) => a.description.localeCompare(b.description));

      setProducts(data);
      setTotalCount(total);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao carregar produtos', message: String(err) });
    }
  }, [pageSize]);

  useEffect(() => {
    fetchProducts(activePage, search);
  }, [activePage, fetchProducts]);

  const handleSearch = () => {
    setPage(1);
    fetchProducts(1, search);
  };

  const handleClear = () => {
    setSearch('');
    setPage(1);
    fetchProducts(1, '');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <MainLayout>
      <Group justify="space-between" mb="md">
        <Title order={3} style={{ paddingLeft: '2.5rem' }}>Produtos</Title>
        <ActionIcon component={Link} to="/products/new" variant="light" size="lg" aria-label="Adicionar">
          <CirclePlus size={20} />
        </ActionIcon>
      </Group>

      <Group mb="md">
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder="Pesquisar por descrição ou código de barras"
          style={{ flex: 1 }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch}>Pesquisar</Button>
        <Button variant="default" onClick={handleClear}>Limpar</Button>
      </Group>

      <Stack gap="md">
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
            {products.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: 'center' }}>Nenhum produto encontrado.</Table.Td>
              </Table.Tr>
            ) : (
              products.map((p) => (
                <Table.Tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${p.id}`, { state: { product: p } })}>
                  <Table.Td>{p.description}</Table.Td>
                  <Table.Td>{Array.isArray(p.barcodes) ? p.barcodes.join(', ') : (p as any).barcode}</Table.Td>
                  <Table.Td>{formatCurrency(p.cost)}</Table.Td>
                  <Table.Td>{formatCurrency(p.price)}</Table.Td>
                  <Table.Td>{p.quantity}</Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        {totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination total={totalPages} value={activePage} onChange={setPage} />
          </Group>
        )}
      </Stack>
    </MainLayout>
  );
}

