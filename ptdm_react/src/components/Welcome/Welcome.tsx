import { Anchor, Text, Title } from '@mantine/core';
import classes from './Welcome.module.css';
import { MainLayout } from '@/layouts/MainLayout';

export function Welcome() {
  return (
    <MainLayout>
      <Title className={classes.title} ta="center" mt={100}>
        <Text inherit variant="gradient" component="span" gradient={{ from: 'pink', to: 'yellow' }}>
          {window.env?.VITE_APP_NAME || import.meta.env.VITE_APP_NAME}
        </Text>
      </Title>
    </MainLayout>
  );
}
