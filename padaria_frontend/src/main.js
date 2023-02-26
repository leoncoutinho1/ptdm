import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faHome } from '@fortawesome/free-solid-svg-icons'
import { faBoxes } from '@fortawesome/free-solid-svg-icons'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { faCartShopping } from '@fortawesome/free-solid-svg-icons'
import ConfirmationService from 'primevue/confirmationservice';

import PrimeVue from 'primevue/config';

import 'primevue/resources/themes/saga-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css' 

library.add(faHome, faBoxes, faCartShopping, faInfoCircle)
import './assets/main.css'

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(PrimeVue)
app.use(router)
app.use(ConfirmationService);

app.mount('#app')
