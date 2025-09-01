// src/stores/auth.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

// 'auth'라는 이름의 스토어를 정의합니다.
export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  // 현재 로그인한 사용자 정보를 저장합니다.
  const currentUser = ref<User | null>(null)

  // --- Getters ---
  // 로그인 여부를 쉽게 확인하기 위한 getter입니다.
  const isLoggedIn = computed(() => !!currentUser.value)
  // 현재 유저의 ID를 쉽게 가져오기 위한 getter입니다.
  const currentUserId = computed(() => currentUser.value?.id)

  // --- Actions ---
  /**
   * 로그인 시 호출되는 액션입니다.
   * 사용자 정보를 state에 저장하고, 페이지를 새로고침해도 유지되도록 localStorage에도 저장합니다.
   * @param user - 로그인한 사용자의 User 객체
   */
  function login(user: User) {
    currentUser.value = user
    localStorage.setItem('currentUser', JSON.stringify(user))
  }

  /**
   * 로그아웃 시 호출되는 액션입니다.
   * state와 localStorage에서 사용자 정보를 모두 제거합니다.
   */
  function logout() {
    currentUser.value = null
    localStorage.removeItem('currentUser')
  }

  /**
   * 앱이 시작되거나 페이지가 새로고침될 때 호출되는 액션입니다.
   * localStorage에 저장된 사용자 정보가 있다면, 그 정보로 state를 복원합니다.
   */
  function checkAuthStatus() {
    const userJson = localStorage.getItem('currentUser')
    if (userJson) {
      currentUser.value = JSON.parse(userJson)
    }
  }

  return { currentUser, isLoggedIn, currentUserId, login, logout, checkAuthStatus }
})