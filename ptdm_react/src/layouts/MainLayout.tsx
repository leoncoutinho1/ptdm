import { AppShell, Burger, Group, NavLink, Stack, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

export function MainLayout({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure(false);

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
          <NavLink />
          <NavLink component={Link} to="/products" label="Produtos" onClick={() => toggle()} />
          <NavLink component={Link} to="/sales" label="Vendas" onClick={() => toggle()} />
          <NavLink component={Link} to="/reports" label="Relatórios" onClick={() => toggle()} />
          <NavLink label="Configurações">
            <NavLink
              component={Link}
              to="/settings/payment-forms"
              label="Formas de pagamento"
              onClick={() => toggle()}
            />
            <NavLink
              component={Link}
              to="/settings/cashiers"
              label="Operadores"
              onClick={() => toggle()}
            />
            <NavLink
              component={Link}
              to="/settings/categories"
              label="Categorias"
              onClick={() => toggle()}
            />
            <NavLink
              component={Link}
              to="/settings/checkouts"
              label="Terminais de caixa"
              onClick={() => toggle()}
            />
          </NavLink>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

