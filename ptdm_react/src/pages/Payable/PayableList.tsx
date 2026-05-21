import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { ActionIcon, Group, Table, Title, Pagination, Stack, Badge, TextInput, Select, Text, Card } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { db, Payable } from '@/utils/db';
import { Link, useNavigate } from 'react-router-dom';
import { CirclePlus, Download, Paperclip, Search } from 'lucide-react';

export function PayableList() {
    const [items, setItems] = useState<Payable[]>([]);
    const [activePage, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchSupplier, setSearchSupplier] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('todos');
    const pageSize = 10;
    const navigate = useNavigate();

    const fetchItems = useCallback(async (page: number, supplierText: string, status: string) => {
        try {
            const offset = (page - 1) * pageSize;

            // Fetch from local IndexedDB, excluding items marked for deletion
            let collection = db.payables.filter(p => p.syncStatus !== 'pending-delete');

            // Apply filters in memory/Dexie
            const allItems = await collection.toArray();

            let filtered = allItems;

            if (supplierText.trim()) {
                const lowerSearch = supplierText.toLowerCase();
                filtered = filtered.filter(p => 
                    p.supplierDescription?.toLowerCase().includes(lowerSearch)
                );
            }

            if (status === 'pago') {
                filtered = filtered.filter(p => p.paid === true);
            } else if (status === 'pendente') {
                filtered = filtered.filter(p => p.paid === false);
            }

            // Sort by Due Date descending (newest due dates first)
            filtered.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

            const total = filtered.length;
            const paginatedData = filtered.slice(offset, offset + pageSize);

            setItems(paginatedData);
            setTotalCount(total);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro ao carregar contas a pagar', message: String(err) });
        }
    }, [pageSize]);

    useEffect(() => {
        fetchItems(activePage, searchSupplier, statusFilter);
    }, [activePage, searchSupplier, statusFilter, fetchItems]);

    // Reset to page 1 on filter changes
    useEffect(() => {
        setPage(1);
    }, [searchSupplier, statusFilter]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const formatDate = (isoString?: string) => {
        if (!isoString) return '-';
        const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const [_, year, month, day] = match;
            return `${day}/${month}/${year}`;
        }
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '-';
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const downloadAttachment = (e: React.MouseEvent, base64Data: string, id: string) => {
        e.stopPropagation(); // Avoid triggering row click to edit page
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
            link.download = `anexo_conta_${id.substring(0, 8)}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notifications.show({ color: 'green', title: 'Download iniciado', message: 'O arquivo anexo está sendo baixado.' });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro ao baixar anexo', message: String(err) });
        }
    };

    return (
        <MainLayout>
            <Group justify="space-between" mb="md">
                <Title order={3} style={{ paddingLeft: '2.5rem' }}>Contas a Pagar</Title>
                <ActionIcon component={Link} to="/payables/new" variant="light" size="lg">
                    <CirclePlus size={20} />
                </ActionIcon>
            </Group>

            <Card shadow="xs" p="md" mb="md" withBorder>
                <Group grow gap="md">
                    <TextInput
                        placeholder="Buscar por fornecedor..."
                        label="Fornecedor"
                        leftSection={<Search size={16} />}
                        value={searchSupplier}
                        onChange={(e) => setSearchSupplier(e.currentTarget.value)}
                    />
                    <Select
                        label="Status de Pagamento"
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val || 'todos')}
                        data={[
                            { value: 'todos', label: 'Todos' },
                            { value: 'pago', label: 'Pago' },
                            { value: 'pendente', label: 'Pendente' }
                        ]}
                    />
                </Group>
            </Card>

            <Stack gap="md">
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Fornecedor</Table.Th>
                            <Table.Th w={150}>Data Emissão</Table.Th>
                            <Table.Th w={150}>Data Vencimento</Table.Th>
                            <Table.Th w={150}>Valor</Table.Th>
                            <Table.Th w={120}>Status</Table.Th>
                            <Table.Th w={90} style={{ textAlign: 'center' }}>Anexo</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={6} style={{ textAlign: 'center' }}>Nenhuma conta a pagar encontrada.</Table.Td>
                            </Table.Tr>
                        ) : (
                            items.map((item) => (
                                <Table.Tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/payables/${item.id}`, { state: { item } })}>
                                    <Table.Td>{item.supplierDescription || 'Fornecedor não especificado'}</Table.Td>
                                    <Table.Td>{formatDate(item.invoiceDate)}</Table.Td>
                                    <Table.Td>{formatDate(item.dueDate)}</Table.Td>
                                    <Table.Td fw={500}>{formatCurrency(item.value)}</Table.Td>
                                    <Table.Td>
                                        <Badge color={item.paid ? 'green' : 'red'} variant="light">
                                            {item.paid ? 'Pago' : 'Pendente'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'center' }}>
                                        {item.attachment ? (
                                            <ActionIcon color="blue" variant="subtle" onClick={(e) => downloadAttachment(e, item.attachment!, item.id)}>
                                                <Download size={16} />
                                            </ActionIcon>
                                        ) : (
                                            <Text size="xs" c="dimmed">-</Text>
                                        )}
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        )}
                    </Table.Tbody>
                </Table>

                {totalPages > 1 && (
                    <Group justify="center" mt="md">
                        <Pagination total={totalPages} value={activePage} onChange={setPage} />
                    </Group>
                )}
            </Stack>
        </MainLayout>
    );
}
