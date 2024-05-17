<template>
    <h1>Controle de Estoque</h1>
    <Dialog v-model:visible="productDialog" :style="{width: '450px'}" :modal="true" class="p-fluid">
        <ProductForm :stockProduct="this.product" />
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog"/>
            <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveProduct" />
        </template>
    </Dialog>
    <ProductTable :products="this.products" @new-product="newProduct" @edit-product="editProduct" @deleteProduct="deleteProduct" @openModal="openModal"></ProductTable>
    <Dialog :breakpoints="{'960px': '75vw', '640px': '90vw'}" :style="{width: '25vw'}" v-model:visible="this.displayModal" :showHeader="false" :modal="true">
        <BarcodeReaderVue @closeModal="closeModal" @edit-product="editProduct" />
    </Dialog>
    <Message :severity=this.severity v-show="this.showStatus">{{ this.statusMessage }}</Message>
</template>

<script>

import BarcodeReaderVue from '../components/BarcodeReader.vue';
import ProductForm from '../components/ProductForm.vue';
import ProductTable from '../components/ProductTable.vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import HTTP from '../helpers/http-common';

export default {
    name: 'StockView',
    data() {
        return {
            productDialog: false,
            products: [],
            product: {},
            filters: null,
            severity: "",
            showStatus: false,
            statusMessage: "",
            reloadTable: false,
            displayModal: false
        }
    },
    created() {
        this.listProducts();
    },
    methods: {
        async listProducts() {
            await HTTP.get(`/Product/ListProduct?limit=1000&sort=description`)
                .then(response => {
                    var res = response.data
                    this.products = res.count > 0 ? res.data : [];
                    this.product = {};
                    this.productDialog = false;
                })
                .catch(e => {
                    this.messages = [
				        {severity: 'error', content: 'Erro ao buscar a lista de produtos'}
                    ];
                });
        },
        hideDialog() {
            this.product = {
                barcodes: []
            },
            this.productDialog = false
        },
        newProduct() {
            this.product = {
                barcodes: []
            };
            this.productDialog = true;
        },
        editProduct(product) {
            this.displayModal = false;
            this.product = product;
            this.productDialog = true;
        },
        async deleteProduct(product) {
            await HTTP.delete(`/Product/${product.id}`)
                .then(response => {
                    console.log('product successfuly deleted');
                    this.statusMessage = 'Produto excluído';
                    this.showStatus = true;
                    this.severity = 'success';
                    setTimeout(() => this.showStatus = false, 5000);
                })
                .catch(e => {
                    console.log('product not found');
                    this.statusMessage = 'Produto não encontrado';
                    this.showStatus = true;
                    this.severity = 'error';
                    setTimeout(() => this.showStatus = false, 5000);
                });
            
            this.listProducts();          
        },
        async saveProduct() {
            let method;
            let url;
            if (this.product.id != undefined) {
                method = 'PUT';
                url = `/Product/${this.product.id}`
            } else {
                method = 'POST';
                url = '/Product'
            }

            await HTTP.request(url, { 
                method: method,
                data: this.product
            })
            .then(response => {
                console.log('product successfuly created');
                this.statusMessage = method == 'POST' ? 'Produto cadastrado' : 'Produto atualizado';
                this.showStatus = true;
                this.severity = 'success';
                setTimeout(() => this.showStatus = false, 5000);
            })
            .catch(e => {
                console.log('product not created');
                this.statusMessage = err.message;
                this.showStatus = true;
                this.severity = 'error';
                setTimeout(() => this.showStatus = false, 5000);
            });
            
            this.listProducts();
        },
        openModal() {
            this.displayModal = true;
        },
        closeModal() {
            this.displayModal = false;
        }
    },
    components: {
        BarcodeReaderVue,
        ProductForm,
        ProductTable,
        Button,
        Dialog,
        Message
    }
}
</script>

<style>
  
</style>