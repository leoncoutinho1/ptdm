import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../../../layouts/MainLayout';
import { ActionIcon, Group, Table, Title, Pagination, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { db, Cashier } from '@/utils/db';
import { syncCategories } from '@/utils/categorySync';
import { Link, useNavigate } from 'react-router-dom';
import { CirclePlus } from 'lucide-react';

export function CashierList() {
    const [items, setItems] = useState<Cashier[]>([]);
    const [activePage, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;
    const navigate = useNavigate();

    const fetchItems = useCallback(async (page: number) => {
        try {
            const offset = (page - 1) * pageSize;

            const collection = db.cashiers.filter(c => c.syncStatus !== 'pending-delete');
            const total = await collection.count();
            const data = await collection
                .offset(offset)
                .limit(pageSize)
                .toArray();

            data.sort((a, b) => a.name.localeCompare(b.name));

            setItems(data);
            setTotalCount(total);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro ao carregar operadores', message: String(err) });
        }
    }, [pageSize]);

    useEffect(() => {
        const performSync = async () => {
            await syncCategories();
            fetchItems(activePage);
        };
        performSync();

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SYNC_CATEGORIES' });
        }
    }, [activePage, fetchItems]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <MainLayout>
            <Group justify="space-between" mb="md">
                <Title order={3} style={{ paddingLeft: '2.5rem' }}>Operadores de Caixa</Title>
                <ActionIcon component={Link} to="/settings/cashiers/new" variant="light" size="lg">
                    <CirclePlus size={20} />
                </ActionIcon>
            </Group>

            <Stack gap="md">
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Nome</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items.length === 0 ? (
                            <Table.Tr>
                                <Table.Td style={{ textAlign: 'center' }}>Nenhum operador encontrado.</Table.Td>
                            </Table.Tr>
                        ) : (
                            items.map((item) => (
                                <Table.Tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/settings/cashiers/${item.id}`, { state: { item } })}>
                                    <Table.Td>{item.name}</Table.Td>
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

