import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, Stack, TextInput, Title, ActionIcon } from '@mantine/core';
import { MainLayout } from '../../../layouts/MainLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { db } from '@/utils/db';
import { genericSubmit, genericDelete } from '@/utils/syncHelper';
import { Trash2 } from 'lucide-react';
import { useConfirmDelete } from '@/hooks/useConfirmModal';

interface SupplierValues {
    id?: string;
    description: string;
}

export function SupplierForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const item = (location.state as any)?.item as SupplierValues | undefined;

    const form = useForm<SupplierValues>({
        initialValues: {
            description: '',
        },
        validate: {
            description: (value) => (value.length < 2 ? 'Descrição deve ter pelo menos 2 caracteres' : null),
        },
    });

    useEffect(() => {
        if (item) {
            form.setValues({ description: item.description });
        } else if (id) {
            db.suppliers.get(id).then((found) => {
                if (found) form.setValues({ description: found.description });
            });
        }
    }, [id, item]);

    const submit = async (values: SupplierValues) => {
        await genericSubmit(db.suppliers, 'supplier', id, values, navigate, '/settings/suppliers');
    };

    const { openDeleteModal } = useConfirmDelete();

    const handleDelete = () => {
        openDeleteModal({
            title: 'Excluir Fornecedor',
            message: 'Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.',
            onConfirm: async () => {
                await genericDelete(db.suppliers, 'supplier', id, navigate, '/settings/suppliers');
            },
        });
    };

    return (
        <MainLayout>
            <Group justify="space-between" mb="md" style={{ paddingLeft: '2.5rem' }}>
                <Title order={3}>{id ? 'Editar Fornecedor' : 'Novo Fornecedor'}</Title>
                {id && (
                    <ActionIcon color="red" variant="light" onClick={handleDelete} size="lg">
                        <Trash2 size={20} />
                    </ActionIcon>
                )}
            </Group>

            <form onSubmit={form.onSubmit(submit)}>
                <Stack>
                    <TextInput
                        label="Descrição"
                        placeholder="Ex: Fornecedor de Bebidas LTDA, Distribuidora XYZ, etc."
                        {...form.getInputProps('description')}
                        required
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => navigate('/settings/suppliers')}>Cancelar</Button>
                        <Button type="submit">Salvar</Button>
                    </Group>
                </Stack>
            </form>
        </MainLayout>
    );
}
