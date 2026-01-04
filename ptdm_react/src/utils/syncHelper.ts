import { db } from './db';
import { apiRequest } from './apiHelper';
import { EntityTable } from 'dexie';
import { notifications } from '@mantine/notifications';

// Helper for casing and wrapped responses
export function normalizeData(item: any): any {
    if (!item) return null;

    // Handle standard .NET Result wrappers (data, value, or the item itself)
    const data = item.data !== undefined ? item.data : (item.value !== undefined ? item.value : item);

    if (!data || typeof data !== 'object') return null;

    return {
        ...data,
        id: String(data.id || data.Id || data.ID || ''),
        description: data.description || data.Description,
        name: data.name || data.Name,
        updatedAt: data.updatedAt || data.UpdatedAt,
        createdAt: data.createdAt || data.CreatedAt,
        // Product specific
        cost: data.cost !== undefined ? data.cost : data.Cost,
        price: data.price !== undefined ? data.price : data.Price,
        quantity: data.quantity !== undefined ? data.quantity : data.Quantity,
        barcodes: data.barcodes || data.Barcodes || (data.barcode || data.Barcode ? [data.barcode || data.Barcode] : []),
        categoryId: String(data.categoryId || data.CategoryId || ''),
        // Sale specific
        paymentFormId: String(data.paymentFormId || data.PaymentFormId || ''),
        cashierId: String(data.cashierId || data.CashierId || ''),
        checkoutId: String(data.checkoutId || data.CheckoutId || ''),
        totalValue: data.totalValue !== undefined ? data.totalValue : data.TotalValue,
        paidValue: data.paidValue !== undefined ? data.paidValue : data.PaidValue,
        changeValue: data.changeValue !== undefined ? data.changeValue : data.ChangeValue,
        saleProducts: data.saleProducts || data.SaleProducts,
    };
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

export async function genericPush<T extends { id: string, updatedAt?: string, syncStatus?: string }>(
    table: EntityTable<T, 'id'>,
    endpoint: string
) {
    if (!navigator.onLine) return;

    const pendingItems = await table
        .where('syncStatus')
        .anyOf(['pending-save', 'pending-delete'])
        .toArray();

    for (const item of pendingItems) {
        try {
            const itemId = item.id as any;

            if (item.syncStatus === 'pending-delete') {
                await apiRequest(`${endpoint}/${itemId}`, 'DELETE');
                await table.delete(itemId);
            } else {
                const isNew = !item.updatedAt;

                if (isNew) {
                    const { syncStatus, ...toSend } = item as any;
                    delete toSend.id;

                    const response = await apiRequest<any>(endpoint, 'POST', toSend);
                    const normalized = normalizeData(response);

                    await table.delete(itemId);
                    if (normalized && normalized.id && normalized.id !== '0') {
                    await table.put({ ...normalized, syncStatus: 'synced' } as any);

                        // If ID changed (typical for servers), update references in other tables
                        if (itemId !== normalized.id) {
                            await propagateIdChange(endpoint, itemId, normalized.id);
                        }
                    }
                } else {
                    const { syncStatus, ...toSend } = item as any;
                    await apiRequest(`${endpoint}/${itemId}`, 'PUT', toSend);
                    await table.update(itemId, { syncStatus: 'synced' } as any);
                }
            }
        } catch (error) {
            console.error(`Failed to push ${endpoint} ${item.id}:`, error);
        }
    }
}

export async function genericPull<T extends { id: string, updatedAt?: string, syncStatus?: string }>(
    table: EntityTable<T, 'id'>,
    endpoint: string,
    listEndpoint?: string
) {
    if (!navigator.onLine) return;

    try {
        const syncedItems = await table
            .where('syncStatus')
            .equals('synced')
            .sortBy('updatedAt' as any);

        const lastItem = syncedItems.length > 0 ? syncedItems[syncedItems.length - 1] : null;
        const lastSync = lastItem?.updatedAt || '0001-01-01T00:00:00Z';

        const finalEndpoint = listEndpoint || `${endpoint}/list${endpoint}`;

        const response = await apiRequest<{ data: T[], totalCount: number }>(
            `${finalEndpoint}?UpdatedAt=${encodeURIComponent(lastSync)}&Limit=999`
        );

        if (response.data && response.data.length > 0) {
            const itemsToSave = response.data
                .map(item => {
                    const normalized = normalizeData(item);
                    return normalized ? { ...normalized, syncStatus: 'synced' as const } : null;
                })
                .filter((item): item is any => item !== null && !!item.id && item.id !== '0');

            if (itemsToSave.length > 0) {
            await table.bulkPut(itemsToSave as any[]);
                console.log(`Synced ${itemsToSave.length} ${endpoint} from server.`);
            }
        }
    } catch (error) {
        console.error(`Failed to pull ${endpoint}:`, error);
    }
}

// Helper to prepare local data with generic UUID and pending status
function prepareLocal(id: string | undefined, values: any): any {
    const finalId = id || crypto.randomUUID();
    return {
        ...values,
        id: finalId,
        syncStatus: 'pending-save'
    };
}

export async function genericSubmit<T extends { id: string, syncStatus?: string }>(
    table: EntityTable<T, 'id'>,
    endpoint: string,
    id: string | undefined,
    values: any,
    navigate: (path: string) => void,
    redirectPath: string
) {
    const localData = prepareLocal(id, values);
    const localId = localData.id;

    try {
        await table.put(localData as any);

        if (navigator.onLine) {
            if (id) {
                await apiRequest(`${endpoint}/${id}`, 'PUT', { ...values, id });
                await table.update(id as any, { syncStatus: 'synced' } as any);
            } else {
                const response = await apiRequest<any>(endpoint, 'POST', values);
                const normalized = normalizeData(response);
                await table.delete(localId as any);
                if (normalized && normalized.id && normalized.id !== '0') {
                await table.put({ ...normalized, syncStatus: 'synced' } as any);

                    // Propagation here for online creates
                    if (localId !== normalized.id) {
                        await propagateIdChange(endpoint, localId, normalized.id);
                    }
                }
            }
        }

        notifications.show({ color: 'green', title: 'Sucesso', message: 'Dados salvos e sincronizando.' });
        navigate(redirectPath);
        if (navigator.onLine) syncAll();
    } catch (err) {
        console.error('Submit failed:', err);
        notifications.show({ color: 'blue', title: 'Offline', message: 'Salvo localmente. Será sincronizado em breve.' });
        navigate(redirectPath);
    }
}

export async function genericDelete<T extends { id: string, syncStatus?: string }>(
    table: EntityTable<T, 'id'>,
    endpoint: string,
    id: string | undefined,
    navigate: (path: string) => void,
    redirectPath: string
) {
    if (!id) return;
    if (!window.confirm('Tem certeza que deseja excluir?')) return;

    try {
        if (navigator.onLine) {
            await apiRequest(`${endpoint}/${id}`, 'DELETE');
            await table.delete(id as any);
        } else {
            await table.update(id as any, { syncStatus: 'pending-delete' } as any);
        }
        notifications.show({ color: 'green', title: 'Sucesso', message: 'Excluído com sucesso.' });
        navigate(redirectPath);
    } catch (err) {
        notifications.show({ color: 'red', title: 'Erro', message: String(err) });
    }
}

export async function syncAll() {
    if (!navigator.onLine) return;

    // Categories
    await genericPush(db.categories, 'category');
    await genericPull(db.categories, 'category');

    // Cashiers
    await genericPush(db.cashiers, 'cashier');
    await genericPull(db.cashiers, 'cashier');

    // Checkouts
    await genericPush(db.checkouts, 'checkout');
    await genericPull(db.checkouts, 'checkout');

    // Payment Forms
    await genericPush(db.paymentForms, 'paymentForm');
    await genericPull(db.paymentForms, 'paymentForm', 'paymentForm/ListPaymentForm');

    // Products
    await genericPush(db.products, 'product');
    await genericPull(db.products, 'product', 'product/listproduct');

    // Sales
    await genericPush(db.sales, 'sale');
    await genericPull(db.sales, 'sale', 'sale/listSale');
}
