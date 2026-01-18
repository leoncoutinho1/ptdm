import { db } from './db';
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

// Helper to prepare local data with generic UUID and pending status
function prepareLocal(id: string | undefined, values: any): any {
    const finalId = id || crypto.randomUUID();
    return {
        ...values,
        id: finalId,
        syncStatus: 'pending-save',
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
    await table.put(localData as any);
    notifications.show({ color: 'blue', title: 'Offline', message: 'Salvo localmente. Será sincronizado em breve.' });
    navigate(redirectPath);

}

export async function genericDelete<T extends { id: string, syncStatus?: string }>(
    table: EntityTable<T, 'id'>,
    endpoint: string,
    id: string | undefined,
    navigate: (path: string) => void,
    redirectPath: string
) {
    if (!id) return;
    await table.update(id as any, { syncStatus: 'pending-delete' } as any);
    notifications.show({ color: 'green', title: 'Sucesso', message: 'Excluído localmente. Será sincronizado em breve.' });
    navigate(redirectPath);
}

