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
    const result = await mockLogin(email.value, password.value)
    if (result.success) {
      alert(`로그인 성공! 환영합니다, ${result.user.username}`)
      // TODO: 로그인 상태 전역 저장 처리 필요
      router.push('/')
    } else {
      error.value = result.message
    }
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
          alert('로그인 성공!');
          router.push('/');
        }
      } 
    catch (err) {
      error.value = '로그인에 실패했습니다. 이메일과 비밀번호를 확인하세요.';
      console.error(err);
    }
  }
}
</script>

<template>
  <div>
    <h1>로그인</h1>
    <input v-model="email" placeholder="이메일" autofocus />
    <input v-model="password" placeholder="비밀번호" type="password" @keyup.enter="onLogin" />
    <button @click="onLogin">로그인</button>
    <p v-if="error" style="color: red;">{{ error }}</p>
    
    <div style="margin-top: 20px;">
      <span>계정이 없으신가요? </span>
      <router-link to="/register">회원가입</router-link>
    </div>
  </div>
</template>