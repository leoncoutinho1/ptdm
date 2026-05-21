import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, Stack, TextInput, Title, ActionIcon, Select, NumberInput, Checkbox, FileInput, Paper, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { MainLayout } from '../../layouts/MainLayout';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { db } from '@/utils/db';
import { genericSubmit, genericDelete } from '@/utils/syncHelper';
import { Trash2, Download, X } from 'lucide-react';
import { useConfirmDelete } from '@/hooks/useConfirmModal';
import { notifications } from '@mantine/notifications';

interface PayableFormValues {
    id?: string;
    supplierId: string;
    invoiceDate?: Date;
    dueDate: Date;
    value: number;
    paid: boolean;
    attachment?: string; // base64 string
}

// Helpers to handle UTC date-only conversions without timezone shift
function parseUTCToLocalDate(dateVal?: string | Date): Date | undefined {
    if (!dateVal) return undefined;
    if (dateVal instanceof Date) {
        return new Date(
            dateVal.getFullYear(),
            dateVal.getMonth(),
            dateVal.getDate(),
            0, 0, 0, 0
        );
    }
    if (typeof dateVal === 'string') {
        const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1; // 0-indexed
            const day = parseInt(match[3], 10);
            return new Date(year, month, day, 0, 0, 0, 0);
        }
    }
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return undefined;
    return new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0, 0, 0, 0
    );
}

function parseUTCToLocalDateRequired(dateVal?: string | Date): Date {
    const parsed = parseUTCToLocalDate(dateVal);
    return parsed || new Date();
}

function formatLocalToUTCDateString(dateVal?: Date | string): string | undefined {
    if (!dateVal) return undefined;
    if (typeof dateVal === 'string') {
        const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]}T12:00:00.000Z`;
        }
    }
    const dateObj = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (isNaN(dateObj.getTime())) return undefined;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00.000Z`;
}

export function PayableForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const item = (location.state as any)?.item;

    const [suppliers, setSuppliers] = useState<{ value: string; label: string }[]>([]);
    const [fileInputKey, setFileInputKey] = useState(0); // Helper to reset FileInput

    const form = useForm<PayableFormValues>({
        initialValues: {
            supplierId: '',
            invoiceDate: undefined,
            dueDate: new Date(),
            value: 0,
            paid: false,
            attachment: undefined,
        },
        validate: {
            supplierId: (value) => (!value ? 'Selecione um fornecedor' : null),
            dueDate: (value) => (!value ? 'Defina uma data de vencimento' : null),
            value: (value) => (value <= 0 ? 'O valor deve ser maior que zero' : null),
        },
    });

    useEffect(() => {
        // Fetch suppliers for the select dropdown
        db.suppliers.toArray().then(localSuppliers => {
            const list = localSuppliers
                .filter(s => s.syncStatus !== 'pending-delete')
                .map(s => ({ value: s.id.toLowerCase(), label: s.description }));
            setSuppliers(list);
        });
    }, []);

    useEffect(() => {
        if (item) {
            form.setValues({
                supplierId: item.supplierId?.toLowerCase() || '',
                invoiceDate: parseUTCToLocalDate(item.invoiceDate),
                dueDate: parseUTCToLocalDateRequired(item.dueDate),
                value: item.value,
                paid: item.paid,
                attachment: item.attachment,
            });
        } else if (id) {
            db.payables.get(id).then((found) => {
                if (found) {
                    form.setValues({
                        supplierId: found.supplierId?.toLowerCase() || '',
                        invoiceDate: parseUTCToLocalDate(found.invoiceDate),
                        dueDate: parseUTCToLocalDateRequired(found.dueDate),
                        value: found.value,
                        paid: found.paid,
                        attachment: found.attachment,
                    });
                }
            });
        }
    }, [id, item]);

    const handleFileChange = (file: File | null) => {
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            form.setFieldValue('attachment', base64);
            notifications.show({ color: 'green', title: 'Sucesso', message: 'Anexo adicionado com sucesso localmente.' });
        };
        reader.onerror = () => {
            notifications.show({ color: 'red', title: 'Erro', message: 'Falha ao ler o arquivo.' });
        };
        reader.readAsDataURL(file);
    };

    const downloadAttachment = () => {
        const base64Data = form.values.attachment;
        if (!base64Data) return;

        try {
            const link = document.createElement('a');
            link.href = base64Data;
            let extension = 'pdf';
            const match = base64Data.match(/^data:(.*);base64,/);
            if (match && match[1]) {
                const mimeType = match[1];
                if (mimeType.includes('pdf')) extension = 'pdf';
                else if (mimeType.includes('png')) extension = 'png';
                else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
                else if (mimeType.includes('excel') || mimeType.includes('sheet')) extension = 'xlsx';
                else if (mimeType.includes('word') || mimeType.includes('document')) extension = 'docx';
                else if (mimeType.includes('text')) extension = 'txt';
            }
            link.download = `anexo_conta_${id ? id.substring(0, 8) : 'nova'}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro ao baixar anexo', message: String(err) });
        }
    };

    const removeAttachment = () => {
        form.setFieldValue('attachment', undefined);
        setFileInputKey(prev => prev + 1); // Reset file input view
        notifications.show({ color: 'blue', title: 'Anexo removido', message: 'O arquivo de anexo foi limpo.' });
    };

    const submit = async (values: PayableFormValues) => {
        const selectedSupplier = suppliers.find(s => s.value === values.supplierId?.toLowerCase());
        
        const invoiceDateStr = formatLocalToUTCDateString(values.invoiceDate);
        const dueDateStr = formatLocalToUTCDateString(values.dueDate) || new Date().toISOString();

        const submitData = {
            ...values,
            supplierId: values.supplierId?.toLowerCase() || '',
            invoiceDate: invoiceDateStr,
            dueDate: dueDateStr,
            supplierDescription: selectedSupplier ? selectedSupplier.label : '',
        };

        await genericSubmit(db.payables, 'payable', id, submitData, navigate, '/payables');
    };

    const { openDeleteModal } = useConfirmDelete();

    const handleDelete = () => {
        openDeleteModal({
            title: 'Excluir Conta a Pagar',
            message: 'Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.',
            onConfirm: async () => {
                await genericDelete(db.payables, 'payable', id, navigate, '/payables');
            },
        });
    };

    return (
        <MainLayout>
            <Group justify="space-between" mb="md" style={{ paddingLeft: '2.5rem' }}>
                <Title order={3}>{id ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}</Title>
                {id && (
                    <ActionIcon color="red" variant="light" onClick={handleDelete} size="lg">
                        <Trash2 size={20} />
                    </ActionIcon>
                )}
            </Group>

            <Paper p="xl" shadow="sm" withBorder>
                <form onSubmit={form.onSubmit(submit)}>
                    <Stack gap="md">
                        <Select
                            label="Fornecedor"
                            placeholder="Selecione o fornecedor"
                            data={suppliers}
                            {...form.getInputProps('supplierId')}
                            searchable
                            clearable
                            required
                        />

                        <Group grow>
                            <DateInput
                                label="Data de Emissão"
                                placeholder="Data em que a nota foi emitida"
                                valueFormat="DD/MM/YYYY"
                                clearable
                                {...form.getInputProps('invoiceDate')}
                            />
                            <DateInput
                                label="Data de Vencimento"
                                placeholder="Data de vencimento do boleto/fatura"
                                valueFormat="DD/MM/YYYY"
                                required
                                {...form.getInputProps('dueDate')}
                            />
                        </Group>

                        <NumberInput
                            label="Valor (R$)"
                            placeholder="Ex: 1500.00"
                            min={0.01}
                            decimalScale={2}
                            fixedDecimalScale
                            prefix="R$ "
                            required
                            {...form.getInputProps('value')}
                        />

                        <Checkbox
                            label="Esta conta já está paga"
                            {...form.getInputProps('paid', { type: 'checkbox' })}
                        />

                        <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-default-hover)' }}>
                            <Stack gap="xs">
                                <Text size="sm" fw={500}>Arquivo em Anexo</Text>
                                
                                {form.values.attachment ? (
                                    <Group justify="space-between">
                                        <Text size="xs" c="dimmed">Existe um arquivo anexado a esta conta.</Text>
                                        <Group>
                                            <Button 
                                                variant="light" 
                                                size="xs" 
                                                leftSection={<Download size={14} />} 
                                                onClick={downloadAttachment}
                                            >
                                                Baixar Anexo
                                            </Button>
                                            <Button 
                                                variant="subtle" 
                                                color="red" 
                                                size="xs" 
                                                leftSection={<X size={14} />} 
                                                onClick={removeAttachment}
                                            >
                                                Remover
                                            </Button>
                                        </Group>
                                    </Group>
                                ) : (
                                    <FileInput
                                        key={fileInputKey}
                                        label="Adicionar Comprovante/Anexo"
                                        placeholder="Selecione um arquivo PDF, imagem ou planilha..."
                                        onChange={handleFileChange}
                                    />
                                )}
                            </Stack>
                        </Paper>

                        <Group justify="flex-end" mt="lg">
                            <Button variant="subtle" onClick={() => navigate('/payables')}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </Group>
                    </Stack>
                </form>
            </Paper>
        </MainLayout>
    );
}
