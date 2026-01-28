import { useEffect, useState, useRef } from 'react';
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';
import { useForm } from '@mantine/form';
import { Button, Group, NumberInput, Select, Stack, Table, Title, Paper, Text, Grid, Divider, Box, ScrollArea, ActionIcon } from '@mantine/core';
import { Eye, EyeOff, XCircle, Printer } from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { notifications } from '@mantine/notifications';
import { formatCurrency } from '@/utils/currency';
import { useNavigate, useParams } from 'react-router-dom';
import { db, Product, Cashier, Checkout, PaymentForm, Sale } from '@/utils/db';
import { useConfirmAction } from '@/hooks/useConfirmModal';

interface SaleItem {
    productId: string;
    product: Product;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
}

export function SaleForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isViewMode = !!id;

    // Refs para navegação por teclado
    const quantityRef = useRef<HTMLInputElement>(null);
    const productSelectRef = useRef<HTMLInputElement>(null);
    const paidValueRef = useRef<HTMLInputElement>(null);
    const saveSaleRef = useRef<HTMLButtonElement>(null);

    const [paymentForms, setPaymentForms] = useState<PaymentForm[]>([]);
    const [cashiers, setCashiers] = useState<Cashier[]>([]);
    const [checkouts, setCheckouts] = useState<Checkout[]>([]);
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [productOptions, setProductOptions] = useState<Product[]>([]);
    const [quantity, setQuantity] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedProductValue, setSelectedProductValue] = useState<string | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const { openConfirmModal } = useConfirmAction();

    const form = useForm({
        initialValues: {
            paymentFormId: localStorage.getItem('saleForm_paymentFormId') || '',
            cashierId: localStorage.getItem('saleForm_cashierId') || '',
            checkoutId: localStorage.getItem('saleForm_checkoutId') || '',
        },
        validate: {
            paymentFormId: (val) => (!val ? 'Selecione uma forma de pagamento' : null),
            cashierId: (val) => (!val ? 'Selecione um operador' : null),
            checkoutId: (val) => (!val ? 'Selecione um terminal' : null),
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pf, c, ch] = await Promise.all([
                    db.paymentForms.toArray(),
                    db.cashiers.toArray(),
                    db.checkouts.toArray()
                ]);

                setPaymentForms(pf);
                setCashiers(c);
                setCheckouts(ch);
            } catch (err) {
                notifications.show({ color: 'red', title: 'Erro ao carregar dados locais', message: String(err) });
            }
        };
        fetchData();
    }, []);

    // Carrega dados da venda se estiver em modo visualização
    useEffect(() => {
        if (id) {
            const fetchSale = async () => {
                try {
                    const sale = await db.sales.get(id);

                    if (sale) {
                        form.setValues({
                            paymentFormId: String(sale.paymentFormId || ''),
                            cashierId: String(sale.cashierId || ''),
                            checkoutId: String(sale.checkoutId || ''),
                        });

                        if (Array.isArray(sale.saleProducts)) {
                            const items = await Promise.all(sale.saleProducts.map(async (item: any) => {
                                const prod = await db.products.get(item.productId);
                                return {
                                    productId: item.productId,
                                    product: prod || { description: 'Produto não encontrado', price: item.unitPrice } as any,
                                    unitPrice: item.unitPrice,
                                    quantity: item.quantity,
                                    totalPrice: item.quantity * item.unitPrice,
                                };
                            }));
                            setSaleItems(items);
                        }
                        setAmountPaid(sale.paidValue || 0);
                    }
                } catch (err) {
                    notifications.show({ color: 'red', title: 'Erro ao carregar venda', message: String(err) });
                }
            };
            fetchSale();
        }
    }, [id]);

    useEffect(() => {
        if (form.values.paymentFormId) localStorage.setItem('saleForm_paymentFormId', form.values.paymentFormId);
    }, [form.values.paymentFormId]);

    useEffect(() => {
        if (form.values.cashierId) localStorage.setItem('saleForm_cashierId', form.values.cashierId);
    }, [form.values.cashierId]);

    useEffect(() => {
        if (form.values.checkoutId) localStorage.setItem('saleForm_checkoutId', form.values.checkoutId);
    }, [form.values.checkoutId]);

    const searchProducts = async () => {
        if (!searchTerm || searchTerm.length < 1) {
            setProductOptions([]);
            return;
        }

        setIsSearching(true);
        try {
            const lowerSearch = searchTerm.toLowerCase();
            const foundById = await db.products
                .filter(p =>
                    (Array.isArray(p.barcodes) && p.barcodes.some(b => b.toLowerCase() === lowerSearch))
                ).toArray();

            if (foundById.length === 1) {
                addProductToSale(foundById[0]);
            } else {
                const foundByDescription = await db.products
                    .filter(p =>
                        p.description.toLowerCase().includes(lowerSearch)
                    ).toArray();
                setProductOptions(foundByDescription);
            }
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro ao buscar produto', message: String(err) });
        } finally {
            setIsSearching(false);
        }
    };


    useEffect(() => {
        if (!isViewMode && quantityRef.current) {
            quantityRef.current.focus();
            quantityRef.current.select();
        }
    }, [isViewMode]);

    const handleQuantityKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            productSelectRef.current?.focus();
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (quantity <= 0 && saleItems.length > 0) {
                paidValueRef.current?.focus();
                setTimeout(() => paidValueRef.current?.select(), 100);
                return;
            }
            searchProducts();
        }
    };

    const handlePaidValueKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveSaleRef.current?.focus();
        }
    };

    const handleProductSelect = (productId: string | null) => {
        if (productId) {
            const product = productOptions.find(p => String(p.id) === productId);
            addProductToSale(product);
        }
    };

    const addProductToSale = (product?: Product) => {
        let item = product;
        let itemId = product?.id;

        if (!item) {
            notifications.show({ color: 'yellow', title: 'Atenção', message: 'Selecione um produto primeiro' });
            return;
        }

        if (quantity <= 0) {
            notifications.show({ color: 'yellow', title: 'Atenção', message: 'Quantidade deve ser maior que zero' });
            return;
        }

        const existingItemIndex = saleItems.findIndex(item => item.productId === itemId);

        if (existingItemIndex >= 0) {
            const updatedItems = [...saleItems];
            updatedItems[existingItemIndex].quantity += quantity;
            updatedItems[existingItemIndex].totalPrice = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
            setSaleItems(updatedItems);
        } else {
            const newItem: SaleItem = {
                productId: itemId!,
                product: item,
                quantity,
                unitPrice: item.price,
                totalPrice: quantity * item.price,
            };
            setSaleItems([...saleItems, newItem]);
        }

        setSearchTerm('');
        setProductOptions([]);
        setSelectedProductValue(null);
        setQuantity(0);
        quantityRef.current?.focus();
        setTimeout(() => quantityRef.current?.select(), 100);
    };

    const removeItem = (productId: string) => {
        setSaleItems(saleItems.filter(item => item.productId !== productId));
    };

    const totalSale = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const change = amountPaid - totalSale;

    const submitSale = async () => {
        const validation = form.validate();
        if (validation.hasErrors) return;

        if (saleItems.length === 0) {
            notifications.show({ color: 'yellow', title: 'Atenção', message: 'Adicione pelo menos um produto' });
            return;
        }

        if (amountPaid > 0 && amountPaid < totalSale) {
            notifications.show({ color: 'yellow', title: 'Atenção', message: 'Valor pago insuficiente' });
            return;
        }

        const saleData = {
            paymentFormId: form.values.paymentFormId,
            cashierId: form.values.cashierId,
            checkoutId: form.values.checkoutId,
            saleProducts: saleItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            })),
            totalValue: totalSale,
            paidValue: amountPaid > 0 ? amountPaid : totalSale,
            changeValue: amountPaid > 0 ? change : 0
        };

        const saleId = crypto.randomUUID();
        const now = new Date().toISOString();
        const localSale: Sale = {
            ...saleData,
            id: saleId,
            syncStatus: 'pending-create',
            createdAt: now,
        };
        resetForm();
        try {
            await db.sales.put(localSale);
            notifications.show({ color: 'green', title: 'Sucesso', message: 'Venda registrada!' });
            showPrintConfirmation();
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro', message: 'Falha ao salvar venda.' });
        }
    };

    const showPrintConfirmation = () => {
        openConfirmModal({
            title: 'Venda Finalizada',
            message: 'Deseja imprimir o comprovante?',
            confirmLabel: 'Sim, Imprimir',
            cancelLabel: 'Não',
            confirmColor: 'blue',
            onConfirm: handlePrint,
            onCancel: () => quantityRef.current?.focus()
        });
    };

    const resetForm = () => {
        setSaleItems([]);
        setAmountPaid(0);
        setSearchTerm('');
        setProductOptions([]);
        setQuantity(0);
        if (isViewMode) {
            navigate('/sales');
        }
    };

    const handlePrint = async () => {
        quantityRef.current?.focus();
        const encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', width: 48 });
        const result = encoder.initialize()
            .align('left')
            .bold(true)
            .size('large')
            .text(('*** PADARIA TREM DE MINAS ***').padStart(10))
            .newline()
            .text(new Date().toLocaleString("pt-BR"))
            .newline()
            .rule();

        saleItems.forEach((item) => {
            const description = item.product.description.substring(0, 48);
            const qtyPrice = `${item.quantity} ${item.product.unit} x ${formatCurrency(item.unitPrice)}`;
            const total = formatCurrency(item.totalPrice);
            result.text(description).newline()
                .text(qtyPrice.padEnd(38))
                .text(total.padStart(10))
                .newline();
        });

        const finalEncoded = result.rule()
            .align('right')
            .text(`TOTAL: ${formatCurrency(totalSale)}`)
            .newline()
            .text(`PAGO: ${formatCurrency(amountPaid)}`)
            .newline()
            .text(`TROCO: ${formatCurrency(change >= 0 ? change : 0)}`)
            .newline()
            .rule()
            .align('center')
            .text('Obrigado pela preferência!')
            .newline()
            .text('')
            .newline()
            .text('')
            .newline()
            .text('')
            .newline()
            .rule()
            .newline()
            .text('')
            .cut()
            .encode();

        // Converte Uint8Array para Array normal
        const byteArray = Array.from(finalEncoded);

        // try {
        // Tenta enviar para a API ESC/POS em localhost:3031
        const response = await fetch('http://localhost:3031/api/print', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: byteArray,
                jobName: 'Cupom de Venda',
                defaultPrinter: true
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Impressão enviada com sucesso:', result);
            notifications.show({
                color: 'green',
                title: 'Sucesso',
                message: 'Cupom enviado para impressora!'
            });
            return;
        } else {
            throw new Error('Falha ao enviar para impressora via API');
        }
        // } catch (apiError) {
        //     console.warn('Erro ao usar API de impressão:', apiError);

        //     // Fallback 1: Tenta usar Web Serial API
        //     if ('serial' in navigator) {
        //         try {
        //             const port = await (navigator as any).serial.requestPort();
        //             await port.open({ baudRate: 9600 });
        //             const writer = port.writable.getWriter();
        //             await writer.write(finalEncoded);
        //             await writer.releaseLock();
        //             await port.close();
        //             notifications.show({
        //                 color: 'green',
        //                 title: 'Sucesso',
        //                 message: 'Cupom impresso via Serial!'
        //             });
        //             return;
        //         } catch (serialError) {
        //             console.error('Erro na impressora serial:', serialError);
        //         }
        //     }

        //     // Fallback 2: window.print()
        //     notifications.show({
        //         color: 'yellow',
        //         title: 'Atenção',
        //         message: 'Usando impressão padrão do navegador'
        //     });
        //     window.print();
        // }
    };

    return (
        <MainLayout>
            <Box style={{ height: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Group justify="space-between" mb="md" style={{ flexShrink: 0 }} align="flex-end">
                    <Title order={3} style={{ paddingLeft: '2.5rem' }}>{isViewMode ? 'Visualizar Venda' : 'Registrar Venda'}</Title>

                    <Group gap="xs" style={{ flex: 1, maxWidth: '600px' }}>
                        <Select
                            placeholder="Forma de Pagamento"
                            data={paymentForms.map(pf => ({ value: String(pf.id), label: pf.description }))}
                            {...form.getInputProps('paymentFormId')}
                            required
                            disabled={isViewMode}
                            size="xs"
                            style={{ flex: 1, minWidth: '150px' }}
                        />
                        <Select
                            placeholder="Operador"
                            data={cashiers.map(c => ({ value: String(c.id), label: c.name }))}
                            {...form.getInputProps('cashierId')}
                            required
                            disabled={isViewMode}
                            size="xs"
                            style={{ flex: 1, minWidth: '150px' }}
                        />
                        <Select
                            placeholder="Terminal"
                            data={checkouts.map(ch => ({ value: String(ch.id), label: ch.name }))}
                            {...form.getInputProps('checkoutId')}
                            required
                            disabled={isViewMode}
                            size="xs"
                            style={{ flex: 1, minWidth: '150px' }}
                        />
                    </Group>

                    <Group gap="xs">
                        {isViewMode && (
                            <Button
                                variant="light"
                                leftSection={<Printer size={18} />}
                                onClick={handlePrint}
                                size="xs"
                            >
                                Imprimir Cupom
                            </Button>
                        )}
                        <ActionIcon variant="subtle" color="gray" onClick={() => setShowReceipt(!showReceipt)}>
                            {showReceipt ? <Eye size={20} /> : <EyeOff size={20} />}
                        </ActionIcon>
                    </Group>
                </Group>

                <Grid align="stretch" style={{ flex: 1, height: '92vh' }} gutter="xs">
                    <Grid.Col span={showReceipt ? { base: 9 } : 12} style={{ display: 'flex', flexDirection: 'column', height: '92vh' }}>
                        <Stack gap="md" style={{ height: '92vh' }}>

                            {!isViewMode && (
                                <Group align="flex-end" style={{ flexShrink: 0 }}>
                                    <NumberInput label="Qtd" value={quantity} onChange={(val) => setQuantity(Number(val) || 0)} min={0} style={{ width: 80 }} ref={quantityRef} onKeyDown={handleQuantityKeyDown} />
                                    <Select
                                        label="Buscar Produto"
                                        placeholder="Pesquisar..."
                                        searchable
                                        searchValue={searchTerm}
                                        value={selectedProductValue}
                                        onSearchChange={setSearchTerm}
                                        onChange={handleProductSelect}
                                        data={productOptions.map(p => ({ value: String(p.id), label: p.description }))}
                                        filter={({ options }) => options}
                                        style={{ flex: 1 }}
                                        clearable
                                        ref={productSelectRef}
                                        onKeyDown={handleSearchKeyDown}
                                    />
                                </Group>
                            )}

                            <ScrollArea style={{ flex: 1 }}>
                                <Table striped highlightOnHover withTableBorder withColumnBorders>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Produto</Table.Th>
                                            <Table.Th w={60}>Qtd</Table.Th>
                                            <Table.Th w={100}>Unit.</Table.Th>
                                            <Table.Th w={100}>Total</Table.Th>
                                            {!isViewMode && <Table.Th w={50}></Table.Th>}
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {saleItems.map((item) => (
                                            <Table.Tr key={item.productId}>
                                                <Table.Td>{item.product?.description}</Table.Td>
                                                <Table.Td>{item.quantity}</Table.Td>
                                                <Table.Td>{formatCurrency(item.unitPrice)}</Table.Td>
                                                <Table.Td>{formatCurrency(item.totalPrice)}</Table.Td>
                                                {!isViewMode && <Table.Td><XCircle size={18} color="red" onClick={() => removeItem(item.productId)} style={{ cursor: 'pointer' }} /></Table.Td>}
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </ScrollArea>

                            <Stack gap="md" py="md" style={{ flexShrink: 0 }}>
                                <Group justify="flex-end">
                                    <Paper
                                        p="xs"
                                        withBorder
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: 54,
                                            width: '50%',
                                            background: 'var(--mantine-color-blue-light)',
                                            borderColor: 'var(--mantine-color-blue-outline)'
                                        }}
                                    >
                                        <Stack gap={0} align="center">
                                            <Text size="md" c="dimmed">Total</Text>
                                            <Text size="lg" fw={700} style={{ fontSize: '2.5rem' }} c="var(--mantine-color-blue-filled)">{formatCurrency(totalSale)}</Text>
                                        </Stack>
                                    </Paper>
                                </Group>

                                {!isViewMode && (
                                    <Group align="flex-end" gap="md">
                                        <NumberInput
                                            label="Valor Pago"
                                            value={amountPaid}
                                            onChange={(val) => setAmountPaid(Number(val) || 0)}
                                            min={0}
                                            decimalScale={2}
                                            fixedDecimalScale={true}
                                            prefix="R$ "
                                            size="lg"
                                            style={{ flex: 1 }}
                                            ref={paidValueRef}
                                            onKeyDown={handlePaidValueKeyDown}
                                        />
                                        <NumberInput
                                            label="Troco"
                                            value={change >= 0 ? change : 0}
                                            min={0}
                                            decimalScale={2}
                                            fixedDecimalScale={true}
                                            prefix="R$ "
                                            size="lg"
                                            style={{ flex: 1 }}
                                            readOnly
                                            styles={{
                                                input: {
                                                    cursor: 'default',
                                                    backgroundColor: 'var(--mantine-color-body)',
                                                }
                                            }}
                                        />
                                        <Button
                                            size="lg"
                                            onClick={submitSale}
                                            disabled={saleItems.length === 0}
                                            ref={saveSaleRef}
                                            style={{ minHeight: 54, alignSelf: 'flex-end' }}
                                        >
                                            Finalizar
                                        </Button>
                                    </Group>
                                )}
                            </Stack>
                        </Stack>
                    </Grid.Col>

                    {showReceipt && (
                        <Grid.Col span={{ base: 3 }}>
                            <Paper shadow="sm" p="md" withBorder style={{ backgroundColor: '#fffbe6', fontFamily: 'monospace', height: '90vh', overflowY: 'auto' }}>
                                <Stack gap="xs">
                                    <Text ta="center" fw={700}>*** CUPOM ***</Text>
                                    <Divider my="sm" style={{ borderTopStyle: 'dashed' }} />
                                    {saleItems.map((item, index) => (
                                        <Box key={index}>
                                            <Text size="xs">{item.product.description}</Text>
                                            <Group justify="space-between"><Text size="xs">{item.quantity} {item.product.unit} x {formatCurrency(item.unitPrice)}</Text><Text size="xs">{formatCurrency(item.totalPrice)}</Text></Group>
                                        </Box>
                                    ))}
                                    <Divider my="sm" style={{ borderTopStyle: 'dashed' }} />
                                    <Group justify="space-between"><Text fw={700}>TOTAL</Text><Text fw={700}>{formatCurrency(totalSale)}</Text></Group>
                                </Stack>
                            </Paper>
                        </Grid.Col>
                    )}
                </Grid>
            </Box>


        </MainLayout>
    );
}
