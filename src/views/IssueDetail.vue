<script setup lang="ts">
// IssueDetail.vue

// Vue, 라우터, axios, 타입 임포트
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import type { Issue } from '@/types/issue'
import type { Label } from '@/types/'
import { useMock } from '@/config/mockConfig'
import CommentSection from '@/components/CommentSection.vue'
import { getContrastingTextColor } from '@/utils/colors'; 

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
  <div v-if="loading">
    <p>Loading...</p>
  </div>
  <div v-else-if="issue">
    <div class="mb-4 pb-4 border-b border-gray-200">
      <h1 class="text-3xl font-bold text-gray-900">{{ issue.title }} <span class="text-3xl text-gray-400 font-light">#{{ issue.id }}</span></h1>
      <div class="flex items-center mt-2">
        <span :class="[issue.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800']"
              class="px-3 py-1 text-sm font-semibold leading-none rounded-full">
          {{ issue.status }}
        </span>
        <span class="ml-4 text-sm text-gray-600">
          <strong>{{ issue.author?.username || 'unknown user' }}</strong> opened this issue on {{ new Date(issue.createdAt).toLocaleString() }}
        </span>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-8">
      <div class="flex-grow">
        <div class="prose max-w-none p-4 border rounded-md bg-white">
          <p>{{ issue.description || 'No description provided.' }}</p>
        </div>
        <CommentSection :issue-id="issueId" />
      </div>

      <aside class="w-full md:w-64 flex-shrink-0">
        <div class="p-4 border rounded-md bg-white space-y-4">
          <div>
            <h3 class="text-sm font-semibold text-gray-500 mb-2">Assignees</h3>
             <p>{{ issue.assignee?.username || 'No one assigned' }}</p>
          </div>
          <hr/>
          <div>
            <h3 class="text-sm font-semibold text-gray-500 mb-2">Labels</h3>
            <div class="flex flex-wrap gap-2">
               <span v-for="labelId in issue.labelIds"
                     :key="labelId"
                     :style="{ 
                      backgroundColor: getLabelById(labelId)?.color,
                      color: getContrastingTextColor(getLabelById(labelId)?.color || '#000000')
                      }"
                     class="text-white px-3 py-1 text-xs font-semibold rounded-full shadow-sm">
                {{ getLabelById(labelId)?.name }}
              </span>
            </div>
          </div>
           <hr/>
           <button @click="changeIssueStatus(issue.status === 'OPEN' ? 'CLOSED' : 'OPEN')"
                   class="w-full text-center py-2 px-4 border rounded-md hover:bg-gray-100 font-semibold text-gray-700">
              {{ issue.status === 'OPEN' ? 'Close issue' : 'Reopen issue' }}
           </button>
        </div>
      </aside>
    </div>
  </div>
  <div v-else-if="error">
    <p class="text-red-500">{{ error }}</p>
  </div>
</template>