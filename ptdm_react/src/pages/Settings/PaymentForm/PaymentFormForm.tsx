import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, Stack, TextInput, Title, ActionIcon } from '@mantine/core';
import { MainLayout } from '../../../layouts/MainLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { db } from '@/utils/db';
import { genericSubmit, genericDelete } from '@/utils/syncHelper';
import { Trash2 } from 'lucide-react';
import { useConfirmDelete } from '@/hooks/useConfirmModal';

interface PaymentFormValues {
    id?: string;
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
            db.paymentForms.get(id).then((found) => {
                if (found) form.setValues({ description: found.description });
            });
        }
    }, [id, item]);

    const submit = async (values: PaymentFormValues) => {
        await genericSubmit(db.paymentForms, 'paymentform', id, values, navigate, '/settings/payment-forms');
    };

    const { openDeleteModal } = useConfirmDelete();

    const handleDelete = () => {
        openDeleteModal({
            title: 'Excluir Forma de Pagamento',
            message: 'Tem certeza que deseja excluir esta forma de pagamento? Esta ação não pode ser desfeita.',
            onConfirm: async () => {
                await genericDelete(db.paymentForms, 'paymentform', id, navigate, '/settings/payment-forms');
            },
        });
    };

    return (
        <MainLayout>
            <Group justify="space-between" mb="md" style={{ paddingLeft: '2.5rem' }}>
                <Title order={3}>{id ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</Title>
                {id && (
                    <ActionIcon color="red" variant="light" onClick={handleDelete} size="lg">
                        <Trash2 size={20} />
                    </ActionIcon>
                )}
            </Group>

            <form onSubmit={form.onSubmit(submit)}>
                <Stack>
                    <TextInput label="Descrição" {...form.getInputProps('description')} required />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => navigate('/settings/payment-forms')}>Cancelar</Button>
                        <Button type="submit">Salvar</Button>
                    </Group>
                </Stack>
            </form>
        </MainLayout>
    );
}
