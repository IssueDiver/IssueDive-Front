<script setup lang="ts">
// LoginView.vue

import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { mockLogin, useMock} from '@/config/mockConfig'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const authStore = useAuthStore()

const onLogin = async () => {
  if (useMock) {
    const result = await mockLogin(username.value, password.value)
    if (result.success) {
      alert(`로그인 성공! 환영합니다, ${result.user.username}`)
      // TODO: 로그인 상태 전역 저장 처리 필요
      router.push('/')
    } else {
      error.value = result.message
    }
  } else {
    try {
      // 실제 로그인 API 호출
      const response = await axios.post('http://localhost:8080/login',
        `username=${username.value}&password=${password.value}`, // form-data 형식으로 전송
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true // 세션 쿠키를 주고받기 위해 필수!
        }
      );
    const user = response.data.user; 
    if (user) {
      authStore.login(user); // Pinia 스토어에 사용자 정보 저장
      alert('로그인 성공!');
      router.push('/');
    }
    } catch (err) {
      error.value = '로그인에 실패했습니다. 아이디와 비밀번호를 확인하세요.';
      console.error(err);
    }
  }
}
</script>

<template>
  <div>
    <h1>로그인</h1>
    <input v-model="username" placeholder="사용자명" autofocus />
    <input v-model="password" placeholder="비밀번호" type="password" />
    <button @click="onLogin">로그인</button>
    <p v-if="error" style="color: red;">{{ error }}</p>
  </div>
</template>
