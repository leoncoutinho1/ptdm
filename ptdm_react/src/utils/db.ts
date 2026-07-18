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
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  syncStatus?: 'synced' | 'pending-create' | 'pending-update' | 'pending-delete';
}

interface Category extends Syncable {
  description: string;
}

interface Supplier extends Syncable {
  description: string;
}

interface Payable extends Syncable {
  supplierId: string;
  supplierDescription?: string;
  invoiceDate?: string;
  dueDate: string;
  value: number;
  paid: boolean;
  attachment?: string;
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
  composite: boolean;
  validityDays?: number;
  integrateScale?: boolean;
  componentProducts?: {
    componentProductId: string;
    componentProductDescription?: string;
    quantity: number;
    componentProductPrice?: number;
    componentProductCost?: number;
  }[];
}

interface Sale extends Syncable {
  paymentFormId: string;
  cashierId: string;
  checkoutId: string;
  totalValue: number;
  paidValue: number;
  changeValue: number;
  saleDate: string;
  saleProducts: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

interface SyncLog {
  id: string;
  entity: string;
  action: string;
  url: string;
  payload: string;
  response: string;
}

interface SyncMeta {
  id: string; // entity name, 'global', or flag key (e.g. 'listAllProducts')
  lastSync?: string;
  value?: boolean;
}

const db = new Dexie('PtdmDatabase') as Dexie & {
  auth: EntityTable<AuthData, 'id'>;
  categories: EntityTable<Category, 'id'>;
  cashiers: EntityTable<Cashier, 'id'>;
  checkouts: EntityTable<Checkout, 'id'>;
  paymentForms: EntityTable<PaymentForm, 'id'>;
  products: EntityTable<Product, 'id'>;
  sales: EntityTable<Sale, 'id'>;
  syncLogs: EntityTable<SyncLog, 'id'>;
  syncMeta: EntityTable<SyncMeta, 'id'>;
  suppliers: EntityTable<Supplier, 'id'>;
  payables: EntityTable<Payable, 'id'>;
};

// Schema declaration:
db.version(7).stores({
  auth: 'id',
  categories: 'id, updatedAt, syncStatus',
  cashiers: 'id, updatedAt, syncStatus',
  checkouts: 'id, updatedAt, syncStatus',
  paymentForms: 'id, updatedAt, syncStatus',
  products: 'id, updatedAt, syncStatus, categoryId',
  sales: 'id, updatedAt, syncStatus',
  syncLogs: 'id',
  syncMeta: 'id',
  suppliers: 'id, updatedAt, syncStatus',
});

db.version(8).stores({
  auth: 'id',
  categories: 'id, updatedAt, syncStatus',
  cashiers: 'id, updatedAt, syncStatus',
  checkouts: 'id, updatedAt, syncStatus',
  paymentForms: 'id, updatedAt, syncStatus',
  products: 'id, updatedAt, syncStatus, categoryId',
  sales: 'id, updatedAt, syncStatus',
  syncLogs: 'id',
  syncMeta: 'id',
  suppliers: 'id, updatedAt, syncStatus',
  payables: 'id, updatedAt, syncStatus',
});

db.version(9).stores({
  auth: 'id',
  categories: 'id, updatedAt, syncStatus',
  cashiers: 'id, updatedAt, syncStatus',
  checkouts: 'id, updatedAt, syncStatus',
  paymentForms: 'id, updatedAt, syncStatus',
  products: 'id, updatedAt, syncStatus, categoryId',
  sales: 'id, updatedAt, syncStatus',
  syncLogs: 'id',
  syncMeta: 'id',
  suppliers: 'id, updatedAt, syncStatus',
  payables: 'id, updatedAt, syncStatus, supplierId',
});

export type {
  AuthData,
  Category,
  Cashier,
  Checkout,
  PaymentForm,
  Product,
  Sale,
  SyncLog,
  SyncMeta,
  Supplier,
  Payable,
};
export { db };
