<template>
    <div class="card">
        <div class="p-fluid grid">
            <div class="col-4">
                <span class="p-float-label">
                    <Dropdown id="cashier" v-model="selectedCashier" :options="cashiers" optionLabel="name" placeholder="Vendedor" class="dropdown"/>
                    <label for="cashier">Vendedor</label>
                </span>
            </div>
            <div class="col-4">
                <span class="p-float-label">
                    <Dropdown v-model="selectedCheckout" id="checkout" :options="checkouts" optionLabel="name" placeholder="Caixa" class="dropdown"/>
                    <label for="checkout">Caixa</label>
                </span>
            </div>
            <div class="col-4">
                <span class="p-float-label">
                    <Dropdown id="paymentForm" v-model="selectedPaymentForm" :options="paymentForms" optionLabel="description" placeholder="Forma de pagamento"/>
                    <label for="paymentForm">Forma de pagamento</label>
                </span>
            </div>
        </div>
    </div>
    <div class="card">
        <div class="p-fluid grid">
            <div class="col-3">
                <span class="p-float-label">
                    <InputNumber inputId="quantity" id="quantity" v-model="this.quantity" mode="decimal" :maxFractionDigits="3" @keypress.enter.prevent="tabTo('description')" inputStyle="font-weight: 500;"/>
                    <label for="quantity">Quantidade</label>
                </span>
            </div>
            <div class="col-9">
                <span class="p-float-label">
                    <InputText id="description" type="text" v-model="this.description" @keypress.enter.prevent="searchProduct" class="inputText" inputStyle="font-weight: 500;"/>
                    <label for="description">Descrição</label>
                </span>
            </div>
            
        </div>
    </div>
    <div class="card">
        <DataTable :value="this.saleProducts" class="p-datatable-sm" :scrollable="true" scrollHeight="400px" responsiveLayout="scroll">
            <Column field="quantity" header="Quantidade" key="quantity" style="max-width: 7em"></Column>
            <Column field="description" header="Descrição" key="description"></Column>    
            <Column field= "unitPrice" header="Valor unitário" key="unitPrice" style="max-width: 8em">
                <template #body="unitPrices">
                    {{formatCurrency(unitPrices.data.unitPrice)}}
                </template>
            </Column>
            <Column field= "totalPrice" header="Valor total" key="totalPrice" style="max-width: 8em">
                <template #body="totalPrices">
                    {{formatCurrency(totalPrices.data.totalPrice)}}
                </template>
            </Column>
            <Column header="Desconto" key="discount" class="p-fluid" style="max-width: 7em">
                <template #body="products">
                    <InputNumber inputId="discount" id="discount" v-model="products.data.discount" mode="currency" currency="BRL" @keypress.enter.prevent="applyDiscount(products.data.productId)" />
                </template>
            </Column>
            <Column key="removeButton" class="p-fluid" id="removeProductColumn" style="max-width: 3.5em">
                <template #body="products">
                    <Button icon="pi pi-times" class="p-button-rounded p-button-danger p-button-text" @click="removeProduct(products.data.productId)" />
                </template>
            </Column>
        </DataTable>
    </div>
    <div class="card" id="bottom">
        <div class="p-fluid grid">
            <div class="col-6 p-fluid grid">
                <div class="col-6">
                    <span class="p-float-label">
                        <InputNumber inputId="paidValue" id="paidValue" 
                            v-model="this.paidValue" 
                            mode="currency" 
                            currency="BRL" 
                            class="p-inputtext-lg" 
                            inputStyle="font-weight: 500; font-size: 1.4em; color: black; background-color: white; text-align: right;" 
                            @keypress.enter.prevent="calculateChangeValue()"/>
                        <label for="paidValue">Valor pago</label>
                    </span>
                </div>
                <div class="col-6">
                    <span class="p-float-label">
                        <InputNumber inputId="changeValue" id="changeValue" v-model="this.changeValue" mode="currency" currency="BRL" class="p-inputtext-lg" inputStyle="font-weight: 500; font-size: 1.4em; color: blue; background-color: white; text-align: right;" disabled/>
                        <label for="changeValue">Troco</label>
                    </span>
                </div>
                <div class="col-4 col-offset-8">
                    <Button @click="saveSale" id="btnSave">Gravar</Button>
                </div>
            </div>
            <div class="col-6">
                <span class="p-float-label">
                    <InputNumber inputId="totalValue" id="totalValue" v-model="this.totalValue" mode="currency" currency="BRL" class="p-inputtext-lg" inputStyle="font-weight: 500; font-size: 1.4em; color: red; background-color: white; text-align: right;" disabled/>
                    <label for="totalValue">Total</label>
                </span>
            </div>
        </div>
    </div>
    <Dialog v-model:visible="displayModal" header="Produtos" :breakpoints="{'960px': '75vw', '640px': '90vw'}" :style="{width: '50vw'}" :modal="true">
        <DataTable :value="this.productsToModal" v-model:selection="selectedProduct" selectionMode="single" dataKey="id" responsiveLayout="scroll" @rowSelect="onRowSelect">
            <Column field="description" header="Descrição" key="description"></Column>    
            <Column field= "price" header="Valor unitário" key="price">
                <template #body="prices">
                    {{formatCurrency(prices.data.price)}}
                </template>
            </Column>
        </DataTable>
    </Dialog>
    <Dialog position="top" v-model:visible="displayError" :showHeader="false">
        <p style="padding: 3em;">
            {{ this.message }}
        </p>
        
    </Dialog>
</template>
<script>
    import Dropdown from 'primevue/dropdown';
    import DataTable from 'primevue/datatable';
    import Column from 'primevue/column';
    import InputText from 'primevue/inputtext';
    import InputNumber from 'primevue/inputnumber';
    import Button from 'primevue/button';
    import Dialog from 'primevue/dialog';
    import HTTP from '../helpers/http-common';

    export default {
        name: 'CheckoutView',
        data() {
            return {
                selectedCashier: null,
                cashiers: [],
                selectedCheckout: null,
                checkouts: [],
                selectedPaymentForm: null,
                paymentForms: [],
                quantity: 0,
                description: "",
                discount: "",
                columns: [
                    {field: 'quantity', header: 'Quantidade'},    
                    {field: 'description', header: 'Descrição'},    
                    {field: 'unitPrice', header: 'Valor unitário'},
                    {field: 'totalPrice', header: 'Valor total'},
                ],
                product: null,
                displayModal: false,
                productsToModal: [],
                selectedProduct: null,
                saleProducts: [],
                totalValue: 0,
                paidValue: 0,
                changeValue: 0,
                displayError: false,
                message: ""
            }
        },        
        created() {
            this.listCashier();
            this.listCheckouts();
            this.listPaymentForms();
        },
        mounted() {
            this.tabTo('quantity');
        },
        methods: {
            async listCashier() {
                const response = await HTTP.get('/Cashier/ListCashier');
                var res = response.data;
                this.cashiers = res.count > 0 ? res.data : [];
                this.selectedCashier = this.cashiers[0];
            },
            async listCheckouts() {
                const response = await HTTP.get('/Checkout/ListCheckout');
                var res = response.data;
                this.checkouts = res.count > 0 ? res.data : [];
                this.selectedCheckout = this.checkouts[0];
            },
            async listPaymentForms() {
                const response = await HTTP.get('/PaymentForm/ListPaymentForm');
                var res = response.data;
                this.paymentForms = res.count > 0 ? res.data : [];
                this.selectedPaymentForm = this.paymentForms[0];
            },
            async searchProduct() {
                if (this.description != null && this.description != "") {
                    this.product = null;
                    await HTTP.get(`/Product/GetProductByBarcode?barcode=${this.description}`)
                        .then(response => {
                            this.product = response.data;
                            this.addProduct();
                            return;
                        }).catch(err => {
                            console.log(err);
                        });

                    if (this.product === null) {
                        this.description = this.description.replace(/[\d.]/g, "");
                        if (this.description != null && this.description != "") {
                            await HTTP.get(`/Product/ListProduct?Description=${this.description}`)
                                .then(response => {
                                    console.log(response)
                                    if (response.data.count === 1) {
                                        this.product = response.data.data[0];
                                        this.addProduct();
                                        return;
                                    } else if (response.data.count > 1) {
                                        this.productsToModal = response.data.data;
                                        this.displayModal = true;
                                        return;
                                    } else {
                                        this.product = null;
                                        this.description = "";
                                        this.quantity = 0;
                                        this.discount = "";
                                        this.tabTo('quantity');
                                    }
                                })
                                .catch(err => {
                                    console.log(err);
                                });
                        }
                    }
                } else {
                    if (this.quantity === 0) {
                        this.tabTo('paidValue');
                    }
                }
            },
            addProduct() {
                if (this.product != null && this.quantity > 0) {
                    var index = this.saleProducts.findIndex(x => x.productId == this.product.id);
                    if (index != -1) {
                        this.saleProducts[index].quantity = parseFloat(this.saleProducts[index].quantity) + parseFloat(this.quantity);
                        this.saleProducts[index].totalPrice = this.saleProducts[index].quantity * this.saleProducts[index].unitPrice;
                    } else {
                        this.saleProducts.push({
                            productId: this.product.id,
                            description: this.product.description,
                            quantity: this.quantity,
                            unitPrice: this.product.price,
                            totalPrice: this.product.price * this.quantity
                        });
                    }
                                        
                    this.product = null;
                    this.description = "";
                    this.quantity = 0;
                    this.discount = "";
                    
                    this.calculateTotalValue();
                }
            },
            calculateTotalValue() {
                this.totalValue = this.saleProducts.reduce((acc, curr) => parseFloat(acc) + parseFloat(curr.totalPrice), 0);
                this.paidValue = 0;
                this.changeValue = 0;
                this.tabTo('quantity');
            },
            calculateChangeValue() {
                if (this.paidValue === 0) {
                    setTimeout(() => {
                        this.paidValue = this.totalValue;
                    }, 250);
                } else {
                    this.changeValue = this.paidValue - this.totalValue
                }
                this.tabTo('btnSave');
            },
            removeProduct(id) {
                this.saleProducts = this.saleProducts.filter(x => x.productId !== id);
                this.calculateTotalValue();
            },
            formatCurrency(value) {
                return parseFloat(value).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
            },
            tabTo(id) {
                if (id === 'btnSave')
                    document.querySelectorAll(`button#btnSave`)[0].focus();
                else {
                    var el = document.querySelectorAll(`input#${id}`)[0];
                    el.focus();
                    el.select();
                }
                    
            },
            applyDiscount(productId) {
                var product = this.saleProducts.find(x => x.productId == productId);
                product.totalPrice -= product.discount;
                this.calculateTotalValue();
            },
            async saveSale() {
                const sale = {
                    checkoutId: this.selectedCheckout.id,
                    cashierId: this.selectedCashier.id,
                    totalValue: this.totalValue,
                    paidValue: this.paidValue,
                    changeValue: this.changeValue,
                    overallDiscount: 0,
                    paymentFormId: this.selectedPaymentForm.id,
                    saleProducts: this.saleProducts.map(x => {
                        return {
                            productId: x.productId,
                            quantity: x.quantity,
                            discount: 0
                        }
                    })
                }

                console.log(sale);

                await HTTP.request('/Sale', {
                        method: 'POST',
                        data: sale
                    })
                    .then(response => {
                        this.product = null;
                        this.description = "";
                        this.quantity = 0;
                        this.discount = "";
                        this.saleProducts = [];
                        this.totalValue = 0;
                        this.paidValue = 0;
                        this.changeValue = 0;
                    });
                
                this.tabTo('quantity');
            },
            onRowSelect() {
                this.product = this.selectedProduct;
                this.displayModal = false;
                this.addProduct();
            }
        },
        
        
        components: {
            Dropdown,
            DataTable,
            Column,
            InputText,
            InputNumber,
            Button,
            Dialog         
        }
    }
</script>
<style>
    .card {
        padding: 1em 0;
    }
    #totalValue {
        font-size: 3em;
        color: black;
        background-color: white;
    }
    #btnSave {
        justify-content: center;
    }
    #bottom {
        position: absolute;
        bottom: 0;
    }
</style>
  