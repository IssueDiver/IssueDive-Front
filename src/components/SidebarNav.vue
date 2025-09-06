<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { User } from '@/types';

const props = defineProps<{
  isOpen: boolean
  isAuthenticated: boolean
  currentUser: User | null
}>()

const emit = defineEmits(['toggle-sidebar', 'logout'])

const handleLogoutClick = () => {
  if (confirm('로그아웃 하시겠습니까?')) {
    emit('logout');
  }
}
</script>

<template>
  <aside 
    :class="['flex flex-col h-full bg-gray-900 text-white transition-all duration-300', isOpen ? 'w-64' : 'w-20']"
  >
    <!-- 1. 로고 및 사이드바 토글 섹션 (상단) -->
    <div :class="['flex items-center h-16 flex-shrink-0 border-b border-gray-800 px-4', isOpen ? 'justify-between' : 'justify-center']">
      
      <!-- 로고는 사이드바가 열려있을 때만 보입니다. -->
      <RouterLink v-if="isOpen" to="/" class="flex items-center text-white no-underline">
        <svg class="h-8 w-8 text-white-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
        </svg>
        <span class="ml-3 text-xl font-bold whitespace-nowrap">Issue Dive</span>
      </RouterLink>
      
      <!-- 토글 버튼은 항상 같은 위치에 있으며, 아이콘만 상태에 따라 변경됩니다. -->
      <button @click="emit('toggle-sidebar')" class="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none">
        <svg v-if="isOpen" class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" /></svg>
        <svg v-else class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" /></svg>
      </button>
    </div>

    <!-- 2. 네비게이션 메뉴 섹션 (남는 공간 모두 차지) -->
    <nav class="flex-grow p-2 space-y-1">
      <RouterLink 
        to="/" 
        :class="['nav-link', !isOpen && 'justify-center']"
        active-class="nav-link-active"
      >
        <svg class="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 5.25 6.108V18a2.25 2.25 0 0 0 2.25 2.25h.75M15.75 21H9a2.25 2.25 0 0 1-2.25-2.25V6.108A2.25 2.25 0 0 1 9 3.858m7.5 1.292a2.25 2.25 0 0 1-.217 1.379l-.498.867M16.5 3.858 19 2.25l2.5 1.608" /></svg>
        <span v-if="isOpen" class="ml-4 text-base font-semibold">Issues</span>
      </RouterLink>
      <RouterLink 
        to="/labels" 
        :class="['nav-link', !isOpen && 'justify-center']"
        active-class="nav-link-active"
      >
        <svg class="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
        <span v-if="isOpen" class="ml-4 text-base font-semibold">Labels</span>
      </RouterLink>
    </nav>

    <!-- 3. 사용자/인증 섹션 (하단) -->
    <div class="flex-shrink-0 p-2 border-t border-gray-800">
      <!-- 로그인 상태일 때 -->
      <div v-if="isAuthenticated && currentUser" class="w-full">
          <!-- 사이드바가 열려있을 때 UI -->
          <div v-if="isOpen" class="flex items-center p-2">
              <img :src="`https://i.pravatar.cc/40?u=${currentUser.id}`" alt="avatar" class="w-10 h-10 rounded-full flex-shrink-0" />
              <div class="ml-3 flex-1 overflow-hidden text-left">
                <p class="text-sm font-semibold text-white truncate">{{ currentUser.username }}</p>
                <p class="text-xs text-gray-400 truncate">{{ currentUser.email }}</p>
              </div>
          </div>
          <!-- ⭐️ 3. 로그아웃 버튼을 별도의 UI로 분리합니다. -->
          <button @click="handleLogoutClick" :class="['nav-link', !isOpen && 'justify-center']" title="Logout">
             <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" /></svg>
             <span v-if="isOpen" class="ml-4 font-semibold text-base">Logout</span>
          </button>
      </div>
      <!-- 로그아웃 상태일 때 -->
      <RouterLink v-else to="/login" :class="['nav-link', !isOpen && 'justify-center']">
        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" /></svg>
        <span v-if="isOpen" class="ml-4 font-semibold text-base">Login</span>
      </RouterLink>
    </div>
  </aside>
</template>

<style scoped>
/* 활성화된 링크에 적용될 스타일입니다. */
.nav-link.router-link-exact-active {
  background-color: #272d37;
  color: white;
  font-weight: 600;
}
.nav-link {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1rem;
  color: #D1D5DB;
  border-radius: 0.5rem;
  transition-property: color, background-color;
  transition-duration: 200ms;
}
.nav-link:hover {
  background-color: #374151; 
  color: white;
}
</style>