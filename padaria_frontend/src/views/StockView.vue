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
            const response = await fetch(`${import.meta.env.VITE_TDM_API}/Product/ListProduct?limit=1000&sort=description`);
            var responseJson = await response.json();
            this.products = responseJson.data;
            this.product = {};
            this.productDialog = false;
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
            const response = await fetch(`${import.meta.env.VITE_TDM_API}/Product/${product.id}`, { method: 'DELETE' });
            if (response.ok) {
                console.log('product successfuly deleted');
                this.statusMessage = 'Produto excluído';
                this.showStatus = true;
                this.severity = 'success';
                setTimeout(() => this.showStatus = false, 5000);
            } else {
                console.log('product not found');
                this.statusMessage = 'Produto não encontrado';
                this.showStatus = true;
                this.severity = 'error';
                setTimeout(() => this.showStatus = false, 5000);
            }
            this.listProducts();          
        },
        async saveProduct() {
            let method;
            let url;
            if (this.product.id != undefined) {
                method = 'PUT';
                url = `${import.meta.env.VITE_TDM_API}/Product/${this.product.id}`
            } else {
                method = 'POST';
                url = `${import.meta.env.VITE_TDM_API}/Product`
            }
            const response = await fetch(url, { 
                method: method,
                body: JSON.stringify(this.product),
                headers: {
                    'Content-Type': 'application/json'
                } 
            });
            if (response.ok) {
                console.log('product successfuly created');
                this.statusMessage = method == 'POST' ? 'Produto cadastrado' : 'Produto atualizado';
                this.showStatus = true;
                this.severity = 'success';
                setTimeout(() => this.showStatus = false, 5000);
            } else {
                const err = await response.json();
                console.log('product not created');
                this.statusMessage = err.message;
                this.showStatus = true;
                this.severity = 'error';
                setTimeout(() => this.showStatus = false, 5000);
            }
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