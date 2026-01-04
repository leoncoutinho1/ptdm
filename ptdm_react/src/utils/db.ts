import Dexie, { type EntityTable } from 'dexie';

interface AuthData {
    id: string; // 'current_auth'
    accessToken: string;
    refreshToken: string;
    tenant: string;
}

interface Category {
    id: string;
    description: string;
    updatedAt?: string;
    syncStatus?: 'synced' | 'pending-save' | 'pending-delete';
}

const db = new Dexie('PtdmDatabase') as Dexie & {
    auth: EntityTable<AuthData, 'id'>;
    categories: EntityTable<Category, 'id'>;
};

// Schema declaration:
db.version(3).stores({
    auth: 'id',
    categories: 'id, updatedAt, syncStatus' // Index syncStatus for easy filtering of pending items
});

export type { AuthData, Category };
export { db };
