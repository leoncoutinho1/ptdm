import { useEffect, useState } from 'react';
import { Title, MultiSelect, Button, Group, Stack, Paper, Switch } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { db } from '@/utils/db';
import { getAuthData } from '@/utils/apiHelper';
import { MainLayout } from '../../../layouts/MainLayout';

export function SalesReport() {
    const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [initialDate, setInitialDate] = useState<string | null>(null);
    const [finalDate, setFinalDate] = useState<string | null>(null);
    const [detailed, setDetailed] = useState(true);
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

            const body = {
                initialDate: initialDate ? new Date(initialDate).toISOString() : null,
                finalDate: finalDate ? new Date(finalDate).toISOString() : null,
                categoryIds: selectedCategories.length > 0 ? selectedCategories : null,
                detailed,
            };

            const response = await fetch('/stock/api/Reports/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(body),
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

            // Extrai o nome do arquivo do header se disponível
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'relatorio_vendas.pdf';
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
                message: 'Relatório de vendas gerado com sucesso.',
            });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro', message: String(err) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <Title order={3} mb="md" style={{ paddingLeft: '2.5rem' }}>Relatório de Vendas</Title>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <Stack>
                    <Group grow>
                        <DatePickerInput
                            label="Data inicial"
                            placeholder="Selecione a data inicial"
                            value={initialDate}
                            onChange={setInitialDate}
                            clearable
                            locale="pt-BR"
                        />
                        <DatePickerInput
                            label="Data final"
                            placeholder="Selecione a data final"
                            value={finalDate}
                            onChange={setFinalDate}
                            clearable
                            locale="pt-BR"
                        />
                    </Group>

                    <MultiSelect
                        label="Categorias"
                        placeholder="Selecione as categorias (vazio para todas)"
                        data={categories}
                        value={selectedCategories}
                        onChange={setSelectedCategories}
                        searchable
                        clearable
                    />

                    <Switch
                        label="Relatório detalhado (exibir produtos por categoria)"
                        checked={detailed}
                        onChange={(e) => setDetailed(e.currentTarget.checked)}
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
