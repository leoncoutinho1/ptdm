import { ColorSchemeToggle } from "@/components/ColorSchemeToggle/ColorSchemeToggle";
import { AuthContext } from "@/contexts/AuthContext";
import { IAuthenticate } from "@/models/IAuthenticate";
import { Group, PasswordInput, TextInput, Text, Button, Stack, Paper, PaperProps } from "@mantine/core";
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useContext } from "react";
import { apiRequest, saveAuthData, getTenant } from '@/utils/apiHelper';
import { useNavigate } from "react-router-dom";
import { syncAllWorker } from "@/utils/syncHelperWorker";

const defaultValues: IAuthenticate = {
    email: '',
    password: ''
}

export function Login(props: PaperProps) {
    const navigate = useNavigate();
    const { setIsAuth } = useContext(AuthContext);
    const form = useForm({
        initialValues: defaultValues,
        validate: {
            email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
            password: (val) => (val.length < 8 ? 'Password should include at least 6 characters' : null),
        },
    });

    const authenticate = async (form: IAuthenticate) => {
        try {
            const data = await apiRequest<{ accessToken: string; refreshToken: string }>('login/authenticate', 'POST', form);
            const tenant = getTenant();
            await saveAuthData(data.accessToken, data.refreshToken, tenant);
            setIsAuth(true);

            // Aguardar um momento para garantir que os tokens sejam salvos no IndexedDB
            // antes de iniciar a sincronização
            setTimeout(() => {
                syncAllWorker().catch(err => {
                    console.error('Erro ao sincronizar após login:', err);
                });
            }, 500);

            navigate("/home");
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro ao realizar login', message: String(err) });
        }
    }

    return (
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
                </Stack>

                <Group justify="space-between" mt="xl">
                    <Button type="submit" radius="xl">
                        Entrar
                    </Button>
                </Group>
            </form>
        </Paper>
    );
}

