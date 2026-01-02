import { useEffect, useState } from 'react';
import { MainLayout } from '../../../layouts/MainLayout';
import { ActionIcon, Button, Group, Table, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@/utils/apiHelper';
import { Link, useNavigate } from 'react-router-dom';
import { CirclePlus } from 'lucide-react';

interface PaymentForm {
    id?: string | number;
    description: string;
}

export function PaymentFormList() {
    const [items, setItems] = useState<PaymentForm[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const result = await apiRequest<any>('paymentForm/ListPaymentForm');
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
                <Title order={3} style={{ paddingLeft: '2.5rem' }}>Formas de Pagamento</Title>
                <ActionIcon component={Link} to="/settings/payment-forms/new" variant="light" size="lg">
                    <CirclePlus size={20} />
                </ActionIcon>
            </Group>

            <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Descrição</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {items.map((item) => (
                        <Table.Tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/settings/payment-forms/${item.id}`, { state: { item } })}>
                            <Table.Td>{item.description}</Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </MainLayout>
    );
}
