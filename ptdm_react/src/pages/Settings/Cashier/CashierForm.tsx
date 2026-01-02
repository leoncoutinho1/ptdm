import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, Stack, TextInput, Title } from '@mantine/core';
import { MainLayout } from '../../../layouts/MainLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@/utils/apiHelper';

interface CashierValues {
    id?: string | number;
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
            apiRequest<any>(`cashier/${id}`).then((found) => {
                if (found) form.setValues({ name: found.name });
            }).catch(err => notifications.show({ color: 'red', title: 'Erro', message: String(err) }));
        }
    }, [id, item]);

    const submit = async (values: CashierValues) => {
        try {
            if (id) {
                await apiRequest(`cashier/${id}`, 'PUT', { ...values, id });
            } else {
                await apiRequest('cashier', 'POST', values);
            }
            notifications.show({ color: 'green', title: 'Sucesso', message: 'Salvo com sucesso.' });
            navigate('/settings/cashiers');
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro', message: String(err) });
        }
    };

    return (
        <MainLayout>
            <Group justify="space-between" mb="md">
                <Title order={3} style={{ paddingLeft: '2.5rem' }}>{id ? 'Editar Operador' : 'Novo Operador'}</Title>
            </Group>

            <form onSubmit={form.onSubmit(submit)}>
                <Stack>
                    <TextInput label="Nome" {...form.getInputProps('name')} required />
                    <Button type="submit">Salvar</Button>
                </Stack>
            </form>
        </MainLayout>
    );
}
