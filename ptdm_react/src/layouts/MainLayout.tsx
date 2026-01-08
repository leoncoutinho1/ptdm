import { AppShell, Burger, Group, NavLink, Stack, Title, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, useNavigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, BarChart3, Settings, CreditCard, Users, FolderTree, Monitor, LogOut } from 'lucide-react';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle/ColorSchemeToggle';

export function MainLayout({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Limpa todos os dados de autenticação
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenant');
    localStorage.removeItem('permissions');

    // Redireciona para a página de login
    navigate('/login');
  };

  return (
    <AppShell
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened, desktop: !opened } }}
      padding="md"
    >
      <Burger
        opened={opened}
        onClick={toggle}
        size="sm"
        style={{ position: 'fixed', top: 20, left: 20, zIndex: 1000 }}
      />

      <AppShell.Navbar p="md">
        <Stack>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: 'flex', alignItems: 'top', justifyContent: 'end', height: '2rem' }}>
              <ColorSchemeToggle />
            </div>
            <NavLink
              component={Link}
              to="/products"
              label="Produtos"
              onClick={() => toggle()}
              leftSection={<Package size={18} />}
            />
            <NavLink
              component={Link}
              to="/sales"
              label="Vendas"
              onClick={() => toggle()}
              leftSection={<ShoppingCart size={18} />}
            />
            <NavLink label="Relatórios" leftSection={<BarChart3 size={18} />} >
              <NavLink
                component={Link}
                to="/reports/productsByCategory"
                label="Produtos por categoria"
                onClick={() => toggle()}
                leftSection={<Package size={18} />}
              />
            </NavLink>
            <NavLink label="Configurações" leftSection={<Settings size={18} />}>
              <NavLink
                component={Link}
                to="/settings/payment-forms"
                label="Formas de pagamento"
                onClick={() => toggle()}
                leftSection={<CreditCard size={16} />}
              />
              <NavLink
                component={Link}
                to="/settings/cashiers"
                label="Operadores"
                onClick={() => toggle()}
                leftSection={<Users size={16} />}
              />
              <NavLink
                component={Link}
                to="/settings/categories"
                label="Categorias"
                onClick={() => toggle()}
                leftSection={<FolderTree size={16} />}
              />
              <NavLink
                component={Link}
                to="/settings/checkouts"
                label="Terminais de caixa"
                onClick={() => toggle()}
                leftSection={<Monitor size={16} />}
              />
            </NavLink>

            <Divider my="md" />

            <NavLink
              label="Sair"
              onClick={handleLogout}
              leftSection={<LogOut size={18} />}
              color="red"
              style={{ cursor: 'pointer' }}
            />
          </motion.div>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

