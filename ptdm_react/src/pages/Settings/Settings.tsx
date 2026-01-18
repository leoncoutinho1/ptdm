import { MainLayout } from '../../layouts/MainLayout';
import { Title, Stack, Card, Text, Button, Group, Badge, Paper } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useSyncWorker } from '@/hooks/useSyncWorker';
import { Settings as SettingsIcon, RefreshCw, Database, Users, CreditCard, ShoppingCart, FolderTree } from 'lucide-react';

export function Settings() {
    const { lastSync, isSyncing, forceSync } = useSyncWorker();

    const formatLastSync = (timestamp: string | null) => {
        if (!timestamp) return 'Nunca';
        const date = new Date(timestamp);
        return date.toLocaleString('pt-BR');
    };

    const settingsGroups = [
        {
            title: 'Cadastros',
            icon: <Database size={20} />,
            items: [
                { label: 'Categorias', path: '/settings/categories' },
                { label: 'Produtos', path: '/products' },
            ]
        },
        {
            title: 'Vendas',
            icon: <ShoppingCart size={20} />,
            items: [
                { label: 'Caixas', path: '/settings/cashiers' },
                { label: 'Checkouts', path: '/settings/checkouts' },
                { label: 'Formas de Pagamento', path: '/settings/payment-forms' },
            ]
        }
    ];

    return (
        <MainLayout>
            <Stack gap="md">
                <Group justify="space-between" mb="md">
                    <Title order={3} style={{ paddingLeft: '2.5rem' }}>
                        <Group gap="xs">
                            <SettingsIcon size={24} />
                            Configurações
                        </Group>
                    </Title>
                </Group>

                {/* Sync Status Card */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="lg" fw={500}>Sincronização</Text>
                                <Text size="sm" c="dimmed">
                                    Última sincronização: {formatLastSync(lastSync)}
                                </Text>
                            </div>
                            <Badge color={isSyncing ? 'blue' : 'green'} variant="light">
                                {isSyncing ? 'Sincronizando...' : 'Ativo'}
                            </Badge>
                        </Group>

                        <Paper p="md" withBorder>
                            <Stack gap="xs">
                                <Text size="sm" fw={500}>Sincronização Automática</Text>
                                <Text size="xs" c="dimmed">
                                    A sincronização automática está ativa e executa a cada 3 minutos.
                                    Todos os dados são salvos primeiro no dispositivo e sincronizados
                                    automaticamente com o servidor em segundo plano.
                                </Text>
                            </Stack>
                        </Paper>

                        <Button
                            leftSection={<RefreshCw size={16} />}
                            onClick={forceSync}
                            loading={isSyncing}
                            fullWidth
                        >
                            Sincronizar Agora
                        </Button>
                    </Stack>
                </Card>

                {/* Settings Groups */}
                {settingsGroups.map((group) => (
                    <Card key={group.title} shadow="sm" padding="lg" radius="md" withBorder>
                        <Stack gap="md">
                            <Group gap="xs">
                                {group.icon}
                                <Text size="lg" fw={500}>{group.title}</Text>
                            </Group>
                            <Stack gap="xs">
                                {group.items.map((item) => (
                                    <Button
                                        key={item.path}
                                        component={Link}
                                        to={item.path}
                                        variant="light"
                                        fullWidth
                                        justify="flex-start"
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                            </Stack>
                        </Stack>
                    </Card>
                ))}
            </Stack>
        </MainLayout>
    );
}
