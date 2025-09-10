<script setup lang="ts">
// LoginView.vue

import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { mockLogin, useMock} from '@/config/mockConfig'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'; 

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const authStore = useAuthStore()

const onLogin = async () => {
  if (useMock) {
  } else {
    try {
        const response = await api.post('/auth/login', {
          email: email.value, // username 대신 email 전송
          password: password.value,
        });

        // 응답 데이터에서 user와 accessToken 추출
        const responseData = response.data.data;
        const user = responseData.user;
        const accessToken = responseData.accessToken;

        if (user && accessToken) {
          // 스토어의 login 액션에 user와 accessToken을 모두 전달
          authStore.login(user, accessToken);
          // alert('로그인 성공!'); // alert 제거
          router.push('/');
        }
      } 
    catch (err) {
      // Axios 에러인지 확인하고, 백엔드에서 온 에러 메시지를 사용
      if (axios.isAxiosError(err) && err.response) {
        error.value = err.response.data.error?.message || '로그인에 실패했습니다. 입력 정보를 확인해주세요.';
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
          Sign in to your account
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="onLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input 
              id="email-address" 
              v-model="email" 
              name="email" 
              type="email" 
              autocomplete="email" 
              required 
              class="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm" 
              placeholder="Email address"
              autofocus
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input 
              id="password" 
              v-model="password" 
              name="password" 
              type="password" 
              autocomplete="current-password" 
              required 
              class="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm" 
              placeholder="Password"
              @keyup.enter="onLogin"
            />
          </div>
        </div>

        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span class="block sm:inline">{{ error }}</span>
        </div>

        <div>
          <button 
            type="submit" 
            class="group relative flex w-full justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Sign in
          </button>
        </div>
      </form>
      <div class="text-sm text-center">
        <span class="text-gray-600">계정이 없으신가요? </span>
        <router-link to="/register" class="font-medium text-green-600 hover:text-green-500">
          회원가입
        </router-link>
      </div>
    </div>
  </div>
</template>