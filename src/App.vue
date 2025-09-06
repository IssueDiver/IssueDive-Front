<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import SidebarNav from './components/SidebarNav.vue';

const authStore = useAuthStore();
const route = useRoute();

const isSidebarOpen = ref(true);

const showSidebar = computed(() => {
  return route.name !== 'login' && route.name !== 'register';
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};
</script>

<template>
  <div class="flex h-screen bg-gray-100 font-sans text-gray-800">
    
    <SidebarNav 
      v-if="showSidebar" 
      :is-open="isSidebarOpen"
      :is-authenticated="authStore.isAuthenticated"
      :current-user="authStore.user"
      @toggle-sidebar="toggleSidebar" 
      @logout="authStore.logout"
    />

    <!-- 메인 콘텐츠 영역 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- ⭐️ 이제 상단 헤더가 없습니다. -->
      
      <!-- 실제 페이지 내용이 표시되는 영역 -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div class="container mx-auto px-6 py-8">
          <RouterView />
        </div>
      </main>
    </div>

  </div>
</template>

<style>
/* 전역 스타일이 필요하다면 여기에 남겨둡니다. */
</style>

