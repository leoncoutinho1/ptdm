<template>
    <div class="card">
        <div id="invoice" style="display:flex; flex-direction: column; justify-content: center;">
            <p style="width: 100%; text-align:center">Padaria Trem de Minas</p>
            <p style="width: 100%; text-align:center">Rua Teixeira de Melo, 64 - Parque Caju</p>
            <p style="width: 100%; text-align:center; padding-bottom: 2em;">Campos dos Goytacazes - RJ</p>
            <div class="invoice_headers">
                <p>Descrição</p>
                <p>Vl Unit</p>
                <p>Qtde</p>
                <p>Vl Total</p>
            </div>        
               
            <span v-for="prd in sale.saleProducts" :key=prd.id style="width: 100%;">
                <p>{{prd.product.description}}</p>
                <span style="display:flex; flex-direction: row; justify-content: right;">
                    <p style="text-align: right; width: 25%" >{{formatCurrency(prd.product.price)}}</p>
                    <p style="text-align: right; width: 25%" >{{prd.quantity}}</p>
                    <p style="text-align: right; width: 25%" >{{formatCurrency(prd.product.price * prd.quantity)}}</p>
                </span>
            </span>
            <p style="width: 100%; text-align:right; padding-top: 2.5em;">Total: {{formatCurrency(sale.totalValue)}}</p>
            <p style="width: 100%; text-align:right; padding-top: 2.5em;">Pago: {{formatCurrency(sale.paidValue)}}</p>
            <p style="width: 100%; text-align:right; padding-top: 2.5em;">Troco: {{formatCurrency(sale.changeValue)}}</p>
            <p style="width: 100%; text-align:center; padding-top: 2.5em; padding-bottom:2.5em;">Obrigado pela preferência</p>
        </div>
        <Button icon="pi pi-print" class="p-button-rounded p-button-success mr-2" @click="print()" />
    </div>
        
</template>

<script>
import Button from 'primevue/button';

export default {
    name: 'Invoice',
    data() {
        return {
        }
    },
    props: ['sale'],
    methods: {
        formatCurrency(value) {
            return value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        },
        print() {
            var prtContent = document.getElementById("invoice");
            var WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
            WinPrint.document.write(prtContent.innerHTML);
            WinPrint.document.close();
            WinPrint.focus();
            WinPrint.print();
            WinPrint.close();
        }
    },
    watch: {
        sale() {
            return this.sale;
        }
    },
    components: {
        Button
    }
}
</script>

<style>
    .invoice_headers {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        border-bottom: .1rem solid rgba(128, 128, 128, 0.5);
    }
</style>