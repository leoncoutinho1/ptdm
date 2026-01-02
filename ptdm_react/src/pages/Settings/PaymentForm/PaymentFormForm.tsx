import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, Stack, TextInput, Title } from '@mantine/core';
import { MainLayout } from '../../../layouts/MainLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@/utils/apiHelper';

interface PaymentFormValues {
    id?: string | number;
    description: string;
}

export function PaymentFormForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const item = (location.state as any)?.item as PaymentFormValues | undefined;

    const form = useForm<PaymentFormValues>({
        initialValues: {
            description: '',
        }
    });

    useEffect(() => {
        if (item) {
            form.setValues({ description: item.description });
        } else if (id) {
            apiRequest<any>(`paymentform/${id}`).then((found) => {
                if (found) form.setValues({ description: found.description });
            }).catch(err => notifications.show({ color: 'red', title: 'Erro', message: String(err) }));
        }
    }, [id, item]);

    const submit = async (values: PaymentFormValues) => {
        try {
            if (id) {
                await apiRequest(`paymentform/${id}`, 'PUT', { ...values, id });
            } else {
                await apiRequest('paymentform', 'POST', values);
            }
            notifications.show({ color: 'green', title: 'Sucesso', message: 'Salvo com sucesso.' });
            navigate('/settings/payment-forms');
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro', message: String(err) });
        }
    };

    return (
        <MainLayout>
            <Group justify="space-between" mb="md">
                <Title order={3} style={{ paddingLeft: '2.5rem' }}>{id ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</Title>
            </Group>

            <form onSubmit={form.onSubmit(submit)}>
                <Stack>
                    <TextInput label="Descrição" {...form.getInputProps('description')} required />
                    <Button type="submit">Salvar</Button>
                </Stack>
            </form>
        </MainLayout>
    );
}
