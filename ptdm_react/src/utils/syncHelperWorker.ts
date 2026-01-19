import { db } from './db';
import { apiRequest, checkConnectivity } from './apiHelper';
import { EntityTable } from 'dexie';

// Helper to unwrap .NET Result responses
function unwrapData(item: any): any {
    if (!item) return null;
    const data = item.data !== undefined ? item.data : (item.value !== undefined ? item.value : item);
    if (!data || typeof data !== 'object') return null;
    return data;
}

// Normalize functions for each entity type
function normalizeCategory(item: any): any {
    const data = unwrapData(item);
    if (!data) return null;

    return {
        id: String(data.id || data.Id || data.ID || ''),
        description: data.description || data.Description || '',
        updatedAt: data.updatedAt || data.UpdatedAt,
        createdAt: data.createdAt || data.CreatedAt,
    };
}

function normalizeCashier(item: any): any {
    const data = unwrapData(item);
    if (!data) return null;

    return {
        id: String(data.id || data.Id || data.ID || ''),
        name: data.name || data.Name || '',
        updatedAt: data.updatedAt || data.UpdatedAt,
        createdAt: data.createdAt || data.CreatedAt,
    };
}

function normalizeCheckout(item: any): any {
    const data = unwrapData(item);
    if (!data) return null;

    return {
        id: String(data.id || data.Id || data.ID || ''),
        name: data.name || data.Name || '',
        updatedAt: data.updatedAt || data.UpdatedAt,
        createdAt: data.createdAt || data.CreatedAt,
    };
}

function normalizePaymentForm(item: any): any {
    const data = unwrapData(item);
    if (!data) return null;

    return {
        id: String(data.id || data.Id || data.ID || ''),
        description: data.description || data.Description || '',
        updatedAt: data.updatedAt || data.UpdatedAt,
        createdAt: data.createdAt || data.CreatedAt,
    };
}

function normalizeProduct(item: any): any {
    const data = unwrapData(item);
    if (!data) return null;

    return {
        id: String(data.id || data.Id || data.ID || ''),
        description: data.description || data.Description || '',
        cost: data.cost !== undefined ? data.cost : data.Cost,
        profitMargin: data.profitMargin !== undefined ? data.profitMargin : data.ProfitMargin,
        price: data.price !== undefined ? data.price : data.Price,
        quantity: data.quantity !== undefined ? data.quantity : data.Quantity,
        unit: data.unit || data.Unit || 'UN',
        barcodes: data.barcodes || data.Barcodes || (data.barcode || data.Barcode ? [data.barcode || data.Barcode] : []),
        categoryId: String(data.categoryId || data.CategoryId || ''),
        updatedAt: data.updatedAt || data.UpdatedAt,
        createdAt: data.createdAt || data.CreatedAt,
    };
}

function normalizeSale(item: any): any {
    const data = unwrapData(item);
    if (!data) return null;

    return {
        id: String(data.id || data.Id || data.ID || ''),
        paymentFormId: String(data.paymentFormId || data.PaymentFormId || ''),
        cashierId: String(data.cashierId || data.CashierId || ''),
        checkoutId: String(data.checkoutId || data.CheckoutId || ''),
        totalValue: data.totalValue !== undefined ? data.totalValue : data.TotalValue,
        paidValue: data.paidValue !== undefined ? data.paidValue : data.PaidValue,
        changeValue: data.changeValue !== undefined ? data.changeValue : data.ChangeValue,
        saleProducts: data.saleProducts || data.SaleProducts || [],
        updatedAt: data.updatedAt || data.UpdatedAt,
        createdAt: data.createdAt || data.CreatedAt,
    };
}

// Get the appropriate normalizer function based on endpoint
function getNormalizer(endpoint: string): (item: any) => any {
    switch (endpoint) {
        case 'category':
            return normalizeCategory;
        case 'cashier':
            return normalizeCashier;
        case 'checkout':
            return normalizeCheckout;
        case 'paymentForm':
            return normalizePaymentForm;
        case 'product':
            return normalizeProduct;
        case 'sale':
            return normalizeSale;
        default:
            console.warn(`No normalizer found for endpoint: ${endpoint}`);
            return unwrapData;
    }
}

async function propagateIdChange(entityName: string, oldId: string, newId: string) {
    if (entityName === 'category') {
        await db.products.where('categoryId').equals(oldId).modify({ categoryId: newId });
    }
    if (entityName === 'cashier') {
        await db.sales.where('cashierId').equals(oldId).modify({ cashierId: newId });
    }
    if (entityName === 'checkout') {
        await db.sales.where('checkoutId').equals(oldId).modify({ checkoutId: newId });
    }
    if (entityName === 'paymentForm') {
        await db.sales.where('paymentFormId').equals(oldId).modify({ paymentFormId: newId });
    }
    if (entityName === 'product') {
        // Nested array for products in sales
        const sales = await db.sales.toArray();
        for (const sale of sales) {
            let changed = false;
            const updatedProducts = sale.saleProducts?.map(sp => {
                if (String(sp.productId) === String(oldId)) {
                    changed = true;
                    return { ...sp, productId: newId };
                }
                return sp;
            });
            if (changed) {
                await db.sales.update(sale.id, { saleProducts: updatedProducts });
            }
        }
    }
}

export async function genericPush<T extends { id: string, updatedAt?: string, createdAt?: string, syncStatus?: string }>(
    table: EntityTable<T, 'id'>,
    endpoint: string
) {
    const pendingItems = await table
        .where('syncStatus')
        .anyOf(['pending-create', 'pending-update', 'pending-delete'])
        .toArray();

    for (const item of pendingItems) {
        const itemId = item.id as any;

        if (item.syncStatus === 'pending-delete') {
            // DELETE: Remove item from server and local database
            await apiRequest(`${endpoint}/${itemId}`, 'DELETE');
            await table.delete(itemId);
        } else if (item.syncStatus === 'pending-create') {
            // CREATE: Send new item to server (POST)
            const { syncStatus, ...toSend } = item as any;
            delete toSend.id;

            const response = await apiRequest<any>(endpoint, 'POST', toSend);
            const normalizer = getNormalizer(endpoint);
            const normalized = normalizer(response);

            await table.delete(itemId);
            if (normalized && normalized.id && normalized.id !== '0') {
                await table.put({ ...normalized, syncStatus: 'synced' } as any);

                // If ID changed (typical for servers), update references in other tables
                if (itemId !== normalized.id) {
                    await propagateIdChange(endpoint, itemId, normalized.id);
                }
            }
        } else if (item.syncStatus === 'pending-update') {
            // UPDATE: Send updated item to server (PUT)
            const { syncStatus, ...toSend } = item as any;
            await apiRequest(`${endpoint}/${itemId}`, 'PUT', toSend);
            await table.update(itemId, { syncStatus: 'synced' } as any);
        }
    }
}

export async function genericPull<T extends { id: string, updatedAt?: string, syncStatus?: string }>(
    table: EntityTable<T, 'id'>,
    endpoint: string,
    listEndpoint?: string,
    lastSyncOverride?: string
) {
    let lastSync = lastSyncOverride;

    if (!lastSync) {
        const syncedItems = await table
            .where('syncStatus')
            .equals('synced')
            .sortBy('updatedAt' as any);
        const lastItem = syncedItems.length > 0 ? syncedItems[syncedItems.length - 1] : null;
        lastSync = lastItem?.updatedAt || '0001-01-01T00:00:00Z';
    }

    const finalEndpoint = listEndpoint || `${endpoint}/list${endpoint}`;

    const response = await apiRequest<{ data: T[], totalCount: number }>(
        `${finalEndpoint}?UpdatedAt=${encodeURIComponent(lastSync)}&Limit=999`
    );

    if (response.data && response.data.length > 0) {
        const normalizer = getNormalizer(endpoint);
        const itemsToSave = response.data
            .map(item => {
                const normalized = normalizer(item);
                return normalized ? { ...normalized, syncStatus: 'synced' as const } : null;
            })
            .filter((item): item is any => item !== null && !!item.id && item.id !== '0');

        // Validação especial para produtos: verificar códigos de barras duplicados
        if (endpoint === 'product' && itemsToSave.length > 0) {
            const validatedItems: any[] = [];

            for (const item of itemsToSave) {
                if (!Array.isArray(item.barcodes) || item.barcodes.length === 0) {
                    validatedItems.push(item);
                    continue;
                }

                let hasDuplicate = false;

                // Verificar contra produtos já validados neste lote
                for (const barcode of item.barcodes) {
                    const duplicateInBatch = validatedItems.find(vi =>
                        Array.isArray(vi.barcodes) &&
                        vi.barcodes.some((b: string) => b.toLowerCase() === barcode.toLowerCase())
                    );

                    if (duplicateInBatch) {
                        console.warn(`[SYNC] Produto "${item.description}" (${item.id}) tem código de barras duplicado "${barcode}" com produto "${duplicateInBatch.description}" (${duplicateInBatch.id}). Ignorando produto do servidor.`);
                        hasDuplicate = true;
                        break;
                    }
                }

                // Verificar contra produtos já existentes no IndexedDB
                if (!hasDuplicate) {
                    for (const barcode of item.barcodes) {
                        const existingProducts = await table.filter((p: any) =>
                            Array.isArray(p.barcodes) &&
                            p.barcodes.some((b: string) => b.toLowerCase() === barcode.toLowerCase()) &&
                            p.id !== item.id
                        ).toArray();

                        if (existingProducts.length > 0) {
                            const existing = existingProducts[0] as any;
                            console.warn(`[SYNC] Produto do servidor "${item.description}" (${item.id}) tem código de barras duplicado "${barcode}" com produto local "${existing.description}" (${existing.id}). Ignorando produto do servidor.`);
                            hasDuplicate = true;
                            break;
                        }
                    }
                }

                if (!hasDuplicate) {
                    validatedItems.push(item);
                }
            }

            if (validatedItems.length > 0) {
                await table.bulkPut(validatedItems as any[]);
                console.log(`Synced ${validatedItems.length} ${endpoint} from server (${itemsToSave.length - validatedItems.length} skipped due to duplicate barcodes).`);
            }
        } else {
            // Para outros endpoints, usar o comportamento padrão
            if (itemsToSave.length > 0) {
                await table.bulkPut(itemsToSave as any[]);
                console.log(`Synced ${itemsToSave.length} ${endpoint} from server.`);
            }
        }
    }
}

// Worker-safe sync function (no UI notifications)
export async function syncAllWorker() {
    if (!(await checkConnectivity())) return;

    // Get last global sync time
    const syncLog = await db.syncMeta.get('global');
    const lastSync = syncLog?.lastSync || '0001-01-01T00:00:00Z';
    const nowSync = new Date().toISOString();

    try {
        // Categories
        await genericPush(db.categories, 'category');
        await genericPull(db.categories, 'category', undefined, lastSync);

        // Cashiers
        await genericPush(db.cashiers, 'cashier');
        await genericPull(db.cashiers, 'cashier', undefined, lastSync);

        // Checkouts
        await genericPush(db.checkouts, 'checkout');
        await genericPull(db.checkouts, 'checkout', undefined, lastSync);

        // Payment Forms
        await genericPush(db.paymentForms, 'paymentForm');
        await genericPull(db.paymentForms, 'paymentForm', 'paymentForm/ListPaymentForm', lastSync);

        // Products
        await genericPush(db.products, 'product');
        await genericPull(db.products, 'product', 'product/listproduct', lastSync);

        // Sales
        await genericPush(db.sales, 'sale');
        await genericPull(db.sales, 'sale', 'sale/listSale', lastSync);

        // Update global sync time
        await db.syncMeta.put({ id: 'global', lastSync: nowSync });
    }
    catch (error) {
        console.error('Error syncing data:', error);
    }
}
