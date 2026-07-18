import { EntityTable } from 'dexie';
import { apiRequest, checkConnectivity } from './apiHelper';
import { db } from './db';

// Helper to unwrap .NET Result responses
function unwrapData(item: any): any {
  if (!item) {
    return null;
  }
  const data = item.data !== undefined ? item.data : item.value !== undefined ? item.value : item;
  if (!data || typeof data !== 'object') {
    return null;
  }
  return data;
}

// Normalize functions for each entity type
function normalizeCategory(item: any): any {
  const data = unwrapData(item);
  if (!data) {
    return null;
  }

  return {
    id: String(data.id || data.Id || data.ID || ''),
    description: data.description || data.Description || '',
    updatedAt: data.updatedAt || data.UpdatedAt,
    createdAt: data.createdAt || data.CreatedAt,
  };
}

function normalizeSupplier(item: any): any {
  const data = unwrapData(item);
  if (!data) {
    return null;
  }

  return {
    id: String(data.id || data.Id || data.ID || ''),
    description: data.description || data.Description || '',
    updatedAt: data.updatedAt || data.UpdatedAt,
    createdAt: data.createdAt || data.CreatedAt,
  };
}

function normalizePayable(item: any): any {
  const data = unwrapData(item);
  if (!data) {
    return null;
  }

  return {
    id: String(data.id || data.Id || data.ID || ''),
    supplierId: String(data.supplierId || data.SupplierId || ''),
    supplierDescription: data.supplierDescription || data.SupplierDescription || '',
    invoiceDate: data.invoiceDate || data.InvoiceDate || undefined,
    dueDate: data.dueDate || data.DueDate || '',
    value: data.value !== undefined ? data.value : data.Value || 0,
    paid: !!(data.paid || data.Paid),
    attachment: data.attachment || data.Attachment || undefined,
    updatedAt: data.updatedAt || data.UpdatedAt,
    createdAt: data.createdAt || data.CreatedAt,
  };
}

function normalizeCashier(item: any): any {
  const data = unwrapData(item);
  if (!data) {
    return null;
  }

  return {
    id: String(data.id || data.Id || data.ID || ''),
    name: data.name || data.Name || '',
    updatedAt: data.updatedAt || data.UpdatedAt,
    createdAt: data.createdAt || data.CreatedAt,
  };
}

function normalizeCheckout(item: any): any {
  const data = unwrapData(item);
  if (!data) {
    return null;
  }

  return {
    id: String(data.id || data.Id || data.ID || ''),
    name: data.name || data.Name || '',
    updatedAt: data.updatedAt || data.UpdatedAt,
    createdAt: data.createdAt || data.CreatedAt,
  };
}

function normalizePaymentForm(item: any): any {
  const data = unwrapData(item);
  if (!data) {
    return null;
  }

  return {
    id: String(data.id || data.Id || data.ID || ''),
    description: data.description || data.Description || '',
    updatedAt: data.updatedAt || data.UpdatedAt,
    createdAt: data.createdAt || data.CreatedAt,
  };
}

function normalizeProduct(item: any): any {
  const data = unwrapData(item);
  if (!data) {
    return null;
  }

  return {
    id: String(data.id || data.Id || data.ID || ''),
    description: data.description || data.Description || '',
    cost: data.cost !== undefined ? data.cost : data.Cost,
    profitMargin: data.profitMargin !== undefined ? data.profitMargin : data.ProfitMargin,
    price: data.price !== undefined ? data.price : data.Price,
    quantity: data.quantity !== undefined ? data.quantity : data.Quantity,
    unit: data.unit || data.Unit || 'UN',
    barcodes:
      data.barcodes ||
      data.Barcodes ||
      (data.barcode || data.Barcode ? [data.barcode || data.Barcode] : []),
    categoryId: String(data.categoryId || data.CategoryId || ''),
    composite: !!(data.composite || data.Composite),
    validityDays: data.validityDays !== undefined ? Number(data.validityDays) : (data.ValidityDays !== undefined ? Number(data.ValidityDays) : 0),
    integrateScale: !!(data.integrateScale || data.IntegrateScale),
    componentProducts: (data.componentProducts || data.ComponentProducts || []).map((cp: any) => ({
      componentProductId: String(cp.componentProductId || cp.ComponentProductId || ''),
      componentProductDescription:
        cp.componentProductDescription || cp.ComponentProductDescription || '',
      quantity: cp.quantity !== undefined ? cp.quantity : cp.Quantity,
      componentProductPrice:
        cp.componentProductPrice !== undefined
          ? cp.componentProductPrice
          : cp.ComponentProductPrice,
      componentProductCost:
        cp.componentProductCost !== undefined ? cp.componentProductCost : cp.ComponentProductCost,
    })),
    updatedAt: data.updatedAt || data.UpdatedAt,
    createdAt: data.createdAt || data.CreatedAt,
  };
}

function normalizeSale(item: any): any {
  const data = unwrapData(item);
  if (!data) {
    return null;
  }

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
    saleDate: data.saleDate || data.SaleDate,
  };
}

// Get the appropriate normalizer function based on endpoint
function getNormalizer(endpoint: string): (item: any) => any {
  switch (endpoint) {
    case 'category':
      return normalizeCategory;
    case 'supplier':
      return normalizeSupplier;
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
    case 'payable':
      return normalizePayable;
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
  if (entityName === 'supplier') {
    await db.payables.where('supplierId').equals(oldId).modify({ supplierId: newId });
  }
  if (entityName === 'product') {
    // Update components in other products
    const products = await db.products.toArray();
    for (const p of products) {
      if (p.componentProducts && p.componentProducts.length > 0) {
        let changed = false;
        const updatedComponents = p.componentProducts.map((cp) => {
          if (String(cp.componentProductId) === String(oldId)) {
            changed = true;
            return { ...cp, componentProductId: newId };
          }
          return cp;
        });
        if (changed) {
          await db.products.update(p.id, { componentProducts: updatedComponents });
        }
      }
    }

    // Nested array for products in sales
    const sales = await db.sales.toArray();
    for (const sale of sales) {
      let changed = false;
      const updatedProducts = sale.saleProducts?.map((sp) => {
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

export async function genericPush<
  T extends { id: string; updatedAt?: string; createdAt?: string; syncStatus?: string },
>(table: EntityTable<T, 'id'>, endpoint: string) {
  const pendingItems = await table
    .where('syncStatus')
    .anyOf(['pending-create', 'pending-update', 'pending-delete'])
    .toArray();

  for (const item of pendingItems) {
    try {
      const itemId = item.id as any;

      if (item.syncStatus === 'pending-delete') {
        // DELETE: Remove item from server and local database
        try {
          await apiRequest(`${endpoint}/${itemId}`, 'DELETE');
        } catch (err: any) {
          // If the item doesn't exist on the server (404), we can treat it as successfully deleted
          if (err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
            console.warn(`[SYNC] Item ${itemId} not found on server during delete. Deleting locally.`);
          } else {
            throw err;
          }
        }
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
    } catch (err: any) {
      const { syncStatus, ...toSend } = item as any;
      let errorResponse = '';
      try {
        errorResponse = JSON.parse((err as Error).message);
      } catch {
        errorResponse = (err as Error).message || String(err);
      }
      db.syncLogs.put({
        id: crypto.randomUUID(),
        entity: table.name,
        action: syncStatus,
        url: `${endpoint}/${item.id}`,
        payload: toSend,
        response: errorResponse,
      });
    }
  }
}

export async function genericPull<
  T extends { id: string; updatedAt?: string; syncStatus?: string },
>(table: EntityTable<T, 'id'>, endpoint: string, listEndpoint?: string) {
  // Busca o lastSync específico desta tabela no syncMeta
  const syncMetaEntry = await db.syncMeta.get(endpoint);
  let lastSync = syncMetaEntry?.lastSync || '0001-01-01T00:00:00Z';

  // Se listAllProducts estiver ativo, ignora o lastSync e busca todos os produtos
  if (endpoint === 'product') {
    const listAllFlag = await db.syncMeta.get('listAllProducts');
    if (listAllFlag?.value === true) {
      lastSync = '0001-01-01T00:00:00Z';
      await db.syncMeta.put({ id: 'listAllProducts', value: false });
      console.log('[SYNC] listAllProducts ativado: buscando todos os produtos do servidor.');
    }
  }

  const finalEndpoint = listEndpoint || `${endpoint}/list${endpoint}`;

  const url =
    endpoint === 'sale'
      ? `${finalEndpoint}?Limit=100&Sort=-SaleDate`
      : endpoint === 'payable'
        ? `${finalEndpoint}?Limit=100&Sort=-DueDate`
        : `${finalEndpoint}?UpdatedAt=${encodeURIComponent(lastSync)}`;

  const response = await apiRequest<{ data: T[]; totalCount: number }>(url);

  if (response.data && response.data.length > 0) {
    const normalizer = getNormalizer(endpoint);
    const itemsToSave = response.data
      .map((item) => {
        const normalized = normalizer(item);
        return normalized ? { ...normalized, syncStatus: 'synced' as const } : null;
      })
      .filter((item): item is any => item !== null && !!item.id && item.id !== '0');

    if (itemsToSave.length === 0) {
      return;
    }

    if (endpoint !== 'product') {
      await table.bulkPut(itemsToSave as any[]);
      console.log(`Synced ${itemsToSave.length} ${endpoint} from server.`);
    }

    // Validação especial para produtos: verificar códigos de barras duplicados
    if (endpoint === 'product') {
      const validatedItems: any[] = [];

      for (const item of itemsToSave) {
        if (!Array.isArray(item.barcodes) || item.barcodes.length === 0) {
          validatedItems.push(item);
          continue;
        }

        let hasDuplicate = false;

        // Verificar contra produtos já validados neste lote
        for (const barcode of item.barcodes) {
          const duplicateInBatch = validatedItems.find(
            (vi) =>
              Array.isArray(vi.barcodes) &&
              vi.barcodes.some((b: string) => b.toLowerCase() === barcode.toLowerCase())
          );

          if (duplicateInBatch) {
            console.warn(
              `[SYNC] Produto "${item.description}" (${item.id}) tem código de barras duplicado "${barcode}" com produto "${duplicateInBatch.description}" (${duplicateInBatch.id}). Ignorando produto do servidor.`
            );
            hasDuplicate = true;
            break;
          }
        }

        // Verificar contra produtos já existentes no IndexedDB
        if (!hasDuplicate) {
          for (const barcode of item.barcodes) {
            const existingProducts = await table
              .filter(
                (p: any) =>
                  Array.isArray(p.barcodes) &&
                  p.barcodes.some((b: string) => b.toLowerCase() === barcode.toLowerCase()) &&
                  p.id !== item.id
              )
              .toArray();

            if (existingProducts.length > 0) {
              const existing = existingProducts[0] as any;
              console.warn(
                `[SYNC] Produto do servidor "${item.description}" (${item.id}) tem código de barras duplicado "${barcode}" com produto local "${existing.description}" (${existing.id}). Ignorando produto do servidor.`
              );
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
        console.log(
          `Synced ${validatedItems.length} ${endpoint} from server (${itemsToSave.length - validatedItems.length} skipped due to duplicate barcodes).`
        );
      }
    }

    // Atualiza o lastSync desta tabela com o maior updatedAt entre TODOS os itens da tabela no IndexedDB
    // A tabela 'sale' não usa data como parâmetro, portanto não precisa atualizar o lastSync
    if (endpoint !== 'sale') {
      const allItems = await table.orderBy('updatedAt' as any).reverse().first();
      const maxUpdatedAt: string | undefined = (allItems as any)?.updatedAt;

      if (maxUpdatedAt && maxUpdatedAt > lastSync) {
        await db.syncMeta.put({ id: endpoint, lastSync: maxUpdatedAt });
        console.log(`[SYNC] lastSync de "${endpoint}" atualizado para ${maxUpdatedAt}`);
      }
    }
  }
}

// Worker-safe sync function (no UI notifications)
export async function syncAllWorker() {
  if (!(await checkConnectivity())) {
    return;
  }

  const nowSync = new Date().toISOString();

  db.syncLogs.clear();

  try {
    // Categories
    await genericPush(db.categories, 'category');
    await genericPull(db.categories, 'category');

    // Suppliers
    await genericPush(db.suppliers, 'supplier');
    await genericPull(db.suppliers, 'supplier', 'supplier/ListSupplier');

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
    //TODO: eliminar as vendas mais antigas e manter 100 vendas
    db.sales
      .where('syncStatus')
      .equals('synced')
      .sortBy('saleDate' as any)
      .then((sales) => {
        // sortBy returns a Promise that resolves to an array (PromiseExtended<Sale[]>).
        // Since we want the latest sales to be kept, and sortBy returns ascending order (oldest first),
        // we can reverse the *resolved array* instead of trying to reverse the Promise.
        sales.reverse(); // Now sales are sorted newest to oldest

        if (sales.length > 100) {
          // Since it's newest first, the ones to keep are the first 100
          // The ones to delete are from index 100 onwards
          const toDelete = sales.slice(100);
          db.sales.bulkDelete(toDelete.map((s) => s.id));
        }
      });

    // Payables
    await genericPush(db.payables, 'payable');
    await genericPull(db.payables, 'payable', 'payable/ListPayable');
    db.payables
      .where('syncStatus')
      .equals('synced')
      .sortBy('dueDate' as any)
      .then((payables) => {
        payables.reverse(); // newest first
        if (payables.length > 100) {
          const toDelete = payables.slice(100);
          db.payables.bulkDelete(toDelete.map((p) => p.id));
        }
      });

    // Update global sync time
    await db.syncMeta.put({ id: 'global', lastSync: nowSync });
  } catch (error) {
    console.error('Error syncing data:', error);
  }
}
