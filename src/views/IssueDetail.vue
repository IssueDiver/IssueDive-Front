<script setup lang="ts">
// IssueDetail.vue

// Vue, 라우터, axios, 타입 임포트
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import type { Issue } from '@/types/issue'
import type { Label } from '@/types/'
import { useMock } from '@/config/mockConfig'

// 라우터 및 네비게이션 객체 생성
const route = useRoute()
const router = useRouter()

// URL에서 이슈 ID를 숫자로 변환하여 가져오기
const issueId = Number(route.params.id)

// 상태 및 데이터 변수 선언
const issue = ref<Issue | null>(null)
const labels = ref<Label[]>([])         // 전체 라벨 리스트
const loading = ref(true)
const error = ref<string | null>(null)

// 목업 데이터 함수 예제
const fetchMockIssue = async (): Promise<Issue> => {
  return {
    id: issueId,
    title: '테스트용 목업 이슈 상세',
    description: '이것은 목업 데이터입니다.',
    status: 'OPEN',
    authorId: 1,
    assigneeId: 2,
    labelIds: [1, 2],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

const fetchMockLabels = async (): Promise<Label[]> => {
  return [
    { id: 1, name: 'bug', color: '#ff0000', description: '버그 관련' },
    { id: 2, name: 'feature', color: '#00ff00', description: '기능 관련' },
  ]
}

// 라벨 아이디를 기준으로 라벨 이름과 색상 반환 헬퍼 함수
const getLabelById = (id: number) => labels.value.find(l => l.id === id)

// 이슈 상태 변경 함수 (OPEN/CLOSED)
const changeIssueStatus = async (newStatus: 'OPEN' | 'CLOSED') => {
  if (!issue.value) return
  try {
    if (useMock) {
      // 목업 모드: 상태만 변경
      issue.value.status = newStatus
      issue.value.updatedAt = new Date().toISOString()
      alert(`이슈 상태가 ${newStatus}로 변경되었습니다. (목업 모드)`)
    } else {
      // 실제 API 호출
      const response = await axios.patch<{ success: boolean; data: { id: number; status: string; updated_at: string } }>(
        `http://localhost:8080/issues/${issueId}/status`,
        { status: newStatus }
      )
      if (response.data.success) {
        issue.value.status = response.data.data.status
        issue.value.updatedAt = response.data.data.updated_at
        alert(`이슈 상태가 ${newStatus}로 변경되었습니다.`)
      } else {
        alert('이슈 상태 변경에 실패했습니다.')
      }
    }
  } catch (e) {
    alert('서버 오류로 상태 변경이 실패했습니다.')
    console.error(e)
  }
}

// 이슈 상세 데이터와 라벨 목록을 가져오는 함수
const fetchIssueDetail = async () => {
  try {
    loading.value = true
    if (useMock) {
      issue.value = await fetchMockIssue()
      labels.value = await fetchMockLabels()
    } else {
      const [issueRes, labelRes] = await Promise.all([
        axios.get<{ success: boolean; data: Issue }>(`http://localhost:8080/issues/${issueId}`),
        axios.get<{ success: boolean; data: Label[] }>('http://localhost:8080/labels')
      ])
      if (issueRes.data.success) issue.value = issueRes.data.data
      else error.value = '이슈를 불러오는데 실패했습니다.'
      if (labelRes.data.success) labels.value = labelRes.data.data
      else error.value = '라벨 목록을 불러오는데 실패했습니다.'
    }
  } catch (e) {
    error.value = '서버 오류가 발생했습니다.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 컴포넌트 로딩 시 실행
onMounted(() => {
  if (!issueId || isNaN(issueId)) {
    router.push({ name: 'home' }) // 잘못된 id는 홈으로 리다이렉트
  } else {
    fetchIssueDetail()
  }
})
</script>

<template>
  <main>
    <h1>이슈 상세 정보</h1>

    <!-- 로딩 표시 -->
    <p v-if="loading">로딩 중...</p>

    <!-- 에러 메시지 -->
    <p v-if="error" class="error">{{ error }}</p>

    <!-- 상세 정보 표시 -->
    <div v-if="issue && !loading && !error" class="issue-detail">
      <h2>{{ issue.title }}</h2>
      <p><strong>설명:</strong> {{ issue.description || '설명 없음' }}</p>
      <p><strong>상태:</strong> {{ issue.status }}</p>

      <!-- 상태 변경 버튼 -->
      <div>
        <button :disabled="issue.status === 'OPEN'" @click="changeIssueStatus('OPEN')">상태 열기 (OPEN)</button>
        <button :disabled="issue.status === 'CLOSED'" @click="changeIssueStatus('CLOSED')" style="margin-left: 0.5rem;">상태 닫기 (CLOSED)</button>
      </div>

      <p><strong>작성자 ID:</strong> {{ issue.authorId }}</p>
      <p><strong>담당자 ID:</strong> {{ issue.assigneeId ?? '없음' }}</p>

      <!-- 라벨 이름과 색상으로 보기 좋게 표시 -->
      <p><strong>라벨: </strong>
        <span v-for="labelId in issue.labelIds" :key="labelId" :style="{ color: getLabelById(labelId)?.color || '#000', 'margin-right': '0.5rem' }">
          {{ getLabelById(labelId)?.name || '알 수 없음' }}
        </span>
      </p>

      <p><strong>생성일:</strong> {{ new Date(issue.createdAt).toLocaleString() }}</p>
      <p><strong>수정일:</strong> {{ new Date(issue.updatedAt).toLocaleString() }}</p>
    </div>

    <!-- 뒤로 가기 -->
    <button @click="$router.back()">뒤로 가기</button>
  </main>
</template>

<style scoped>
.error {
  color: red;
  margin: 1rem 0;
}
.issue-detail {
  margin: 1rem 0;
}
button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
}
</style>
