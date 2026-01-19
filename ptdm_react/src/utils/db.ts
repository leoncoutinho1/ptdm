import Dexie, { type EntityTable } from 'dexie';

interface AuthData {
    id: string; // 'current_auth'
    accessToken: string;
    refreshToken: string;
    tenant: string;
}

interface Syncable {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    syncStatus?: 'synced' | 'pending-create' | 'pending-update' | 'pending-delete';
}

interface Category extends Syncable {
    description: string;
}

interface Cashier extends Syncable {
    name: string;
}

interface Checkout extends Syncable {
    name: string;
}

interface PaymentForm extends Syncable {
    description: string;
}

interface Product extends Syncable {
    description: string;
    cost: number;
    profitMargin: number;
    price: number;
    quantity: number;
    unit: string;
    barcodes: string[];
    categoryId: string;
}

interface Sale extends Syncable {
    paymentFormId: string;
    cashierId: string;
    checkoutId: string;
    totalValue: number;
    paidValue: number;
    changeValue: number;
    saleProducts: {
        productId: string;
        quantity: number;
        unitPrice: number;
    }[];
}

interface SyncMeta {
    id: string; // entity name or 'global'
    lastSync: string;
}

const db = new Dexie('PtdmDatabase') as Dexie & {
    auth: EntityTable<AuthData, 'id'>;
    categories: EntityTable<Category, 'id'>;
    cashiers: EntityTable<Cashier, 'id'>;
    checkouts: EntityTable<Checkout, 'id'>;
    paymentForms: EntityTable<PaymentForm, 'id'>;
    products: EntityTable<Product, 'id'>;
    sales: EntityTable<Sale, 'id'>;
    syncMeta: EntityTable<SyncMeta, 'id'>;
};

// Schema declaration:
db.version(6).stores({
    auth: 'id',
    categories: 'id, updatedAt, syncStatus',
    cashiers: 'id, updatedAt, syncStatus',
    checkouts: 'id, updatedAt, syncStatus',
    paymentForms: 'id, updatedAt, syncStatus',
    products: 'id, updatedAt, syncStatus, categoryId',
    sales: 'id, updatedAt, syncStatus',
    syncMeta: 'id'
});

export type { AuthData, Category, Cashier, Checkout, PaymentForm, Product, Sale, SyncMeta };
export { db };
