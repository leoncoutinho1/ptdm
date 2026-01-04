import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { ActionIcon, Group, Table, Title, Pagination, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { db, Sale } from '@/utils/db';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/currency';
import { CirclePlus } from 'lucide-react';
import { syncAll } from '@/utils/syncHelper';

export function SaleList() {
    const [items, setItems] = useState<Sale[]>([]);
    const [activePage, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;
    const navigate = useNavigate();

    const fetchItems = useCallback(async (page: number) => {
        try {
            const offset = (page - 1) * pageSize;

            const allItems = await db.sales
                .filter(s => s.syncStatus !== 'pending-delete')
                .toArray();

            // Sort by updatedAt or createdAt (desc)
            allItems.sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                return dateB - dateA;
            });

            const total = allItems.length;
            const data = allItems.slice(offset, offset + pageSize);

            setItems(data);
            setTotalCount(total);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro ao carregar vendas', message: String(err) });
        }
    }, [pageSize]);

    useEffect(() => {
        const performSync = async () => {
            await syncAll();
            fetchItems(activePage);
        };
        performSync();
    }, [activePage, fetchItems]);


    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <MainLayout>
            <Group justify="space-between" mb="md">
                <Title order={3} style={{ paddingLeft: '2.5rem' }}>Vendas</Title>
                <ActionIcon component={Link} to="/sales/new" variant="light" size="lg">
                    <CirclePlus size={20} />
                </ActionIcon>
            </Group>

            <Stack gap="md">
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Data</Table.Th>
                            <Table.Th>Valor Total</Table.Th>
                            <Table.Th>Status</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={3} style={{ textAlign: 'center' }}>Nenhuma venda encontrada.</Table.Td>
                            </Table.Tr>
                        ) : (
                            items.map((item: Sale) => (
                                <Table.Tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/sales/${item.id}`, { state: { item } })}>
                                    <Table.Td>{item.createdAt ? new Date(item.createdAt).toLocaleString("pt-BR") : 'Pendente'}</Table.Td>
                                    <Table.Td>{formatCurrency(item.totalValue)}</Table.Td>
                                    <Table.Td>{item.syncStatus === 'synced' ? 'Sincronizado' : 'Offline'}</Table.Td>
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

