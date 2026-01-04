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

interface CategoryValues {
    id?: string;
    description: string;
}

export function CategoryForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const item = (location.state as any)?.item as CategoryValues | undefined;

    const form = useForm<CategoryValues>({
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
            apiRequest<CategoryValues>(`category/${id}`).then((found) => {
                const data = (found as any).data || found;
                if (data) form.setValues({ description: data.description || data.Description });
            }).catch(err => notifications.show({ color: 'red', title: 'Erro', message: String(err) }));
        }
    }, [id, item]);

    const submit = async (values: CategoryValues) => {
        await genericSubmit(db.categories, 'category', id, values, navigate, '/settings/categories');
    };

    const handleDelete = async () => {
        await genericDelete(db.categories, 'category', id, navigate, '/settings/categories');
    };

    return (
        <MainLayout>
            <Group justify="space-between" mb="md" style={{ paddingLeft: '2.5rem' }}>
                <Title order={3}>{id ? 'Editar Categoria' : 'Nova Categoria'}</Title>
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
                        placeholder="Ex: Bebidas, Alimentos, etc."
                        {...form.getInputProps('description')}
                        required
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => navigate('/settings/categories')}>Cancelar</Button>
                        <Button type="submit">Salvar</Button>
                    </Group>
                </Stack>
            </form>
        </MainLayout>
    );
}
