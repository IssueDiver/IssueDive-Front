<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import SidebarNav from './components/SidebarNav.vue';

const authStore = useAuthStore();
const route = useRoute();
// localStorage에서 'sidebar-is-open' 값을 읽어와 초기 상태를 설정합니다.
//    - 값이 없으면 기본값으로 'true'(열림)를 사용합니다.
const isSidebarOpen = ref(JSON.parse(localStorage.getItem('sidebar-is-open') ?? 'true'));

const showSidebar = computed(() => {
  return route.name !== 'login' && route.name !== 'register';
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
  localStorage.setItem('sidebar-is-open', JSON.stringify(isSidebarOpen.value)); // 사이드바 상태를 변경할 때마다 localStorage에도 저장합니다.
};

// (선택적 개선) 창 크기가 작아지면 사이드바를 자동으로 닫도록 설정합니다.
onMounted(() => {
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  const handleResize = (e: MediaQueryListEvent) => {
    if (e.matches) { // 화면이 md 사이즈보다 작아지면
      isSidebarOpen.value = false;
      localStorage.setItem('sidebar-is-open', 'false');
    }
  };
  
  // 초기 로드 시 한 번 체크
  if (mediaQuery.matches) {
    isSidebarOpen.value = false;
  }
  
  mediaQuery.addEventListener('change', handleResize);
});
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

