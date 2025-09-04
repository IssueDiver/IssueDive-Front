// src/stores/auth.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

// 'auth'라는 이름의 스토어를 정의합니다.
export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  // localStorage에서 초기 값을 가져와서 새로고침해도 유지되도록 함
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'));

  // --- Getters ---
  const isAuthenticated = computed(() => !!accessToken.value);

  // --- Actions ---
  /**
   * 로그인 시 호출되는 액션입니다.
   * 사용자 정보를 state에 저장하고, 페이지를 새로고침해도 유지되도록 localStorage에도 저장합니다.
   * @param userData - 로그인한 사용자의 User 객체 & token 정보
   */
  function login(userData: User, token: string) {
    user.value = userData;
    accessToken.value = token;
    // localStorage에 저장하여 영속성 유지
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', token);
  }

  /**
   * 로그아웃 시 호출되는 액션입니다.
   * state와 localStorage에서 사용자 정보를 모두 제거합니다.
   */
  function logout() {
    user.value = null;
    accessToken.value = null;
    // localStorage에서 정보 제거
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  }


  // /**
  //  * 앱이 시작되거나 페이지가 새로고침될 때 호출되는 액션입니다.
  //  * localStorage에 저장된 사용자 정보가 있다면, 그 정보로 state를 복원합니다.
  //  */
  // function checkAuthStatus() {
  //   const userJson = localStorage.getItem('currentUser')
  //   if (userJson) {
  //     currentUser.value = JSON.parse(userJson)
  //   }
  // }

  return { user, accessToken, isAuthenticated, login, logout };
});