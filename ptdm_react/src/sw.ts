/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { syncAllWorker } from './utils/syncHelperWorker';

declare let self: ServiceWorkerGlobalScope;

interface PeriodicSyncEvent extends Event {
    tag: string;
    waitUntil(promise: Promise<any>): void;
}

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'SYNC_CATEGORIES') {
        event.waitUntil(syncAllWorker());
    }
});

// We could also use periodicSync if supported
self.addEventListener('periodicsync', (event) => {
    const syncEvent = event as PeriodicSyncEvent;
    if (syncEvent.tag === 'sync-categories') {
        syncEvent.waitUntil(syncAllWorker());
    }
});
