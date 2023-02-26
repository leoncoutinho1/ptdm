<template>
  <div class="home">
    <h1>Listagem de Vendas</h1>
    <DataTable :value="this.sales" :scrollable="true" scrollHeight="75vh" class="p-datatable-sm" :paginator="true" :rows="10" responsiveLayout="scroll">
        <Column field="createdAt" header="Data" key="date">
            <template #body="datetime">
                {{new Date(datetime.data.createdAt).toLocaleDateString("pt-BR")}}
            </template>
        </Column>
        <Column field="createdAt" header="Hora" key="time">
            <template #body="datetime">
                {{new Date(datetime.data.createdAt).toLocaleTimeString("pt-BR")}}
            </template>
        </Column>
        <Column field="checkout.name" header="Caixa" key="checkout"></Column>    
        <Column field= "cashier.name" header="Vendedor" key="cashier"></Column>
        <Column field= "paymentForm.description" header="Forma de Pagamento" key="paymentForm"></Column>
        <Column field= "totalValue" header="Valor" key="totalValue">
            <template #body="total">
                {{formatCurrency(total.data.totalValue)}}
            </template>
        </Column>
        <Column :exportable="false" style="min-width:8rem">
            <template #body="slotProps">
                <Button icon="pi pi-print" class="p-button-rounded p-button-success mr-2" @click="printSale(slotProps.data)" />
                <Button icon="pi pi-trash" class="p-button-rounded p-button-warning" @click="confirmDeleteSale(slotProps.data)" />
            </template>
        </Column>
    </DataTable>
    <Message :severity=this.severity v-show="this.showStatus">{{ this.statusMessage }}</Message>
    <Dialog v-model:visible="showPrintSale" :style="{width: '450px'}" :modal="true" class="p-fluid">
        <Invoice :sale=this.selectedSale></Invoice>
    </Dialog>
  </div>
</template>

<script>
    import DataTable from 'primevue/datatable';
    import Column from 'primevue/column';
    import Button from 'primevue/button';
    import Dialog from 'primevue/dialog';
    import Invoice from '../components/Invoice.vue';
    import Message from 'primevue/message';

    export default {
        name: 'HomeView',
        data() {
            return {
                sales: [],
                selectedSale: {},
                showPrintSale: false,
                severity: "",
                statusMessage: "",
                showStatus: false            
            }
        },        
        created() {
            this.listSale();
        },
        methods: {
            async listSale() {
                const response = await fetch(`${import.meta.env.VITE_TDM_API}/Sale/ListSale?Limit=100&Sort=-createdAt`);
                var responseJson = await response.json();
                this.sales = responseJson.data;
            },
            printSale(sale) {
                this.selectedSale = sale;
                this.showPrintSale = true;
            },
            formatCurrency(value) {
                return parseFloat(value).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
            },
            async confirmDeleteSale(sale) {
                const response = await fetch(`${import.meta.env.VITE_TDM_API}/Sale/${sale.id}`, { method: 'DELETE' });
                if (response.ok) {
                    console.log('sale successfuly deleted');
                    this.severity = 'info';
                    this.statusMessage = 'Venda excluída com sucesso';
                    this.showStatus = true;
                    setTimeout(() => this.showStatus = false, 5000);  
                } else {
                    console.log('sale not found');
                }
                this.listSale();   
            }
        },
        components: {
            DataTable,
            Column, 
            Button,
            Dialog,
            Invoice,
            Message  
        }
    }
</script>

<style scoped>
    
</style>