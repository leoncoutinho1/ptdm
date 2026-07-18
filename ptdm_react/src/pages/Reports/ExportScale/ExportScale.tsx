import { useEffect, useState } from 'react';
import { Title, Button, Group, Stack, Paper, Text, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { db } from '@/utils/db';
import { getAuthData } from '@/utils/apiHelper';
import { syncAllWorker } from '@/utils/syncHelperWorker';
import { MainLayout } from '../../../layouts/MainLayout';

export function ExportScale() {
    const [productCount, setProductCount] = useState<number | null>(null);
    const [syncing, setSyncing] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const syncAndCountProducts = async () => {
            setSyncing(true);
            try {
                // Sincroniza os produtos com o banco de dados antes da contagem
                await syncAllWorker();
                
                const count = await db.products
                    .filter(p => !!p.integrateScale && p.syncStatus !== 'pending-delete')
                    .count();
                setProductCount(count);
            } catch (err) {
                console.error('Erro ao sincronizar e contar produtos', err);
                notifications.show({
                    color: 'yellow',
                    title: 'Sincronização offline',
                    message: 'Não foi possível sincronizar com o servidor. Exibindo contagem local.',
                });

                // Fallback para contagem local se a sincronização falhar (ex: sem internet)
                try {
                    const count = await db.products
                        .filter(p => !!p.integrateScale && p.syncStatus !== 'pending-delete')
                        .count();
                    setProductCount(count);
                } catch (localErr) {
                    console.error('Erro ao contar produtos locais', localErr);
                }
            } finally {
                setSyncing(false);
            }
        };

        syncAndCountProducts();
    }, []);

    const handleExport = async () => {
        setLoading(true);
        try {
            const auth = await getAuthData();
            const token = auth?.accessToken || null;

            const response = await fetch('/stock/api/Reports/filizola/cadtxt', {
                method: 'GET',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            if (!response.ok) {
                let errorMsg = 'Erro ao gerar arquivo de exportação';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {
                    // Ignore parsing error
                }
                throw new Error(errorMsg);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cadtxt.txt';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            notifications.show({
                color: 'green',
                title: 'Sucesso',
                message: 'Arquivo cadtxt.txt gerado e baixado com sucesso.',
            });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro', message: String(err) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <Title order={3} mb="md" style={{ paddingLeft: '2.5rem' }}>
                Exportar Produtos para Balança
            </Title>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Esta ferramenta gera um arquivo de texto no padrão **Filizola (cadtxt.txt)** contendo
                        todos os produtos configurados para integração com a balança (`Integrar na Balança` ativado).
                    </Text>

                    <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>
                                Resumo dos dados locais:
                            </Text>
                            <Text size="md">
                                {syncing ? (
                                    <Group gap="xs">
                                        <Loader size="xs" />
                                        <Text size="sm" c="dimmed">Sincronizando dados com o servidor...</Text>
                                    </Group>
                                ) : productCount !== null ? (
                                    <>
                                        Existem <strong>{productCount}</strong> produtos marcados para integração na balança.
                                    </>
                                ) : (
                                    'Carregando informações dos produtos...'
                                )}
                            </Text>
                        </Stack>
                    </Paper>

                    <Group justify="flex-end" mt="md">
                        <Button
                            onClick={handleExport}
                            loading={loading}
                            disabled={syncing || productCount === null || productCount === 0}
                        >
                            Exportar cadtxt.txt
                        </Button>
                    </Group>
                </Stack>
            </Paper>
        </MainLayout>
    );
}
