<template>
  <div class="home">
    <h1>Login</h1>
    <div class="card">
        <span class="p-float-label spanLogin">
            <InputText inputStyle="font-weight: 500;" id="email" type="email" v-model="this.email" style="width: 100%"/>
            <label for="email">Email</label>
        </span>
        <span class="p-float-label spanLogin">
            <Password inputStyle="width: 100%" id="password" v-model="this.password" :feedback="false" toggleMask></Password>
            <label for="password">Senha</label>
        </span>
        <Button class="col-12" label="Entrar" @click="login($event)" ></Button>
        <transition-group name="p-messages" tag="div">
            <Message v-for="msg of messages" :severity="msg.severity" :key="msg.content">{{msg.content}}</Message>
        </transition-group>
    </div>
  </div>
</template>

<script>
    import Password from 'primevue/password';
    import InputText from 'primevue/inputtext';
    import Button from 'primevue/button';
    import Message from 'primevue/message';
    import HTTP from '../helpers/http-common';

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
                HTTP.post(`/Login/authenticate`, {
                    Email: this.email,
                    Password: this.password
                }).then(response => {
                    localStorage.setItem('token', response.data)
                    this.$router.push({name: 'home'});
                })
                .catch(e => {
                    this.messages = [
				        {severity: 'error', content: 'Login Inválido'}
                    ];
                });
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
    .card {
        padding: 25px;
        border: 1px solid lightgray;
        border-radius: 5px;
        max-width: 300px;
        display: flex;
        flex-direction: column;
    }

    .spanLogin {
        margin-bottom: 25px;
    }

    .p-password {
        width: 100%;
    }
</style>