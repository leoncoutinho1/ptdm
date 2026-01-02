import { useEffect, useState } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { ActionIcon, Button, Group, Table, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@/utils/apiHelper';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/currency';
import { CirclePlus } from 'lucide-react';

interface Sale {
    id?: string | number;
    createdAt: string;
    totalValue: number;
}

export function SaleList() {
    const [items, setItems] = useState<Sale[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const result = await apiRequest<any>('sale/listSale');
                setItems(Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []));
            } catch (err) {
                notifications.show({ color: 'red', title: 'Erro', message: String(err) });
            }
        };
        fetchItems();
    }, []);

    return (
        <MainLayout>
            <Group justify="space-between" mb="md">
                <Title order={3} style={{ paddingLeft: '2.5rem' }}>Vendas</Title>
                <ActionIcon component={Link} to="/sales/new" variant="light" size="lg">
                    <CirclePlus size={20} />
                </ActionIcon>
            </Group>

            <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Data</Table.Th>
                        <Table.Th>Valor Total</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {items.map((item) => (
                        <Table.Tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/sales/${item.id}`, { state: { item } })}>
                            <Table.Td>{new Date(item.createdAt).toLocaleString("pt-BR")}</Table.Td>
                            <Table.Td>{formatCurrency(item.totalValue)}</Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </MainLayout>
    );
}
