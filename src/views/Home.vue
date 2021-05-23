<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
  <div id="app">
    {{ info }}
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'

// import axios from 'axios'

export default {
  name: 'Home',
  components: {
    HelloWorld
  },
  data () {
    return {
      info: null
    }
  },
  mounted () {
    // axios.get('/api/homeassistant/auth.do')
    //   .then(response => (this.info = response.data))
  }
}
</script>
