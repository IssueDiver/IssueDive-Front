<template>
  <nav class="navbar">
    <router-link to="/">Home</router-link>

    <div v-if="authStore.isAuthenticated">
      <button @click="handleLogout">로그아웃</button>
    </div>
    <div v-else>
      <router-link to="/login">로그인</router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();

const handleLogout = () => {
  authStore.logout();
};
</script>

<style scoped>
/* 간단한 스타일 예시 */
.navbar {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}
</style>