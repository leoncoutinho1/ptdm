import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../../../layouts/MainLayout';
import { ActionIcon, Group, Table, Title, Pagination, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@/utils/apiHelper';
import { Link, useNavigate } from 'react-router-dom';
import { CirclePlus } from 'lucide-react';

interface Category {
    id?: string;
    description: string;
}

export function CategoryList() {
    const [items, setItems] = useState<Category[]>([]);
    const [activePage, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;
    const navigate = useNavigate();

    const fetchItems = useCallback(async (page: number) => {
        try {
            const offset = (page - 1) * pageSize;
            const result = await apiRequest<any>(`category/listCategory?Limit=${pageSize}&Offset=${offset}`);

            const data = result.data || [];
            const total = result.totalCount || 0;

            setItems(data);
            setTotalCount(total);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro', message: String(err) });
        }
    }, [pageSize]);

    useEffect(() => {
        fetchItems(activePage);
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
                        {items.map((item) => (
                            <Table.Tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/settings/categories/${item.id}`, { state: { item } })}>
                                <Table.Td>{item.description}</Table.Td>
                            </Table.Tr>
                        ))}
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

