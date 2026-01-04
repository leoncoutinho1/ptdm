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

interface CheckoutValues {
    id?: string;
    name: string;
}

export function CheckoutForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const item = (location.state as any)?.item as CheckoutValues | undefined;

    const form = useForm<CheckoutValues>({
        initialValues: {
            name: '',
        }
    });

    useEffect(() => {
        if (item) {
            form.setValues({ name: item.name });
        } else if (id) {
            apiRequest<CheckoutValues>(`checkout/${id}`).then((found) => {
                const data = (found as any).data || found;
                if (data) form.setValues({ name: data.name || data.Name });
            }).catch(err => notifications.show({ color: 'red', title: 'Erro', message: String(err) }));
        }
    }, [id, item]);

    const submit = async (values: CheckoutValues) => {
        await genericSubmit(db.checkouts, 'checkout', id, values, navigate, '/settings/checkouts');
    };

    const handleDelete = async () => {
        await genericDelete(db.checkouts, 'checkout', id, navigate, '/settings/checkouts');
    };

    return (
        <MainLayout>
            <Group justify="space-between" mb="md" style={{ paddingLeft: '2.5rem' }}>
                <Title order={3}>{id ? 'Editar Terminal' : 'Novo Terminal'}</Title>
                {id && (
                    <ActionIcon color="red" variant="light" onClick={handleDelete} size="lg">
                        <Trash2 size={20} />
                    </ActionIcon>
                )}
            </Group>

            <form onSubmit={form.onSubmit(submit)}>
                <Stack>
                    <TextInput label="Descrição" {...form.getInputProps('name')} required />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => navigate('/settings/checkouts')}>Cancelar</Button>
                        <Button type="submit">Salvar</Button>
                    </Group>
                </Stack>
            </form>
        </MainLayout>
    );
}
