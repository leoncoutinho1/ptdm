import { Button, Group, useMantineColorScheme } from '@mantine/core';
import { LucideMoon, LucideSun } from 'lucide-react';

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();

  return (
    <Group justify="center" mt="0.5rem">
      <LucideSun onClick={() => setColorScheme('light')} />
      <LucideMoon onClick={() => setColorScheme('dark')} />
    </Group>
  );
}
