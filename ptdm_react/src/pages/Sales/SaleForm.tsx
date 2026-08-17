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
    itemDiscount: number;
    totalPrice: number;
    order: number;
}

export function SaleForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isViewMode = !!id;

    // Refs para navegação por teclado
    const productSelectRef = useRef<HTMLInputElement>(null);
    const paidValueRef = useRef<HTMLInputElement>(null);
    const saveSaleRef = useRef<HTMLButtonElement>(null);
    const discountRef = useRef<HTMLInputElement>(null);

    const [paymentForms, setPaymentForms] = useState<PaymentForm[]>([]);
    const [cashiers, setCashiers] = useState<Cashier[]>([]);
    const [checkouts, setCheckouts] = useState<Checkout[]>([]);
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [productOptions, setProductOptions] = useState<Product[]>([]);
    const [quantity, setQuantity] = useState<number>(1);
    const [amountPaid, setAmountPaid] = useState(0);
    const [selectedProductValue, setSelectedProductValue] = useState<string | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<number>(0);
    const [editingDiscountProductId, setEditingDiscountProductId] = useState<string | null>(null);
    const [editingDiscountValue, setEditingDiscountValue] = useState<number>(0);
    const editingProductIdRef = useRef<string | null>(null);
    const editingDiscountProductIdRef = useRef<string | null>(null);
    const searchIdRef = useRef(0);
    const searchTermRef = useRef('');
    
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
                            const items = await Promise.all(sale.saleProducts.map(async (item: any, index: number) => {
                                const prod = await db.products.get(item.productId);
                                const disc = Number(item.itemDiscount !== undefined ? item.itemDiscount : (item.discount || 0));
                                const gross = item.quantity * item.unitPrice;
                                return {
                                    productId: item.productId,
                                    product: prod || { description: 'Produto não encontrado', price: item.unitPrice } as any,
                                    unitPrice: item.unitPrice,
                                    quantity: item.quantity,
                                    itemDiscount: disc,
                                    totalPrice: Math.max(0, gross - disc),
                                    order: index
                                };
                            }));
                            setSaleItems(items);
                        }
                        const loadedDiscount = Number(sale.overallDiscount !== undefined ? sale.overallDiscount : 0);
                        setDiscount(loadedDiscount);
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
        if (!isViewMode && form.values.paymentFormId) { localStorage.setItem('saleForm_paymentFormId', form.values.paymentFormId) };
    }, [form.values.paymentFormId, isViewMode]);

    useEffect(() => {
        if (!isViewMode && form.values.cashierId) { localStorage.setItem('saleForm_cashierId', form.values.cashierId) };
    }, [form.values.cashierId, isViewMode]);

    useEffect(() => {
        if (!isViewMode && form.values.checkoutId) { localStorage.setItem('saleForm_checkoutId', form.values.checkoutId) };
    }, [form.values.checkoutId, isViewMode]);

    const searchProducts = async (term: string, qty: number): Promise<boolean> => {
        if (!term || term.length < 1) {
            setProductOptions([]);
            return false;
        }

        const currentSearchId = ++searchIdRef.current;
        
        try {
            const lowerSearch = term.toLowerCase();
            
            const foundById = await db.products
                .filter(p =>
                    (Array.isArray(p.barcodes) && p.barcodes.some(b => 
                        b.toLowerCase() === lowerSearch
                    ))
                ).toArray();

            if (currentSearchId !== searchIdRef.current) { return false };

            if (foundById.length === 1) {
                const product = foundById[0];
                                
                addProductToSale(product, qty);
                return true;
            }

            function likeToRegex(pattern: string) {
                const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                return new RegExp(`^${escaped.replace(/%/g, ".*")}$`, "i");
            }
            const search = `%${lowerSearch.replace(' ', '%')}%`;
            const regex = likeToRegex(search);

            const foundByDescription = await db.products
                .filter(p => regex.test(p.description))
                .toArray();

            if (!foundByDescription || foundByDescription.length === 0) {
                notifications.show({
                    position: 'bottom-left',
                    withBorder: true,
                    closeButtonProps: { show: false },
                    color: 'yellow',
                    title: 'Produto não encontrado',
                    message: 'Nenhum produto encontrado com o código de barras ou descrição informada.',
                });
                
                return false;
            }
            
            if (currentSearchId !== searchIdRef.current) { return false };
            setProductOptions(foundByDescription);
            setQuantity(qty);
            return true;
        } catch (err) {
            if (currentSearchId !== searchIdRef.current) { return false };
            notifications.show({ color: 'red', title: 'Erro ao buscar produto', message: String(err) });
            return false;
        }
    };


    useEffect(() => {
        if (!isViewMode && productSelectRef.current) {
            productSelectRef.current.focus();
            productSelectRef.current.select();
        }
    }, [isViewMode]);

    const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const target = e.target as HTMLInputElement;
            const value = target.value || '';
            
            if (!value.trim() && saleItems.length > 0) {
                discountRef.current?.focus();
                setTimeout(() => discountRef.current?.select(), 100);
                return;
            }

            if (!value.trim() && saleItems.length === 0) {
                return;
            }
            
            const trimmed = value.trim().replace(',', '.');
            
            let parsedQty = 1;
            let parsedSearch = trimmed;

            if (trimmed.includes('*')) {
                const parts = trimmed.split('*');
                const qtyPart = Number(parts[0]);
                const codePart = parts[1];
                parsedQty = qtyPart;
                parsedSearch = codePart;
            }

            const isEan13 = parsedSearch.length === 13 && /^\d+$/.test(parsedSearch);
            
            if (isEan13)
            {
                const startsWith2 = parsedSearch.startsWith('2');
                const startsWith5 = parsedSearch.startsWith('5');

                if (startsWith2 || startsWith5) {
                    parsedQty = 
                        startsWith5 
                            ? Number(parsedSearch.substring(7, 12)) / 1000 * parsedQty
                            : Number(parsedSearch.substring(7, 12)) * parsedQty;

                    parsedSearch = parsedSearch.substring(1, 6).replace(/^0+/, ''); 
                }
            }            
            
            searchTermRef.current = parsedSearch;
            
            await searchProducts(parsedSearch, parsedQty);
            productSelectRef.current?.focus();
        }
    };

    const handleDiscountKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            paidValueRef.current?.focus();
        }
    };

    const grossItemsTotal = saleItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalItemDiscounts = saleItems.reduce((sum, item) => sum + (item.itemDiscount || 0), 0);
    const totalSale = Math.max(0, grossItemsTotal - discount);
    const change = amountPaid - totalSale;

    const onBlurDiscount = () => {
        if (discount < totalItemDiscounts) {
            notifications.show({
                color: 'yellow',
                title: 'Atenção',
                message: `O valor do desconto não pode ser menor do que a soma dos descontos dos produtos (${formatCurrency(totalItemDiscounts)})!`
            });
            setDiscount(totalItemDiscounts);
        } else if (discount > grossItemsTotal) {
            notifications.show({
                color: 'red',
                title: 'Atenção',
                message: 'O valor do desconto não pode ser maior que o valor total da venda!'
            });
            setDiscount(totalItemDiscounts);
        }
    };

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
        if (productId) {
            const product = productOptions.find(p => String(p.id) === productId);
            if (!product) return;
            addProductToSale(product, quantity);
        }
    };

    const addProductToSale = (product: Product, qty: number) => {
        const item = product;
        const itemId = product?.id;

        if (!item) {
            notifications.show({ color: 'yellow', title: 'Atenção', message: 'Selecione um produto primeiro' });
            return;
        }

        if (qty <= 0) {
            notifications.show({ color: 'yellow', title: 'Atenção', message: 'Quantidade deve ser maior que zero' });
            return;
        }

        const existingItemIndex = saleItems.findIndex(item => item.productId === itemId);

        if (existingItemIndex >= 0) {
            const updatedItems = [...saleItems];
            const currentItem = updatedItems[existingItemIndex];
            const newQty = currentItem.quantity + qty;
            const currentDisc = currentItem.itemDiscount || 0;
            updatedItems[existingItemIndex] = {
                ...currentItem,
                quantity: newQty,
                totalPrice: (newQty * currentItem.unitPrice) - currentDisc
            };
            setSaleItems(updatedItems);
        } else {
            const newItem: SaleItem = {
                productId: itemId!,
                product: item,
                quantity: qty,
                unitPrice: item.price,
                itemDiscount: 0,
                totalPrice: qty * item.price,
                order: (saleItems.length + 1)
            };
            setSaleItems([...saleItems, newItem]);
        }

        searchIdRef.current++;
        setSearchTerm('');
        searchTermRef.current = '';
        setProductOptions([]);
        setSelectedProductValue(null);
        productSelectRef.current?.focus();
        setTimeout(() => productSelectRef.current?.select(), 100);
    };  

    const removeItem = (productId: string) => {
        const itemToRemove = saleItems.find(item => item.productId === productId);
        const removedDisc = itemToRemove?.itemDiscount || 0;
        const updatedItems = saleItems.filter(item => item.productId !== productId);
        const newTotalItemDiscounts = updatedItems.reduce((sum, item) => sum + (item.itemDiscount || 0), 0);

        setSaleItems(updatedItems);
        setDiscount(prev => {
            const adjusted = prev - removedDisc;
            return Math.max(adjusted, newTotalItemDiscounts);
        });
        setAmountPaid(0);
        productSelectRef.current?.focus();
        setTimeout(() => productSelectRef.current?.select(), 100);
    };

    const handleUpdateQuantity = (productId: string, newQty: number) => {
        if (editingProductIdRef.current !== productId) return;
        editingProductIdRef.current = null;
        setEditingProductId(null);

        if (newQty <= 0) {
            notifications.show({ color: 'yellow', title: 'Atenção', message: 'Quantidade deve ser maior que zero' });
            return;
        }

        let discountReduction = 0;
        const updatedItems = saleItems.map(item => {
            if (item.productId === productId) {
                const maxDisc = newQty * item.unitPrice;
                const currentDisc = item.itemDiscount || 0;
                const adjustedDiscount = Math.min(currentDisc, maxDisc);
                discountReduction = currentDisc - adjustedDiscount;
                return {
                    ...item,
                    quantity: newQty,
                    itemDiscount: adjustedDiscount,
                    totalPrice: (newQty * item.unitPrice) - adjustedDiscount
                };
            }
            return item;
        });

        const newTotalItemDiscounts = updatedItems.reduce((sum, item) => sum + (item.itemDiscount || 0), 0);
        setSaleItems(updatedItems);
        setAmountPaid(0);
        setDiscount(prev => Math.max(prev - discountReduction, newTotalItemDiscounts));
        productSelectRef.current?.focus();
    };

    const handleUpdateItemDiscount = (productId: string, newDiscount: number) => {
        if (editingDiscountProductIdRef.current !== productId) return;
        editingDiscountProductIdRef.current = null;
        setEditingDiscountProductId(null);

        const targetItem = saleItems.find(item => item.productId === productId);
        if (!targetItem) {
            return;
        }

        const maxDiscount = targetItem.quantity * targetItem.unitPrice;

        if (newDiscount < 0) {
            notifications.show({ color: 'yellow', title: 'Atenção', message: 'O desconto não pode ser negativo' });
            return;
        }

        if (newDiscount > maxDiscount) {
            notifications.show({
                color: 'yellow',
                title: 'Atenção',
                message: `O desconto não pode ser maior que o subtotal do item (${formatCurrency(maxDiscount)})`
            });
            return;
        }

        const prevItemDiscount = targetItem.itemDiscount || 0;
        const diff = newDiscount - prevItemDiscount;

        const updatedItems = saleItems.map(item => {
            if (item.productId === productId) {
                return {
                    ...item,
                    itemDiscount: newDiscount,
                    totalPrice: (item.quantity * item.unitPrice) - newDiscount
                };
            }
            return item;
        });

        const newTotalItemDiscounts = updatedItems.reduce((sum, item) => sum + (item.itemDiscount || 0), 0);

        setSaleItems(updatedItems);
        setAmountPaid(0);
        setDiscount(prev => Math.max(prev + diff, newTotalItemDiscounts));
        productSelectRef.current?.focus();
    };

    const submitSale = async () => {
        const validation = form.validate();
        if (validation.hasErrors) { return };

        if (saleItems.length === 0) {
            notifications.show({ color: 'yellow', title: 'Atenção', message: 'Adicione pelo menos um produto' });
            return;
        }
       
        if (discount < totalItemDiscounts) {
            notifications.show({
                color: 'yellow',
                title: 'Atenção',
                message: `O valor do desconto não pode ser menor do que a soma dos descontos dos produtos (${formatCurrency(totalItemDiscounts)})!`
            });
            setDiscount(totalItemDiscounts);
            return;
        }

        if (discount > grossItemsTotal) {
            notifications.show({ color: 'red', title: 'Atenção', message: 'O valor do desconto não pode ser maior que o valor total da venda!' });
            setDiscount(totalItemDiscounts);
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
                discount: item.itemDiscount || 0,
                itemDiscount: item.itemDiscount || 0,
            })),
            overallDiscount: discount,
            totalValue: totalSale,
            paidValue: totalSale,
            changeValue: 0
        };

        const saleId = crypto.randomUUID();
        const now = new Date().toISOString();
        const localSale: Sale = {
            ...saleData,
            id: saleId,
            saleDate: now,
            syncStatus: 'pending-create',
            createdAt: now,
        };
        resetForm();
        try {
            await db.sales.put(localSale);
            notifications.show({ color: 'green', title: 'Sucesso', message: 'Venda registrada!' });
            setTimeout(() => {
                showPrintConfirmation();
            }, 500);            
        } catch (err) {
            notifications.show({ color: 'red', title: 'Erro', message: 'Falha ao salvar venda.' });
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && saleItems.length > 0) {
            openConfirmModal({
                title: 'Cancelar venda',
                message: 'Deseja cancelar essa venda?',
                confirmLabel: 'Sim',
                cancelLabel: 'Não',
                confirmColor: 'blue',
                onConfirm: () => resetForm(),
                onCancel: () => productSelectRef.current?.focus()
            });
        }
    };
   
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const showPrintConfirmation = () => {
        openConfirmModal({
            title: 'Venda Finalizada',
            message: 'Deseja imprimir o comprovante?',
            confirmLabel: 'Sim, Imprimir',
            cancelLabel: 'Não',
            confirmColor: 'blue',
            onConfirm: handlePrint,
            onCancel: () => productSelectRef.current?.focus()
        });
    };

    const resetForm = () => {
        searchIdRef.current++;
        editingProductIdRef.current = null;
        editingDiscountProductIdRef.current = null;
        setSaleItems([]);
        setAmountPaid(0);
        setSearchTerm('');
        searchTermRef.current = '';
        setProductOptions([]);
        setDiscount(0);
        setEditingProductId(null);
        setEditingDiscountProductId(null);
        if (isViewMode) {
            navigate('/sales');
        }
        productSelectRef.current?.focus();
    };

    const handlePrint = async () => {
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
            if (item.itemDiscount > 0) {
                result.text(`  (Desc. item: -${formatCurrency(item.itemDiscount)})`).newline();
            }
        });

        const finalEncoded = result.rule()
            .align('right')
            .text(`DESCONTO: ${formatCurrency(discount)}`)
            .newline()
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
        } else {
            throw new Error('Falha ao enviar para impressora via API');
        }
        productSelectRef.current?.focus();
    };

    return (
        <MainLayout>
            <Box style={{ display: 'flex', flexDirection: 'column', height: '93vh' }}>
                <Group justify="space-between" mb="md" align="flex-start">
                    <Title order={3} style={{ paddingLeft: '2.5rem' }}>{isViewMode ? 'Visualizar Venda' : 'Registrar Venda'}</Title>

                    <Group gap="xs" style={{ flex: 1, maxWidth: '600px', paddingTop: '0.2rem' }}>
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

                <Grid style={{ flex: 1, minHeight: 0, height: '100%' }} styles={{ inner: { height: '100%' } }} gutter="xs">
                    <Grid.Col span={showReceipt ? { base: 5 } : 8} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Stack gap="md" style={{ marginRight: '1rem', height: '100%' }}>

                            {!isViewMode && (
                                <Group align="flex-end" style={{ flexShrink: 0 }}>
                                    <Select
                                        label="Produto"
                                        placeholder="Digite o código (ex: 3*123 ou 123) ou descrição..."
                                        searchable
                                        searchValue={searchTerm}
                                        value={selectedProductValue}
                                        onSearchChange={(val) => {
                                            setSearchTerm(val);
                                            searchTermRef.current = val;
                                        }}
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
                                            <Table.Th w={90}>Unit.</Table.Th>
                                            <Table.Th w={100}>Desc. Item</Table.Th>
                                            <Table.Th w={100}>Total</Table.Th>
                                            {!isViewMode && <Table.Th w={50}/>}
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {saleItems.sort((a, b) => a.order - b.order).reverse().map((item) => (
                                            <Table.Tr key={item.productId}>
                                                <Table.Td>{item.product?.description}</Table.Td>
                                                <Table.Td 
                                                    onDoubleClick={() => {
                                                        if (!isViewMode) {
                                                            editingProductIdRef.current = item.productId;
                                                            setEditingProductId(item.productId);
                                                            setEditingValue(item.quantity);
                                                        }
                                                    }}
                                                    style={{ cursor: !isViewMode ? 'pointer' : 'default' }}
                                                >
                                                    {!isViewMode && editingProductId === item.productId ? (
                                                        <NumberInput
                                                            value={editingValue}
                                                            onChange={(val) => setEditingValue(Number(val) || 0)}
                                                            min={1}
                                                            size="xs"
                                                            w={70}
                                                            autoFocus
                                                            hideControls
                                                            onFocus={(e) => e.target.select()}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleUpdateQuantity(item.productId, editingValue);
                                                                } else if (e.key === 'Escape') {
                                                                    editingProductIdRef.current = null;
                                                                    setEditingProductId(null);
                                                                    productSelectRef.current?.focus();
                                                                }
                                                            }}
                                                            onBlur={() => handleUpdateQuantity(item.productId, editingValue)}
                                                            styles={{ input: { padding: '4px', textAlign: 'center' } }}
                                                        />
                                                    ) : (
                                                        item.quantity
                                                    )}
                                                </Table.Td>
                                                <Table.Td>{formatCurrency(item.unitPrice)}</Table.Td>
                                                <Table.Td
                                                    onDoubleClick={() => {
                                                        if (!isViewMode) {
                                                            editingDiscountProductIdRef.current = item.productId;
                                                            setEditingDiscountProductId(item.productId);
                                                            setEditingDiscountValue(item.itemDiscount || 0);
                                                        }
                                                    }}
                                                    style={{ cursor: !isViewMode ? 'pointer' : 'default' }}
                                                >
                                                    {!isViewMode && editingDiscountProductId === item.productId ? (
                                                        <NumberInput
                                                            value={editingDiscountValue}
                                                            onChange={(val) => setEditingDiscountValue(Number(val) || 0)}
                                                            min={0}
                                                            max={item.quantity * item.unitPrice}
                                                            decimalScale={2}
                                                            fixedDecimalScale
                                                            prefix="R$ "
                                                            size="xs"
                                                            w={90}
                                                            autoFocus
                                                            hideControls
                                                            onFocus={(e) => e.target.select()}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleUpdateItemDiscount(item.productId, editingDiscountValue);
                                                                } else if (e.key === 'Escape') {
                                                                    editingDiscountProductIdRef.current = null;
                                                                    setEditingDiscountProductId(null);
                                                                    productSelectRef.current?.focus();
                                                                }
                                                            }}
                                                            onBlur={() => handleUpdateItemDiscount(item.productId, editingDiscountValue)}
                                                            styles={{ input: { padding: '4px', textAlign: 'center' } }}
                                                        />
                                                    ) : (
                                                        <span style={{ color: (item.itemDiscount || 0) > 0 ? 'var(--mantine-color-orange-filled, #f59e0b)' : undefined, fontWeight: (item.itemDiscount || 0) > 0 ? 600 : 'normal' }}>
                                                            {formatCurrency(item.itemDiscount || 0)}
                                                        </span>
                                                    )}
                                                </Table.Td>
                                                <Table.Td>{formatCurrency(item.totalPrice)}</Table.Td>
                                                {!isViewMode && <Table.Td><XCircle size={18} color="red" onClick={() => removeItem(item.productId)} style={{ cursor: 'pointer' }} /></Table.Td>}
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </ScrollArea>
                        </Stack>
                    </Grid.Col>
                    <Grid.Col span={4} style={{ height: '100%'}}>
                        <Stack gap="md" style={{ display: 'flex', flexDirection: 'column', justifyContent:'space-between', height: '100%' }}>
                            {!isViewMode && (
                                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 1 }}>
                                    <NumberInput
                                        label="Desconto"
                                        description={totalItemDiscounts > 0 ? `Mínimo: ${formatCurrency(totalItemDiscounts)} (soma dos produtos)` : undefined}
                                        value={discount}
                                        onFocus={(e) => setTimeout(() => e.target.select(), 100)}
                                        onClick={(e) => setTimeout(() => (e.target as HTMLInputElement).select(), 100)}
                                        onChange={(val) => {
                                            const newDiscount = Number(val) || 0;
                                            setDiscount(newDiscount);
                                        }}
                                        onBlur={onBlurDiscount}
                                        min={totalItemDiscounts}
                                        decimalScale={2}
                                        fixedDecimalScale
                                        prefix="R$ "
                                        size="md"
                                        ref={discountRef}
                                        onKeyDown={handleDiscountKeyDown}
                                    />
                                    <NumberInput
                                        label="Valor Pago"
                                        value={amountPaid}
                                        onFocus={(e) => setTimeout(() => e.target.select(), 100)}
                                        onClick={(e) => setTimeout(() => (e.target as HTMLInputElement).select(), 100)}
                                        onChange={(val) => setAmountPaid(Number(val) || 0)}
                                        min={0}
                                        decimalScale={2}
                                        fixedDecimalScale
                                        prefix="R$ "
                                        size="md"
                                        ref={paidValueRef}
                                        onKeyDown={handlePaidValueKeyDown}
                                    />
                                    <NumberInput
                                        label="Troco"
                                        value={amountPaid > 0 ? change : 0}
                                        min={0}
                                        decimalScale={2}
                                        fixedDecimalScale
                                        prefix="R$ "
                                        size="md"
                                        readOnly
                                        styles={{
                                            input: {
                                                cursor: 'default',
                                                backgroundColor: 'var(--mantine-color-body)',
                                            }
                                        }}
                                    />
                                </div>
                            )}
                            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '10px' }}>
                                <Text size="md" c="var(--mantine-color-red-filled)" fw={500} style={{ fontSize: '1.8rem', alignSelf: 'baseline', paddingTop: '1rem' }}>Total</Text>
                                <Paper
                                    withBorder
                                    style={{
                                        background: 'var(--mantine-color-red-light)',
                                        borderColor: 'var(--mantine-color-red-outline)',
                                        padding: '0 1rem',
                                        marginTop: '-1rem'
                                    }}
                                >
                                    <Text size="md" fw={700} style={{ fontSize: '3.5rem', width: '100%', textAlign: 'right' }} c="var(--mantine-color-red-filled)">{formatCurrency(totalSale)}</Text>
                                </Paper>
                                {!isViewMode && (
                                    <Button
                                        size="lg"
                                        onClick={submitSale}
                                        disabled={saleItems.length === 0}
                                        ref={saveSaleRef}
                                    >
                                        Finalizar
                                    </Button>
                                )}
                            </div>
                        </Stack>
                    </Grid.Col>

                    {showReceipt && (
                        <Grid.Col span={{ base: 3 }}>
                            <Paper shadow="sm" p="md" withBorder style={{ backgroundColor: '#fffbe6', fontFamily: 'monospace', overflowY: 'auto' }}>
                                <Stack gap="xs">
                                    <Text ta="center" fw={700}>*** CUPOM ***</Text>
                                    <Divider my="sm" style={{ borderTopStyle: 'dashed' }} />
                                    {saleItems.map((item, index) => (
                                        <Box key={index}>
                                            <Text size="xs">{item.product.description}</Text>
                                            <Group justify="space-between">
                                                <Text size="xs">{item.quantity} {item.product.unit} x {formatCurrency(item.unitPrice)}</Text>
                                                <Text size="xs">{formatCurrency(item.totalPrice)}</Text>
                                            </Group>
                                            {item.itemDiscount > 0 && (
                                                <Text size="xs" c="orange.7" fs="italic">Desc. item: -{formatCurrency(item.itemDiscount)}</Text>
                                            )}
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
