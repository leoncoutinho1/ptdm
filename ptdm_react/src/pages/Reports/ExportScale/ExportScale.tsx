import { useEffect, useState } from 'react';
import { Title, Button, Group, Stack, Paper, Text, Loader, Table, ScrollArea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { db } from '@/utils/db';
import { getAuthData, apiRequest } from '@/utils/apiHelper';
import { syncAllWorker } from '@/utils/syncHelperWorker';
import { MainLayout } from '../../../layouts/MainLayout';

interface ScaleProduct {
    mainBarcode: string;
    description: string;
    unit: string;
    price: number;
}

export function ExportScale() {
    const [productCount, setProductCount] = useState<number | null>(null);
    const [syncing, setSyncing] = useState(true);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<ScaleProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

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

    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                const data = await apiRequest<ScaleProduct[]>('Reports/filizola/products');
                setProducts(data);
            } catch (err) {
                console.error('Erro ao buscar produtos da balança:', err);
                notifications.show({
                    color: 'red',
                    title: 'Erro',
                    message: 'Não foi possível carregar a lista de produtos da balança.',
                });
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchProducts();
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

                    {loadingProducts ? (
                        <Group justify="center" p="md">
                            <Loader size="md" />
                            <Text size="sm" c="dimmed">Carregando listagem de produtos da balança...</Text>
                        </Group>
                    ) : products.length === 0 ? (
                        <Text size="sm" c="dimmed" ta="center" py="md">
                            Nenhum produto marcado para integração com a balança.
                        </Text>
                    ) : (
                        <Stack gap="xs" mt="md">
                            <Text size="sm" fw={500}>Produtos para exportação:</Text>
                            <ScrollArea h={400} offsetScrollbars>
                                <Table striped highlightOnHover withTableBorder withColumnBorders>
                                    <Table.Thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--mantine-color-body)', zIndex: 1 }}>
                                        <Table.Tr>
                                            <Table.Th style={{ width: '150px' }}>Código Principal</Table.Th>
                                            <Table.Th>Descrição</Table.Th>
                                            <Table.Th style={{ width: '100px', textAlign: 'center' }}>Unidade</Table.Th>
                                            <Table.Th style={{ width: '120px', textAlign: 'right' }}>Preço</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {products.map((item, index) => (
                                            <Table.Tr key={index}>
                                                <Table.Td>{item.mainBarcode || '-'}</Table.Td>
                                                <Table.Td>{item.description}</Table.Td>
                                                <Table.Td style={{ textAlign: 'center' }}>{item.unit}</Table.Td>
                                                <Table.Td style={{ textAlign: 'right' }}>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </ScrollArea>
                        </Stack>
                    )}

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
