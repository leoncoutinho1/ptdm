import { syncAll } from './syncHelper';

export async function syncCategories() {
    await syncAll();
}

// Re-export pushLocalChanges for compatibility if needed elsewhere
export { syncAll };
