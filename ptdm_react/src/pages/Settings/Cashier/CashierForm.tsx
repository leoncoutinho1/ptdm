import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, Stack, TextInput, Title, ActionIcon } from '@mantine/core';
import { MainLayout } from '../../../layouts/MainLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@/utils/apiHelper';
import { db } from '@/utils/db';
import { genericSubmit, genericDelete } from '@/utils/syncHelper';
import { Trash2 } from 'lucide-react';

interface CashierValues {
    id?: string;
    name: string;
}

export function CashierForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const item = (location.state as any)?.item as CashierValues | undefined;

    const form = useForm<CashierValues>({
        initialValues: {
            name: '',
        }
    });

    useEffect(() => {
        if (item) {
            form.setValues({ name: item.name });
        } else if (id) {
            apiRequest<CashierValues>(`cashier/${id}`).then((found) => {
                const data = (found as any).data || found;
                if (data) form.setValues({ name: data.name || data.Name });
            }).catch(err => notifications.show({ color: 'red', title: 'Erro', message: String(err) }));
        }
    }, [id, item]);

    const submit = async (values: CashierValues) => {
        await genericSubmit(db.cashiers, 'cashier', id, values, navigate, '/settings/cashiers');
    };

    const handleDelete = async () => {
        await genericDelete(db.cashiers, 'cashier', id, navigate, '/settings/cashiers');
    };

    return (
        <MainLayout>
            <Group justify="space-between" mb="md" style={{ paddingLeft: '2.5rem' }}>
                <Title order={3}>{id ? 'Editar Operador' : 'Novo Operador'}</Title>
                {id && (
                    <ActionIcon color="red" variant="light" onClick={handleDelete} size="lg">
                        <Trash2 size={20} />
                    </ActionIcon>
                )}
            </Group>

            <form onSubmit={form.onSubmit(submit)}>
                <Stack>
                    <TextInput label="Nome" {...form.getInputProps('name')} required />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => navigate('/settings/cashiers')}>Cancelar</Button>
                        <Button type="submit">Salvar</Button>
                    </Group>
                </Stack>
            </form>
        </MainLayout>
    );
}
