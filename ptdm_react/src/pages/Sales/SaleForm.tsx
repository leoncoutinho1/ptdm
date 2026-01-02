import { useEffect, useState, useRef } from 'react';
import { useForm } from '@mantine/form';
import { Button, Group, NumberInput, Select, Stack, Table, TextInput, Title, Paper, Text, Grid, Modal, Divider, Box, ScrollArea, ActionIcon, Accordion } from '@mantine/core';
import { MainLayout } from '../../layouts/MainLayout';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '@/utils/apiHelper';
import { formatCurrency } from '@/utils/currency';
import { useParams } from 'react-router-dom';
import { IResult } from '@/models/IResult';
import { ISaleDTO } from '@/models/ISaleDTO';

interface PaymentForm {
    id: string | number;
    description: string;
}

interface Cashier {
    id: string | number;
    name: string;
}

interface Checkout {
    id: string | number;
    name: string;
}

interface Product {
    id: string | number;
    description: string;
    price: number;
    barcode?: string;
    barcodes?: string[];
}

interface SaleItem {
    productId: string | number;
    product: Product;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
}

export function SaleForm() {
    const { id } = useParams<{ id: string }>();
    const isViewMode = !!id;

    // Refs para navegação por teclado
    const quantityRef = useRef<HTMLInputElement>(null);
    const productSelectRef = useRef<HTMLInputElement>(null);
    const paidValueRef = useRef<HTMLInputElement>(null);
    const saveSaleRef = useRef<HTMLButtonElement>(null);
    const noPrintModalRef = useRef<HTMLButtonElement>(null);
    const [paymentForms, setPaymentForms] = useState<PaymentForm[]>([]);
    const [cashiers, setCashiers] = useState<Cashier[]>([]);
    const [checkouts, setCheckouts] = useState<Checkout[]>([]);
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [productOptions, setProductOptions] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);

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
                const [paymentFormsRes, cashiersRes, checkoutsRes] = await Promise.all([
                    await apiRequest<any>('paymentForm/ListPaymentForm'),
                    await apiRequest<any>('cashier/listCashier'),
                    await apiRequest<any>('checkout/listCheckout'),
                ]);

                setPaymentForms(Array.isArray(paymentFormsRes.data) ? paymentFormsRes.data : []);
                setCashiers(Array.isArray(cashiersRes.data) ? cashiersRes.data : []);
                setCheckouts(Array.isArray(checkoutsRes.data) ? checkoutsRes.data : []);
            } catch (err) {
                notifications.show({ color: 'red', title: 'Erro', message: String(err) });
            }
        };
        fetchData();
    }, []);

    // Carrega dados da venda se estiver em modo visualização
    useEffect(() => {
        if (id) {
            const fetchSale = async () => {
                try {
                    const result = await apiRequest<IResult<ISaleDTO>>(`sale/${id}`);
                    const sale = result.value;

                    // Preenche o formulário
                    form.setValues({
                        paymentFormId: String(sale.paymentFormId || ''),
                        cashierId: String(sale.cashierId || ''),
                        checkoutId: String(sale.checkoutId || ''),
                    });
                    console.log(sale);
                    // Preenche os itens da venda
                    if (Array.isArray(sale.saleProducts)) {
                        const items = sale.saleProducts.map((item: any) => ({
                            productId: item.productId,
                            product: item.product,
                            unitPrice: item.unitPrice,
                            quantity: item.quantity,
                            totalPrice: item.quantity * item.unitPrice,
                        }));
                        setSaleItems(items);
                    }

                    // Preenche valores pagos
                    setAmountPaid(sale.paidValue || 0);
                } catch (err) {
                    notifications.show({ color: 'red', title: 'Erro ao carregar venda', message: String(err) });
                }
            };
            fetchSale();
        }
    }, [id]);

    // Salva os valores no localStorage sempre que mudarem
    useEffect(() => {
        if (form.values.paymentFormId) {
            localStorage.setItem('saleForm_paymentFormId', form.values.paymentFormId);
        }
    }, [form.values.paymentFormId]);

    useEffect(() => {
        if (form.values.cashierId) {
            localStorage.setItem('saleForm_cashierId', form.values.cashierId);
        }
    }, [form.values.cashierId]);

    useEffect(() => {
        if (form.values.checkoutId) {
            localStorage.setItem('saleForm_checkoutId', form.values.checkoutId);
        }
    }, [form.values.checkoutId]);

    // Função para buscar produtos (acionada ao pressionar Enter)
    const searchProducts = async () => {
        console.log('chamou aqui')
        if (!searchTerm || searchTerm.length < 1) {
            setProductOptions([]);
            return;
        }

        setIsSearching(true);
        try {
            const result = await apiRequest<any>(`product/GetProductByDescOrBarcode/${encodeURIComponent(searchTerm)}`);
            const foundProducts = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
            setProductOptions(foundProducts);

            // Se retornar apenas 1 produto, seleciona automaticamente
            if (foundProducts.length === 1) {
                const product = foundProducts[0];
                addProductToSale(product);
            }
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro ao buscar produto', message: String(err) });
            setProductOptions([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Foco automático no botão "Não" quando o modal de impressão abrir
    useEffect(() => {
        if (showPrintModal && noPrintModalRef.current) {
            setTimeout(() => {
                noPrintModalRef.current?.focus();
            }, 100);
        }
    }, [showPrintModal]);

    // Foco automático no campo quantidade ao abrir (apenas no modo criação)
    useEffect(() => {
        if (!isViewMode && quantityRef.current) {
            quantityRef.current.focus();
            quantityRef.current.select();
        }
    }, [isViewMode]);

    // Handler para Enter no campo quantidade
    const handleQuantityKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            productSelectRef.current?.focus();
        }
    };

    // Handler para Enter no campo de busca de produtos
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            console.log(quantity);
            console.log(saleItems.length);
            if (quantity <= 0 && saleItems.length > 0) {
                paidValueRef.current?.focus();
                paidValueRef.current?.select();
                return;
            }
            searchProducts();
        }
    };

    // Handler para Enter no campo de valor pago
    const handlePaidValueKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (amountPaid === 0) {
                setAmountPaid(totalSale);
            }
            saveSaleRef.current?.focus();
        }
    };

    const handleProductSelect = (productId: string | null) => {
        setSelectedProductId(productId);
        if (productId) {
            const product = productOptions.find(p => String(p.id) === productId);
            setSelectedProduct(product || null);
        } else {
            setSelectedProduct(null);
        }
    };

    const addProductToSale = (product?: Product) => {
        let item = product || selectedProduct;
        let itemId = product?.id || selectedProduct?.id;

        if (!item && quantity <= 0 && saleItems.length > 0) {
            paidValueRef.current?.focus();
            paidValueRef.current?.select();
            return;
        }

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
        setSelectedProductId(null);
        setSelectedProduct(null);
        setProductOptions([]);
        setQuantity(0);
        quantityRef.current?.focus();
        quantityRef.current?.select();
    };

    const removeItem = (productId: string | number) => {
        setSaleItems(saleItems.filter(item => item.productId !== productId));
    };

    const totalSale = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const change = amountPaid - totalSale;

    const submitSale = async () => {
        const validation = form.validate();
        if (validation.hasErrors) {
            notifications.show({ color: 'yellow', title: 'Atenção', message: 'Preencha todos os campos obrigatórios' });
            return;
        }

        if (saleItems.length === 0) {
            notifications.show({ color: 'yellow', title: 'Atenção', message: 'Adicione pelo menos um produto à venda' });
            return;
        }

        if (amountPaid > 0 && amountPaid < totalSale) {
            notifications.show({ color: 'yellow', title: 'Atenção', message: 'Valor pago é insuficiente' });
            return;
        }

        try {
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

            await apiRequest('sale', 'POST', saleData);
            notifications.show({ color: 'green', title: 'Sucesso', message: 'Venda registrada com sucesso!' });
            setShowPrintModal(true);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro ao registrar venda', message: String(err) });
        }
    };

    const resetForm = () => {
        setSaleItems([]);
        setAmountPaid(0);
        setSearchTerm('');
        setSelectedProductId(null);
        setSelectedProduct(null);
        setProductOptions([]);
        setQuantity(0);
        setShowPrintModal(false);
        setTimeout(() => {
            quantityRef.current?.focus();
        }, 100);
    };

    const handlePrint = () => {
        window.print();
        resetForm();
    };

    return (
        <MainLayout>
            <Box style={{ height: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                <Group justify="space-between" mb="md" style={{ flexShrink: 0 }}>
                    <Title order={3} style={{ paddingLeft: '2.5rem' }}>{isViewMode ? 'Visualizar Venda' : 'Registrar Venda'}</Title>
                    <ActionIcon variant="subtle" color="gray" onClick={() => setShowReceipt(!showReceipt)} title={showReceipt ? "Ocultar Cupom" : "Mostrar Cupom"}>
                        {showReceipt ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                        )}
                    </ActionIcon>
                </Group>

                <Grid align="stretch" style={{ flex: 1, height: '92vh' }} gutter="xs">
                    <Grid.Col span={showReceipt ? { base: 12, md: 7, lg: 8 } : 12} style={{ display: 'flex', flexDirection: 'column', height: '92vh' }}>
                        <Stack gap="md" style={{ height: '92vh' }}>
                            <Accordion variant="separated" defaultValue="config" style={{ flexShrink: 0 }}>
                                <Accordion.Item value="config">
                                    <Accordion.Control style={{ maxHeight: '2rem' }}>Dados da Venda</Accordion.Control>
                                    <Accordion.Panel>
                                        <Group grow>
                                            <Select
                                                label="Forma de Pagamento"
                                                placeholder="Selecione"
                                                data={paymentForms.map(pf => ({ value: String(pf.id), label: pf.description }))}
                                                {...form.getInputProps('paymentFormId')}
                                                required
                                                readOnly={isViewMode}
                                                disabled={isViewMode}
                                            />
                                            <Select
                                                label="Operador"
                                                placeholder="Selecione"
                                                data={cashiers.map(c => ({ value: String(c.id), label: c.name }))}
                                                {...form.getInputProps('cashierId')}
                                                required
                                                readOnly={isViewMode}
                                                disabled={isViewMode}
                                            />
                                            <Select
                                                label="Terminal de Caixa"
                                                placeholder="Selecione"
                                                data={checkouts.map(ch => ({ value: String(ch.id), label: ch.name }))}
                                                {...form.getInputProps('checkoutId')}
                                                required
                                                readOnly={isViewMode}
                                                disabled={isViewMode}
                                            />
                                        </Group>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            </Accordion>

                            {/* Segunda linha: Busca de produto - apenas no modo de criação */}
                            {!isViewMode && (
                                <Group align="flex-end" style={{ flexShrink: 0 }}>
                                    <NumberInput
                                        label="Quantidade"
                                        value={quantity}
                                        onChange={(val) => setQuantity(Number(val) || 0)}
                                        min={0}
                                        style={{ width: 120 }}
                                        ref={quantityRef}
                                        onKeyDown={handleQuantityKeyDown}
                                    />
                                    <Select
                                        label="Buscar Produto"
                                        placeholder="Digite para buscar..."
                                        searchable
                                        searchValue={searchTerm}
                                        onSearchChange={setSearchTerm}
                                        value={selectedProductId}
                                        onChange={handleProductSelect}
                                        data={productOptions.map(p => ({
                                            value: String(p.id),
                                            label: p.description
                                        }))}
                                        filter={({ options }) => options}
                                        limit={Infinity}
                                        nothingFoundMessage={isSearching ? 'Buscando...' : 'Nenhum produto encontrado'}
                                        style={{ flex: 1 }}
                                        clearable
                                        ref={productSelectRef}
                                        onKeyDown={handleSearchKeyDown}
                                    />
                                </Group>
                            )}

                            {/* Tabela de itens da venda */}
                            <ScrollArea scrollbars="y" style={{ flex: 1, minHeight: 0 }}>
                                <Table striped highlightOnHover withTableBorder withColumnBorders style={{ color: '#228be6', fontWeight: 'bold' }}>
                                    <Table.Thead style={{ color: 'black', fontWeight: 'bold' }}>
                                        <Table.Tr>
                                            <Table.Th>Produto</Table.Th>
                                            <Table.Th>Qtd</Table.Th>
                                            <Table.Th>Vlr. Unit.</Table.Th>
                                            <Table.Th>Total</Table.Th>
                                            {!isViewMode && <Table.Th>Ações</Table.Th>}
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {saleItems.length === 0 ? (
                                            <Table.Tr>
                                                <Table.Td colSpan={isViewMode ? 4 : 5} style={{ textAlign: 'center', color: '#888' }}>
                                                    Nenhum produto adicionado
                                                </Table.Td>
                                            </Table.Tr>
                                        ) : (
                                            saleItems.map((item) => (
                                                <Table.Tr key={item.productId}>
                                                    <Table.Td>{item.product?.description}</Table.Td>
                                                    <Table.Td>{item.quantity}</Table.Td>
                                                    <Table.Td>{formatCurrency(item.unitPrice)}</Table.Td>
                                                    <Table.Td>{formatCurrency(item.totalPrice)}</Table.Td>
                                                    {!isViewMode && (
                                                        <Table.Td>
                                                            <Button size="xs" color="red" onClick={() => removeItem(item.productId)}>
                                                                Remover
                                                            </Button>
                                                        </Table.Td>
                                                    )}
                                                </Table.Tr>
                                            ))
                                        )}
                                    </Table.Tbody>
                                </Table>
                            </ScrollArea>

                            {/* Resumo da venda e Botão Finalizar */}
                            <Group align="flex-end" gap="md" py="md" style={{ flexShrink: 0, marginTop: 'auto' }}>
                                <Group grow style={{ flex: 1 }} align="flex-end">
                                    <NumberInput
                                        label="Valor Pago"
                                        value={amountPaid}
                                        ref={paidValueRef}
                                        onChange={(val) => setAmountPaid(Number(val) || 0)}
                                        min={0}
                                        decimalScale={2}
                                        fixedDecimalScale
                                        prefix="R$ "
                                        readOnly={isViewMode}
                                        disabled={isViewMode}
                                        onKeyDown={handlePaidValueKeyDown}
                                    />
                                    <Paper p="sm" withBorder style={{ backgroundColor: '#f0f0f0' }}>
                                        <Text size="lg" fw={700} ta="center">
                                            Total: {formatCurrency(totalSale)}
                                        </Text>
                                    </Paper>
                                    <Paper p="sm" withBorder>
                                        <Text size="md" ta="center">
                                            Troco: {formatCurrency(change >= 0 ? change : 0)}
                                        </Text>
                                    </Paper>
                                </Group>

                                {!isViewMode && (
                                    <Button size="lg" onClick={submitSale} disabled={saleItems.length === 0} ref={saveSaleRef}>
                                        Finalizar Venda
                                    </Button>
                                )}
                            </Group>
                        </Stack>
                    </Grid.Col>

                    {/* Cupom Fiscal Lateral */}
                    {showReceipt && (
                        <Grid.Col span={{ base: 12, md: 5, lg: 4 }} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-receipt, #printable-receipt * {
                            visibility: visible;
                        }
                        #printable-receipt {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            margin: 0;
                            padding: 0;
                            background-color: white !important;
                            box-shadow: none !important;
                            border: none !important;
                            min-height: auto !important;
                        }
                        /* Força a exibição de todo o conteúdo do ScrollArea na impressão */
                        #printable-receipt .mantine-ScrollArea-root,
                        #printable-receipt .mantine-ScrollArea-viewport {
                            height: auto !important;
                            max-height: none !important;
                            overflow: visible !important;
                        }
                        /* Esconde elementos de layout como navbar se eles ainda estiverem visíveis */
                        nav, header, footer {
                            display: none !important;
                        }
                    }
                `}</style>
                            <Paper id="printable-receipt" shadow="sm" p="md" withBorder style={{ backgroundColor: '#fffbe6', fontFamily: 'monospace', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <ScrollArea style={{ flex: 1 }} scrollbars="y">
                                    <Stack gap="xs">
                                        <Text ta="center" fw={700}>*** CUPOM DE VENDA ***</Text>
                                        <Text ta="center" size="sm">{new Date().toLocaleString("pt-BR")}</Text>
                                        <Divider my="sm" style={{ borderTopStyle: 'dashed' }} />

                                        <Group justify="space-between">
                                            <Text size="sm">ITEM</Text>
                                            <Text size="sm">VALOR</Text>
                                        </Group>
                                        <Divider my="xs" style={{ borderTopStyle: 'dashed' }} />

                                        <Box>
                                            {saleItems.length === 0 ? (
                                                <Text ta="center" size="sm" c="dimmed" py="xl">...aguardando itens...</Text>
                                            ) : (
                                                saleItems.map((item, index) => (
                                                    <Box key={index} mb="xs">
                                                        <Text size="sm" lineClamp={1}>{item.product.description}</Text>
                                                        <Group justify="space-between">
                                                            <Text size="xs">{item.quantity} x {formatCurrency(item.unitPrice)}</Text>
                                                            <Text size="sm">{formatCurrency(item.totalPrice)}</Text>
                                                        </Group>
                                                    </Box>
                                                ))
                                            )}
                                        </Box>

                                        <Divider my="sm" style={{ borderTopStyle: 'dashed' }} />
                                        <Group justify="space-between">
                                            <Text fw={700}>TOTAL</Text>
                                            <Text fw={700}>{formatCurrency(totalSale)}</Text>
                                        </Group>
                                        <Group justify="space-between">
                                            <Text size="sm">PAGO</Text>
                                            <Text size="sm">{formatCurrency(amountPaid)}</Text>
                                        </Group>
                                        <Group justify="space-between">
                                            <Text size="sm">TROCO</Text>
                                            <Text size="sm">{formatCurrency(change >= 0 ? change : 0)}</Text>
                                        </Group>

                                        <Divider my="sm" style={{ borderTopStyle: 'dashed' }} />
                                        <Text ta="center" size="xs">Obrigado pela preferência!</Text>
                                    </Stack>
                                </ScrollArea>
                            </Paper>
                        </Grid.Col>
                    )}
                </Grid>

            </Box>

            {/* Modal de Impressão */}
            <Modal opened={showPrintModal} onClose={resetForm} title="Venda Finalizada" centered>
                <Stack>
                    <Text>Deseja imprimir o comprovante da venda?</Text>
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={resetForm} ref={noPrintModalRef}>Não</Button>
                        <Button color="blue" onClick={handlePrint}>Sim, Imprimir</Button>
                    </Group>
                </Stack>
            </Modal>
        </MainLayout>
    );
}
