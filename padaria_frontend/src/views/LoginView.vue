<template>
  <div class="home">
    <h1>Login</h1>
    <div class="card">
        <div class="p-fluid grid">
            <div class="col-3">
                <span class="p-float-label">
                    <InputText id="email" type="email" v-model="this.email" inputStyle="font-weight: 500;"/>
                    <label for="email">Email</label>
                </span>
            </div>
            <div class="col-9">
                <span class="p-float-label">
                    <Password id="password" v-model="this.password" :feedback="false" toggleMask></Password>
                    <label for="password">Senha</label>
                </span>
            </div>
            <Button label="Entrar" @click="login($event)" ></Button>
            <transition-group name="p-messages" tag="div">
                <Message v-for="msg of messages" :severity="msg.severity" :key="msg.content">{{msg.content}}</Message>
            </transition-group>
        </div>
    </div>
  </div>
</template>

<script>
    import Password from 'primevue/password';
    import InputText from 'primevue/inputtext';
    import Button from 'primevue/button';
    import Message from 'primevue/message';

    export default {
        name: 'LoginView',
        data() {
            return {
                email: "",
                password: "",
                token: "",
                messages: [],
                showStatus: false
            }
        },        
        methods: {
            async login() {
                const response = await fetch(`${import.meta.env.VITE_TDM_API}/Login/authenticate`, {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        Email: this.email,
                        Password: this.password
                    })                    
                });
                
                var res = await response.json();
                console.log(response.status)
                if (response.status == 200) {
                    localStorage.setItem('token', res.data);
                    this.$router.push({name: 'home'});
                } else {
                    this.messages = [
				        {severity: 'error', content: 'Login Inválido'}
                    ];
                }
            },
        },
        components: {
            InputText,
            Password,
            Button,
            Message  
        }
    }
</script>

<style scoped>
    
</style>