import { useEffect, useState } from 'react';
import { Title, MultiSelect, Button, Group, Stack, Paper } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { db } from '@/utils/db';
import { getAuthData } from '@/utils/apiHelper';
import { MainLayout } from '../../../layouts/MainLayout';

export function ProductsReport() {
    const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        db.categories.toArray().then((data) => {
            setCategories(data.map((c) => ({ value: c.id, label: c.description })));
        });
    }, []);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const auth = await getAuthData();
            const token = auth?.accessToken || null;

            const response = await fetch('/stock/api/Reports/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ categoryIds: selectedCategories.length > 0 ? selectedCategories : null }),
            });

            if (!response.ok) {
                let errorMsg = 'Erro ao gerar relatório';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {
                    // Ignore parsing error
                }
                throw new Error(errorMsg);
            }

            const blob = await response.blob();
            
            // Extract filename from Content-Disposition header if possible
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'relatorio_produtos.pdf';
            if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            notifications.show({
                color: 'green',
                title: 'Sucesso',
                message: 'Relatório gerado com sucesso.',
            });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro', message: String(err) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <Title order={3} mb="md" style={{ paddingLeft: '2.5rem' }}>Relatório de Produtos</Title>
            
            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <Stack>
                    <MultiSelect
                        label="Categorias"
                        placeholder="Selecione as categorias correspondentes (vazio para todas)"
                        data={categories}
                        value={selectedCategories}
                        onChange={setSelectedCategories}
                        searchable
                        clearable
                    />

                    <Group justify="flex-end" mt="md">
                        <Button onClick={handleGenerateReport} loading={loading}>
                            Gerar Relatório
                        </Button>
                    </Group>
                </Stack>
            </Paper>
        </MainLayout>
    );
}