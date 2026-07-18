import { ColorSchemeToggle } from "@/components/ColorSchemeToggle/ColorSchemeToggle";
import { AuthContext } from "@/contexts/AuthContext";
import { IAuthenticate } from "@/models/IAuthenticate";
import { Group, PasswordInput, TextInput, Text, Button, Stack, Paper, PaperProps, Loader } from "@mantine/core";
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useContext, useState } from "react";
import { apiRequest, saveAuthData } from '@/utils/apiHelper';
import { useNavigate } from "react-router-dom";
import { syncAllWorker } from "@/utils/syncHelperWorker";
import { db } from "@/utils/db";

const defaultValues: IAuthenticate = {
    email: '',
    password: '',
    tenant: ''
}

export function Login(props: PaperProps) {
    const navigate = useNavigate();
    const { setIsAuth } = useContext(AuthContext);
    const [syncingAfterLogin, setSyncingAfterLogin] = useState(false);
    
    const form = useForm({
        initialValues: defaultValues,
        validate: {
            email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
            password: (val) => (val.length < 8 ? 'Password should include at least 8 characters' : null),
            tenant: (val) => (val.length === 0 ? 'Tenant is required' : null),
        },
    });

    const authenticate = async (form: IAuthenticate) => {
        try {
            const data = await apiRequest<{ accessToken: string; refreshToken: string }>('Login/authenticate', 'POST', form);
            setSyncingAfterLogin(true);

            // 1. Limpa todas as tabelas locais (exceto a de autenticação que será rescrita)
            await Promise.all([
                db.categories.clear(),
                db.suppliers.clear(),
                db.payables.clear(),
                db.cashiers.clear(),
                db.checkouts.clear(),
                db.paymentForms.clear(),
                db.products.clear(),
                db.sales.clear(),
                db.syncLogs.clear(),
                db.syncMeta.clear()
            ]);

            // 2. Salva os novos dados de autenticação na base limpa
            await saveAuthData(data.accessToken, data.refreshToken, form.tenant);
            setIsAuth(true);

            // 3. Aguarda a sincronização completa de todas as tabelas
            try {
                await syncAllWorker();
            } catch (syncErr) {
                console.error('Erro na sincronização inicial das tabelas:', syncErr);
                notifications.show({
                    color: 'yellow',
                    title: 'Sincronização parcial',
                    message: 'Alguns dados locais podem não estar completamente atualizados.',
                });
            }

            setSyncingAfterLogin(false);
            navigate("/home");
        } catch (err) {
            setSyncingAfterLogin(false);
            notifications.show({ color: 'red', title: 'Erro ao realizar login', message: 'Login inválido' });
        }
    }

    return (
        <>
            {syncingAfterLogin && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                    color: '#fff'
                }}>
                    <Loader size="xl" color="blue" />
                    <Text mt="md" size="lg" fw={500}>Atualizando tabelas</Text>
                </div>
            )}
            
            <Paper radius="md" p="lg" withBorder {...props} style={{ width: '65%', margin: '25vh auto', marginTop: '25vh' }} >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <Text size="lg" fw={500}>
                            Welcome to PDV
                        </Text>
                    </div>
                    <ColorSchemeToggle />
                </div>

                <form onSubmit={form.onSubmit((form) => authenticate(form))}>
                    <Stack>
                        <TextInput
                            required
                            label="Email"
                            placeholder="hello@mantine.dev"
                            value={form.values.email}
                            onChange={(event) => form.setFieldValue('email', event.currentTarget.value)}
                            error={form.errors.email && 'Invalid email'}
                            radius="md"
                        />

                        <PasswordInput
                            required
                            label="Password"
                            placeholder="Your password"
                            value={form.values.password}
                            onChange={(event) => form.setFieldValue('password', event.currentTarget.value)}
                            error={form.errors.password && 'Password should include at least 8 characters'}
                            radius="md"
                        />

                        <TextInput
                            required
                            label="Tenant"
                            placeholder="Your tenant name"
                            value={form.values.tenant}
                            onChange={(event) => form.setFieldValue('tenant', event.currentTarget.value.toLowerCase())}
                            error={form.errors.tenant && 'Tenant is required'}
                            radius="md"
                        />
                    </Stack>

                    <Group justify="space-between" mt="xl">
                        <Button type="submit" radius="xl">
                            Entrar
                        </Button>
                    </Group>
                </form>
            </Paper>
        </>
    );
}

