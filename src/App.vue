<template>
  <div id="nav">
    <!-- <router-link to="/">Home</router-link> | -->
  </div>
  <router-view/>
</template>

<style>
@import url("https://fonts.googleapis.com/icon?family=Material+Icons+Round");
.el-icon-material {
  font-family: 'Material Icons Round' !important;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
