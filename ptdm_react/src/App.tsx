import { useEffect } from 'react';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Router } from './Router';
import { theme } from './theme';
import { Notifications } from '@mantine/notifications';
import { useSyncWorker } from './hooks/useSyncWorker';

export default function App() {
  // Start background sync worker
  useSyncWorker();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;

        // Se o componente já tratou o Enter (ex: busca de produto), não faz nada
        if (e.defaultPrevented) return;

        // Verifica se é um campo de entrada onde queremos simular o Tab
        const isInput = target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA';

        if (isInput) {
          const type = (target as HTMLInputElement).type;

          // No TEXTAREA o Enter deve continuar criando nova linha
          if (target.tagName === 'TEXTAREA') return;

          // Previne o submit se não for um botão de submit
          if (type !== 'submit' && type !== 'button' && type !== 'reset') {
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <MantineProvider theme={theme}>
      <ModalsProvider>
        <Notifications />
        <Router />
      </ModalsProvider>
    </MantineProvider>
  );
}
