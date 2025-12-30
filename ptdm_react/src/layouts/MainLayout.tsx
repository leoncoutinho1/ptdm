import { AppShell, Burger, Group, NavLink, Stack, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

export function MainLayout({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure(true);

  return (
    <AppShell
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened, desktop: !opened } }}
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} size="sm" />
          <Title order={3}>PDV</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack>
          <NavLink component={Link} to="/products" label="Produtos" />
          <NavLink component={Link} to="/sales" label="Vendas" />
          <NavLink component={Link} to="/reports" label="Relatórios" />
          <NavLink label="Configurações">
            <NavLink
              component={Link}
              to="/settings/payment-forms"
              label="Formas de pagamento"
            />
            <NavLink
              component={Link}
              to="/settings/cashiers"
              label="Operadores"
            />
            <NavLink
              component={Link}
              to="/settings/checkouts"
              label="Terminais de caixa"
            />
          </NavLink>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

