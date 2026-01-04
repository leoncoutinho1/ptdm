import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../../../layouts/MainLayout';
import { ActionIcon, Group, Table, Title, Pagination, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { db, Category } from '@/utils/db';
import { syncCategories } from '@/utils/categorySync';
import { Link, useNavigate } from 'react-router-dom';
import { CirclePlus } from 'lucide-react';

export function CategoryList() {
    const [items, setItems] = useState<Category[]>([]);
    const [activePage, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;
    const navigate = useNavigate();

    const fetchItems = useCallback(async (page: number) => {
        try {
            const offset = (page - 1) * pageSize;

            // Fetch from local IndexedDB, excluding items marked for deletion
            const collection = db.categories.filter(c => c.syncStatus !== 'pending-delete');

            const total = await collection.count();
            const data = await collection
                .offset(offset)
                .limit(pageSize)
                .toArray();

            // Dexie filtering doesn't support orderBy on filtered collections directly without indices or sorting in memory
            // Since we want description order, let's sort in memory for now or just use description index if possible.
            // But 'filter' returns a collection where we can't easily use description index.
            // Let's sort manually for better UX.
            data.sort((a, b) => a.description.localeCompare(b.description));

            setItems(data);
            setTotalCount(total);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro ao carregar categorias', message: String(err) });
        }
    }, [pageSize]);

    // Initial sync and setup listener for changes
    useEffect(() => {
        const performSync = async () => {
            await syncCategories();
            fetchItems(activePage);
        };

        performSync();

        // If the service worker is available, we can also request a sync
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SYNC_CATEGORIES' });
        }
    }, [activePage, fetchItems]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <MainLayout>
            <Group justify="space-between" mb="md">
                <Title order={3} style={{ paddingLeft: '2.5rem' }}>Categorias</Title>
                <ActionIcon component={Link} to="/settings/categories/new" variant="light" size="lg">
                    <CirclePlus size={20} />
                </ActionIcon>
            </Group>

            <Stack gap="md">
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Descrição</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items.length === 0 ? (
                            <Table.Tr>
                                <Table.Td style={{ textAlign: 'center' }}>Nenhuma categoria encontrada.</Table.Td>
                            </Table.Tr>
                        ) : (
                            items.map((item) => (
                                <Table.Tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/settings/categories/${item.id}`, { state: { item } })}>
                                    <Table.Td>{item.description}</Table.Td>
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

