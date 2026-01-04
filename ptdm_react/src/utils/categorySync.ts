import { db, Category } from './db';
import { apiRequest } from './apiHelper';

// Helper to handle potential PascalCase or wrapped responses from .NET API
function normalizeCategory(cat: any): Category {
    // If the response is wrapped in a 'data' property (common in some API patterns)
    const data = cat.data ? cat.data : cat;

    return {
        ...data,
        id: String(data.id || data.Id || data.ID || ''),
        description: data.description || data.Description || '',
        updatedAt: data.updatedAt || data.UpdatedAt,
    };
}

export async function pushLocalChanges() {
    if (!navigator.onLine) return;

    const pendingItems = await db.categories
        .where('syncStatus')
        .anyOf(['pending-save', 'pending-delete'])
        .toArray();

    for (const item of pendingItems) {
        try {
            if (item.syncStatus === 'pending-delete') {
                await apiRequest(`category/${item.id}`, 'DELETE');
                await db.categories.delete(item.id);
            } else {
                // Check if it's a new item (we can check if id is a temporary UUID or if we have a way to know)
                // For simplicity, let's try PUT if it has an updatedAt, else POST? 
                // Or better: try to see if it's new. 
                // A common pattern is checking if the ID looks like a temporary one.
                // Here we'll check if it already exists on server or just use the endpoint logic.

                // If it's a new item, the API might expect POST /category
                // If it's an update, PUT /category/{id}

                // We'll use a simple heuristic: if it has no updatedAt, it's likely new.
                const isNew = !item.updatedAt;

                if (isNew) {
                    const response = await apiRequest<any>('category', 'POST', {
                        description: item.description
                    });
                    const normalized = normalizeCategory(response);
                    // Replace temporary local item with server item
                    await db.categories.delete(item.id);
                    await db.categories.put({ ...normalized, syncStatus: 'synced' });
                } else {
                    await apiRequest(`category/${item.id}`, 'PUT', {
                        id: item.id,
                        description: item.description
                    });
                    // After success, we don't know the new updatedAt yet, 
                    // but the next "pull" will get it. For now mark as synced.
                    await db.categories.update(item.id, { syncStatus: 'synced' });
                }
            }
        } catch (error) {
            console.error(`Failed to push category ${item.id}:`, error);
        }
    }
}

export async function syncCategories() {
    if (!navigator.onLine) return;

    try {
        // 1. Push local changes first
        await pushLocalChanges();

        // 2. Pull updates from API
        const syncedItems = await db.categories
            .where('syncStatus')
            .equals('synced')
            .sortBy('updatedAt');

        const lastCategory = syncedItems.length > 0 ? syncedItems[syncedItems.length - 1] : null;
        const lastSync = lastCategory?.updatedAt || '0001-01-01T00:00:00Z';

        const response = await apiRequest<{ data: Category[], totalCount: number }>(
            `category/listCategory?UpdatedAt=${encodeURIComponent(lastSync)}&Limit=999`
        );

        if (response.data && response.data.length > 0) {
            // Mark items from API as synced
            const itemsToSave = response.data.map(cat => ({
                ...normalizeCategory(cat),
                syncStatus: 'synced' as const
            }));
            await db.categories.bulkPut(itemsToSave);
            console.log(`Synced ${response.data.length} categories from server.`);
        }
    } catch (error) {
        console.error('Failed to sync categories:', error);
    }
}
