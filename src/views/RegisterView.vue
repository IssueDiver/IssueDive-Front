<script setup lang="ts">
// RegisterView.vue

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { mockRegister, useMock } from '@/config/mockConfig'
import api from '@/api'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
// const success = ref('')
const authStore = useAuthStore()

const onRegister = async () => {
  if (!username.value.trim() || !email.value.trim() || !password.value.trim()) {
    error.value = '모든 필드를 입력하세요.'
    return
  }
  if (useMock) {
  } else {
    try {
      const response = await api.post('/auth/signup', {
        username: username.value,
        email: email.value,
        password: password.value,
      })

      const responseData = response.data.data;
      const user = responseData.user;
      const accessToken = responseData.accessToken;
    
      if (user && accessToken) {
        // 성공 메시지 대신, auth 스토어의 login 액션을 호출하여 로그인 상태로 만듭니다.
        // 로그인 페이지가 아닌 메인 페이지('/')로 즉시 이동합니다.
        authStore.login(user, accessToken);
        router.push('/');
      }
    } catch (err: any) {
      // Axios 에러인지 확인하고, 백엔드에서 온 에러 메시지를 사용
      if (axios.isAxiosError(err) && err.response) {
        // 백엔드의 에러 메시지가 복잡한 문자열일 수 있으므로, message만 추출하거나 그대로 사용
        error.value = err.response.data.error?.message || '회원가입에 실패했습니다. 입력 정보를 확인해주세요.';
      } else {
        error.value = '알 수 없는 오류가 발생했습니다.';
      }
    }
  }
}
</script>

<template>
  <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-lg">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Create a new account
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="onRegister" novalidate>
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="username" class="sr-only">Username</label>
            <input 
              id="username" 
              v-model="username" 
              name="username" 
              type="text" 
              required 
              class="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm" 
              placeholder="Username"
            />
          </div>
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input 
              id="email-address" 
              v-model="email" 
              name="email" 
              type="email" 
              autocomplete="email" 
              required 
              class="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm" 
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input 
              id="password" 
              v-model="password" 
              name="password" 
              type="password" 
              autocomplete="new-password" 
              required 
              class="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm" 
              placeholder="Password"
            />
          </div>
        </div>
        
        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span class="block sm:inline">{{ error }}</span>
        </div>
        <!-- <div v-if="success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span class="block sm:inline">{{ success }}</span>
        </div> -->

        <div>
          <button 
            type="submit" 
            class="group relative flex w-full justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Create account
          </button>
        </div>
      </form>
       <div class="text-sm text-center">
        <span class="text-gray-600">이미 계정이 있으신가요? </span>
        <router-link to="/login" class="font-medium text-green-600 hover:text-green-500">
          로그인
        </router-link>
      </div>
    </div>
  </div>
</template>

