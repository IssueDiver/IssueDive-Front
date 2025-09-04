<script setup lang="ts">
// RegisterView.vue

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { mockRegister, useMock } from '@/config/mockConfig'
import api from '@/api'

const router = useRouter()
const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')

const onRegister = async () => {
  if (!username.value.trim() || !email.value.trim() || !password.value.trim()) {
    error.value = '모든 필드를 입력하세요.'
    return
  }
  if (useMock) {
    const result = await mockRegister(username.value, email.value, password.value)
    if (result.success) {
      success.value = '회원가입 성공! 로그인하세요.'
      error.value = ''
      // 리디렉션은 임의로 처리하거나 버튼 클릭으로 유도 가능
    } else {
      error.value = result.message ?? '회원가입에 실패했습니다.'
      success.value = ''
    }
  } else {
    try {
      const response = await api.post('/auth/signup', {
        username: username.value,
        email: email.value,
        password: password.value,
      })

      if (response.data.success) {
        success.value = '회원가입 성공! 로그인 페이지로 이동합니다.'
        error.value = ''
        setTimeout(() => {
          router.push({ name: 'login' })
        }, 2000) // 2초 후 로그인 페이지로 이동
      }
    } catch (err: any) {
      // 400 Bad Request와 같은 에러 처리
      if (err.response && err.response.data && err.response.data.message) {
        error.value = err.response.data.message
      } else {
        error.value = '회원가입에 실패했습니다.'
      }
      success.value = ''
    }
  }
}
</script>

<template>
  <div>
    <h1>회원가입</h1>
    <input v-model="username" placeholder="사용자명" />
    <input v-model="email" placeholder="이메일" />
    <input v-model="password" placeholder="비밀번호" type="password" />
    <button @click="onRegister">회원가입</button>
    <p v-if="error" style="color: red;">{{ error }}</p>
    <p v-if="success" style="color: green;">{{ success }}</p>
  </div>
</template>
