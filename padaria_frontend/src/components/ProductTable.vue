<template>
    <div class="card">
        <DataTable :value="this.products" v-model:filters="filters" dataKey="id" :scrollable="true" scrollHeight="75vh" class="p-datatable-sm" responsiveLayout="scroll" 
        :paginator="true" :rows="10" filterDisplay="menu" :globalFilterFields="['description']">
            <template #header>
                <div class="flex flex-row justify-content-between">
                    <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="openNew" />
                    <Button label="Show" icon="pi pi-camera" @click="openModal" />
                    <span class="p-input-icon-left">
                        <InputText v-model="this.filters['description'].value" id="productSearch" />
                        <i class="pi pi-search" />
                    </span>
                </div>
            </template>
            <Column field="description" header="Descrição" style="min-width:12rem" sortable>
                <template #body="{data}">
                    {{data.description}}
                </template>
            </Column>
            <Column field="cost" header="Custo" style="min-width:12rem">
                <template #body="{data}">
                    {{this.formatCurrency(data.cost)}}
                </template>
            </Column>
            <Column field="price" header="Preço de Venda" style="min-width:12rem">
                <template #body="{data}">
                    {{this.formatCurrency(data.price)}}
                </template>
            </Column>
            <Column field="quantity" header="Quantidade" style="min-width:12rem">
                <template #body="{data}">
                    {{data.quantity}}
                </template>
            </Column>
            <Column :exportable="false" style="min-width:8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editProduct(slotProps.data)" />
                    <Button icon="pi pi-trash" class="p-button-rounded p-button-warning" @click="confirmDeleteProduct(slotProps.data)" />
                </template>
            </Column>
        </DataTable>
    </div>
    
</template>

<script>

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import {FilterMatchMode,FilterOperator} from 'primevue/api';


export default {
    name: 'StockView',
    data() {
        return {
            product: {},
            filters: {},            
            productFilters: null,
            productDialog: false
        }
    },
    props: ['products'],
    emits: [
        'selectedProduct',
        'newProduct',
        'openModal',
        'editProduct',
        'deleteProduct'
    ],
    created() {
        this.initFilters();
    },
    methods: {
        formatCurrency(value) {
            return value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        },
        initFilters() {
            this.filters = {
                'description': {value: null, matchMode: FilterMatchMode.CONTAINS}
            }
        },
        openNew(){
            this.$emit('newProduct');
        },
        openModal(){
            this.$emit('openModal');
        },
        editProduct(product) {
            this.$emit('editProduct', product);
            this.filters['description'].value = null;
        },
        confirmDeleteProduct(product) {
            this.$emit('deleteProduct', product);
            this.filters['description'].value = null;
        }
    },
    components: {
        DataTable,
        Column,
        InputText,
        Toolbar,
        Button,
        FileUpload        
    },
    watch: {
        products() {
            return this.products;
        }
    }
}
</script>

<style>
  
</style>