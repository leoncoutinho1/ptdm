<script>
    import { RouterLink, RouterView } from 'vue-router'
    import 'primeflex/primeflex.css';
import Button from 'primevue/button';
    
    export default {
        name: 'AppPadaria',
        components: {
            RouterLink,
            RouterView            
        },
        methods: {
        }
    }
</script>
  
  <template>
    <header>
        <nav>
          <RouterLink to="/"><font-awesome-icon icon="fa-solid fa-home"/></RouterLink>
          <RouterLink to="/checkout"><font-awesome-icon icon="fa-solid fa-cart-shopping"/></RouterLink>
          <RouterLink to="/stock"><font-awesome-icon icon="fa-solid fa-boxes"/></RouterLink>
          <RouterLink to="/logout"><font-awesome-icon icon="fa-solid fa-right-from-bracket" /></RouterLink>
        </nav>
    </header>
    <div class="wrapper">
      <RouterView />
    </div>
  </template>
  
  <style scoped>
 
  header {
    max-height: 100vh;
    width: 5em;
    padding: .1em;
    background-color: rgb(241, 241, 241);
  }
  
  nav {
    width: 100%;
    font-size: 1em;
    text-align: center;
    display: flex;
    flex-direction: column;
    font-size: 1.2em;
  }
  
  .wrapper {
    max-height: 100vh;
    width: 100%;
    padding: 2em;
  }
  
  nav a.router-link-exact-active {
    color: var(--color-text);
  }
  
  nav a.router-link-exact-active:hover {
    background-color: transparent;
  }
  
  nav a {
    display: inline-block;
    padding: 1em;
  }
  </style>
  