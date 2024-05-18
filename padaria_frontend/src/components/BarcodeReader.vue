<template>
    <div id="interactive" class="viewport">
        <qrcode-stream :formats="['ean_13']" @detect="searchCode"></qrcode-stream>
        </div>
    <Button label="Close" icon="pi pi-times" @click="stopScan" ></Button>
</template>

<script>
    import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from 'vue-qrcode-reader'
    // import Quagga from 'quagga';
    import Button from 'primevue/button';
    import Dialog from 'primevue/dialog';
    import HTTP from '../helpers/http-common';

    export default {
        name: "BarcodeReader",
        data() {
            return {}
        },
        props: ['showModal'],
        emits: [
            'searchCode',
            'closeModal',
            'editProduct'
        ],
        methods: {
            async searchCode(codes) {
                console.log(codes);
                await HTTP.get(`/Product/GetProductByBarcode?barcode=${codes[0].rawValue}`)
                    .then(response => {
                        var product = response.data;
                        if (product != undefined) {
                            this.$emit('editProduct', product);
                        }
                        this.$emit('closeModal');
                    });
            },
            stopScan() {
                this.$emit('closeModal');
            }            
        },
        created() {
            // this.startScan();
        },
        components: {
            Button,
            Dialog,
            QrcodeStream,
            QrcodeDropZone,
            QrcodeCapture
        }
    }
</script>

<style>
    .viewport {
        margin: 3em;    
    }
</style>