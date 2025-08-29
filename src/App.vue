<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <nav>
      <RouterLink to="/">Home</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>


<style scoped>

header {
  line-height: 1.5;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 2rem;
}

nav {
  width: 100%;
  font-size: 1rem;
  text-align: center;
  padding: 1rem 0;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
  font-weight: bold;
}
</style>