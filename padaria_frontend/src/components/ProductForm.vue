<template>
    <div class="field">
        <span class="p-float-label">
            <Chips v-model="this.product.barcodes" id="barcodes" />
            <label for="barcodes">Códigos</label>
        </span>
    </div>
    <div class="field">
        <span class="p-float-label">
            <InputText id="description" type="text" v-model="this.product.description" />
            <label for="description">Descrição</label>
        </span>
    </div>   
    <div class="field">
        <span class="p-float-label">
            <InputNumber id="cost" mode="currency" currency="BRL" locale="pt-BR" v-model="this.product.cost" @blur="changeProfitMargin($event)"/>
            <label for="cost">Preço de Custo</label>
        </span>
    </div>
    <div class="field">
        <span class="p-float-label">
            <InputNumber id="profitMargin" suffix="%" v-model="this.product.profitMargin" @blur="applyMargin" />
            <label for="profitMargin">Margem de Lucro</label>
        </span>
    </div>
    <div class="field">
        <span class="p-float-label">
            <InputNumber id="price" mode="currency" currency="BRL" locale="pt-BR" v-model="this.product.price" />
            <label for="price">Preço de Venda</label>
        </span>
    </div>
    <div class="field">
        <span class="p-float-label">
            <InputNumber id="quantity" v-model="this.product.quantity" />
            <label for="quantity">Estoque</label>
        </span>
    </div>
    <ConfirmPopup>
        <div class="flex p-4">
            <p class="pl-2">Quer manter a margem de lucro de {{ this.product.profitMargin }}% ?</p>
        </div>
    </ConfirmPopup>
</template>

<script>
    import Button from 'primevue/button';
    import InputText from 'primevue/inputtext';
    import InputNumber from 'primevue/inputnumber';
    import Chips from 'primevue/chips';
    import ConfirmPopup from 'primevue/confirmpopup';
        
    export default {
        name: "ProductForm",
        data() {
            return {
                profitMargin: 0,
                showConfirmationDialog: false,
            }
        },
        props: ['stockProduct'],
        methods: {
            changeProfitMargin(event) {
                this.$confirm.require({
                    target: event.currentTarget,
                    message: `Quer manter a margem de lucro de ${ this.product.profitMargin }% ?`,
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.product.profitMargin = this.product.cost + (this.product.cost * (this.product.profitMargin / 100));
                    },
                    reject: () => {
                        //callback to execute when user rejects the action
                    },
                    onShow: () => {
                        //callback to execute when dialog is shown
                    },
                    onHide: () => {
                        //callback to execute when dialog is hidden
                    }
                });
            },
            applyMargin() {
                this.product.price = this.product.cost + (this.product.cost * (this.product.profitMargin / 100));
            }
        },
        computed: {
            product() {
                return this.stockProduct;
            }
        },
        components: {
            Button,
            InputText,
            InputNumber,
            Chips,
            ConfirmPopup
        }
    }
</script>

<style>
    .field {
        margin-top: 2em;
    }
    
</style>