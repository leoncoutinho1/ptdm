import { useEffect, useRef, useState } from 'react';

export function useSyncWorker() {
    const workerRef = useRef<Worker | null>(null);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        // Create worker
        workerRef.current = new Worker(
            new URL('../workers/syncWorker.ts', import.meta.url),
            { type: 'module' }
        );

        // Listen for messages from worker
        workerRef.current.addEventListener('message', (event: MessageEvent) => {
            const { type, timestamp } = event.data;

            switch (type) {
                case 'SYNC_COMPLETE':
                    setLastSync(timestamp);
                    setIsSyncing(false);
                    break;
                case 'SYNC_ERROR':
                    setIsSyncing(false);
                    console.error('Sync error:', event.data.error);
                    break;
                case 'SYNC_STARTED':
                    console.log('Sync worker started');
                    break;
                case 'SYNC_STOPPED':
                    console.log('Sync worker stopped');
                    break;
            }
        });

        // Start the sync worker
        workerRef.current.postMessage({ type: 'START_SYNC' });

        // Cleanup on unmount
        return () => {
            if (workerRef.current) {
                workerRef.current.postMessage({ type: 'STOP_SYNC' });
                workerRef.current.terminate();
            }
        };
    }, []);

    const forceSync = () => {
        if (workerRef.current) {
            setIsSyncing(true);
            workerRef.current.postMessage({ type: 'FORCE_SYNC' });
        }
    };

    return { lastSync, isSyncing, forceSync };
}
