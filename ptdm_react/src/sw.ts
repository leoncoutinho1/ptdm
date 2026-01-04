/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { syncCategories } from './utils/categorySync';

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
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            syncCategories() // Initial sync on activate
        ])
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'SYNC_CATEGORIES') {
        event.waitUntil(syncCategories());
    }
});

// We could also use periodicSync if supported
self.addEventListener('periodicsync', (event) => {
    const syncEvent = event as PeriodicSyncEvent;
    if (syncEvent.tag === 'sync-categories') {
        syncEvent.waitUntil(syncCategories());
    }
});
