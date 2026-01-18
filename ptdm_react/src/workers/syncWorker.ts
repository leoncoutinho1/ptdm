import { syncAllWorker } from '../utils/syncHelperWorker';

// Sync worker - runs syncAll every 3 minutes
const SYNC_INTERVAL = 3 * 60 * 1000; // 3 minutes in milliseconds

let syncIntervalId: number | null = null;

// Listen for messages from the main thread
self.addEventListener('message', async (event: MessageEvent) => {
    const { type } = event.data;

    switch (type) {
        case 'START_SYNC':
            if (!syncIntervalId) {
                // Run initial sync
                await performSync();

                // Set up interval for periodic sync
                syncIntervalId = self.setInterval(async () => {
                    await performSync();
                }, SYNC_INTERVAL) as unknown as number;

                self.postMessage({ type: 'SYNC_STARTED' });
            }
            break;

        case 'STOP_SYNC':
            if (syncIntervalId) {
                self.clearInterval(syncIntervalId);
                syncIntervalId = null;
                self.postMessage({ type: 'SYNC_STOPPED' });
            }
            break;

        case 'FORCE_SYNC':
            await performSync();
            break;

        default:
            console.warn('Unknown message type:', type);
    }
});

async function performSync() {
    try {
        console.log('[Sync Worker] Starting sync at', new Date().toISOString());
        await syncAllWorker();
        self.postMessage({
            type: 'SYNC_COMPLETE',
            timestamp: new Date().toISOString()
        });
        console.log('[Sync Worker] Sync completed successfully');
    } catch (error) {
        console.error('[Sync Worker] Sync failed:', error);
        self.postMessage({
            type: 'SYNC_ERROR',
            error: String(error),
            timestamp: new Date().toISOString()
        });
    }
}
