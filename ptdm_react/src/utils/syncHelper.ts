import { EntityTable } from 'dexie';
import { notifications } from '@mantine/notifications';

// Helper to prepare local data with generic UUID and pending status
async function prepareLocal<T extends { id: string, updatedAt?: string, createdAt?: string }>(
    table: EntityTable<T, 'id'>,
    id: string | undefined,
    values: any
): Promise<any> {
    const finalId = id || crypto.randomUUID();

    // If editing an existing item, preserve updatedAt and createdAt
    if (id) {
        const existing = await table.get(id as any);
        return {
            ...values,
            id: finalId,
            updatedAt: existing?.updatedAt,
            createdAt: existing?.createdAt,
            syncStatus: 'pending-update',
        };
    }

    // New item
    return {
        ...values,
        id: finalId,
        syncStatus: 'pending-create',
    };
}

export async function genericSubmit<T extends { id: string, syncStatus?: string, updatedAt?: string, createdAt?: string }>(
    table: EntityTable<T, 'id'>,
    endpoint: string,
    id: string | undefined,
    values: any,
    navigate: (path: string) => void,
    redirectPath: string
) {
    const localData = await prepareLocal(table, id, values);
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

