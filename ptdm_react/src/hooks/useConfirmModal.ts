import { modals } from '@mantine/modals';

interface ConfirmDeleteOptions {
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
}

export function useConfirmDelete() {
    const openDeleteModal = ({
        title = 'Confirmar exclusão',
        message = 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
        confirmLabel = 'Excluir',
        cancelLabel = 'Cancelar',
        onConfirm,
    }: ConfirmDeleteOptions) => {
        modals.openConfirmModal({
            title,
            centered: true,
            children: message,
            labels: { confirm: confirmLabel, cancel: cancelLabel },
            confirmProps: { color: 'red' },
            cancelProps: { autoFocus: true },
            onConfirm,
        });
    };

    return { openDeleteModal };
}

interface ConfirmActionOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: string;
    onConfirm: () => void | Promise<void>;
}

export function useConfirmAction() {
    const openConfirmModal = ({
        title,
        message,
        confirmLabel = 'Confirmar',
        cancelLabel = 'Cancelar',
        confirmColor = 'blue',
        onConfirm,
    }: ConfirmActionOptions) => {
        modals.openConfirmModal({
            title,
            centered: true,
            children: message,
            labels: { confirm: confirmLabel, cancel: cancelLabel },
            confirmProps: { color: confirmColor },
            cancelProps: { 'data-autofocus': true },
            onConfirm,
        });
    };

    return { openConfirmModal };
}
