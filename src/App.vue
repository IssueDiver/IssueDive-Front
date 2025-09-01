<script setup lang="ts">
// src/App.vue (업데이트된 버전)
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-gray-100 font-sans text-gray-800">
    
    <header class="bg-gray-900 text-white shadow-md">
      <div class="container mx-auto px-4 py-3 flex items-center">
        <svg class="h-8 w-8 mr-3 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 class="text-xl font-bold">Issue Dive</h1>
        
        <nav class="ml-10">
          <RouterLink to="/" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Issues</RouterLink>
          <RouterLink to="/labels" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Labels</RouterLink>
        </nav>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <RouterView />
    </main>

  </div>
</template>

<style>
/* App.vue의 style 태그는 이제 비워두거나 삭제해도 됩니다. 
   모든 스타일은 main.css와 Tailwind 클래스로 제어합니다. */
</style>