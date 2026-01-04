import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, Stack, TextInput, Title, ActionIcon } from '@mantine/core';
import { MainLayout } from '../../../layouts/MainLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@/utils/apiHelper';
import { db, Category } from '@/utils/db';
import { syncCategories } from '@/utils/categorySync';
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
                if (found) form.setValues({ description: found.description });
            }).catch(err => notifications.show({ color: 'red', title: 'Erro', message: String(err) }));
        }
    }, [id, item]);

    // Helper to handle potential PascalCase or wrapped responses from .NET API
    function normalizeCategory(cat: any): Category {
        // If the response is wrapped in a 'data' property (common in some API patterns)
        const data = cat.data ? cat.data : cat;

        return {
            ...data,
            id: String(data.id || data.Id || data.ID || ''),
            description: data.description || data.Description || '',
            updatedAt: data.updatedAt || data.UpdatedAt,
        };
    }

    const submit = async (values: CategoryValues) => {
        const categoryId = id || crypto.randomUUID();
        const categoryData: Category = {
            id: categoryId,
            description: values.description,
            syncStatus: 'pending-save'
        };

        try {
            // Always save locally first for immediate UI update
            await db.categories.put(categoryData);

            if (navigator.onLine) {
                if (id) {
                    await apiRequest(`category/${id}`, 'PUT', { ...values, id });
                    // Mark as synced if no error
                    await db.categories.update(categoryId, { syncStatus: 'synced' });
                } else {
                    const response = await apiRequest<any>('category', 'POST', values);
                    const normalized = normalizeCategory(response);

                    if (!normalized.id) {
                        throw new Error('API não retornou um ID válido para a nova categoria.');
                    }

                    // Update local with server data (true ID and updatedAt)
                    await db.categories.delete(categoryId); // Delete the temporary local entry
                    await db.categories.put({ ...normalized, syncStatus: 'synced' }); // Add the server-synced entry
                }
            }

            notifications.show({ color: 'green', title: 'Sucesso', message: 'Categoria salva localmente e sincronizando.' });
            navigate('/settings/categories');

            // Trigger background sync if possible
            if (navigator.onLine) syncCategories();
        } catch (err) {
            console.error('API sync failed, saved locally:', err);
            notifications.show({
                color: 'blue',
                title: 'Offline',
                message: 'Categoria salva localmente. Será sincronizada quando houver conexão.'
            });
            navigate('/settings/categories');
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;

        try {
            if (navigator.onLine) {
                await apiRequest(`category/${id}`, 'DELETE');
                await db.categories.delete(id);
            } else {
                // Mark for deletion later
                await db.categories.update(id, { syncStatus: 'pending-delete' });
            }

            notifications.show({ color: 'green', title: 'Sucesso', message: 'Excluído com sucesso.' });
            navigate('/settings/categories');
        } catch (err) {
            console.error('Delete failed:', err);
            notifications.show({ color: 'red', title: 'Erro', message: String(err) });
        }
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
