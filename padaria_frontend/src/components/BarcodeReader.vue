<template>
    <div id="interactive" class="viewport"></div>
    <Button label="Close" icon="pi pi-times" @click="stopScan" />
</template>

<script>
    import Quagga from 'quagga';
    import Button from 'primevue/button';
    import Dialog from 'primevue/dialog';

    export default {
        name: "BarcodeReader",
        data() {
            return {
                code: "",
                quaggaConfig: {
                    inputStream: {
                        type : "LiveStream",
                        constraints: {
                            width: {max: 320},
                            height: {max: 240},
                            aspectRatio: {min: 1, max: 100},
                            facingMode: "environment" // or "user" for the front camera
                        }
                    },
                    locator: {
                        patchSize: "medium",
                        halfSample: true
                    },
                    numOfWorkers: (navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4),
                    decoder: {
                        "readers":[
                            {"format":"ean_reader","config":{}}
                        ]
                    },
                    locate: true
                }              
            }
        },
        props: ['showModal'],
        emits: [
            'searchCode',
            'closeModal',
            'editProduct'
        ],
        methods: {
            async searchCode(code) {
                const response = await fetch(`${import.meta.env.VITE_TDM_API}/Product/GetProductByBarcode?barcode=${code}`);
                if (response.ok) {
                    var product = await response.json();
                    if (product != undefined) {
                        Quagga.stop();
                        this.$emit('editProduct', product);
                    }
                }
            },
            startScan() {
                this.displayModal = true;
                setTimeout(() => {
                    Quagga.init(this.quaggaConfig, 
                        function(err) {
                            if (err) {
                                console.log(err);
                                this.stopScan();
                                return;
                            }
                            Quagga.start();
                        }
                    );
                    Quagga.onDetected((res) => {
                        this.searchCode(res.codeResult.code);
                        this.stopScan();
                    });
                }, 1000);
            },
            stopScan() {
                Quagga.stop();
                this.$emit('closeModal');
            }            
        },
        created() {
            this.startScan();
        },
        components: {
            Button,
            Dialog
        }
    }
</script>

<style>
    .viewport {
        margin: 3em;    
    }
</style>