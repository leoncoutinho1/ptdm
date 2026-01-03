import Dexie, { type EntityTable } from 'dexie';

interface AuthData {
    id: string; // 'current_auth'
    accessToken: string;
    refreshToken: string;
    tenant: string;
}

const db = new Dexie('PtdmDatabase') as Dexie & {
    auth: EntityTable<AuthData, 'id'>;
};

// Schema declaration:
db.version(1).stores({
    auth: 'id' // Primary key 'id'
});

export type { AuthData };
export { db };
