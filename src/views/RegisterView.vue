<script setup lang="ts">
// RegisterView.vue

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { mockRegister, useMock } from '@/config/mockConfig'

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
    // 실제 회원가입 API 호출 코드 위치
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
