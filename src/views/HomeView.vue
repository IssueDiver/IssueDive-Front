<script setup lang="ts">
// HomeView.vue

// Vue Composition API import
import { ref, onMounted } from 'vue'
// axios import
import axios from 'axios'
import { useMock } from '@/config/mockConfig'

// Import components
import IssueList from '@/components/IssueList.vue'
import IssueForm from '@/components/IssueForm.vue'
import IssueFilter from '@/components/IssueFilter.vue'
import LabelManager from '@/components/LabelManager.vue' // 라벨 관리 컴포넌트 임포트

// 타입 import
import type { Issue, IssueFormData, Page } from '@/types/issue'
import type { User, Label } from '@/types/index'

// 상태 변수 선언
const issues = ref<Issue[]>([])    // 이슈 리스트
const users = ref<User[]>([])      // 사용자 리스트
const labels = ref<Label[]>([])    // 라벨 리스트

// 페이지, 필터 변수
const currentPage = ref(0)
const totalPages = ref(0)
const pageSize = 10
const statusFilter = ref('')

// 임시 목업 데이터 함수들
const fetchMockIssues = async () => {
  // 실제 API 호출 대신 임시 데이터 반환
  return [
    {
      id: 1,
      title: '테스트 이슈 1',
      description: '예제 설명',
      status: 'OPEN',
      authorId: 1,
      assigneeId: 2,
      labelIds: [1, 2],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // 필요 시 더 추가
  ];
};

const fetchMockUsers = async () => {
  return [
    { id: 1, username: 'tester1', email: 'tester1@example.com' },
    { id: 2, username: 'tester2', email: 'tester2@example.com' },
  ];
};

const fetchMockLabels = async () => {
  return [
    { id: 1, name: 'bug', color: '#ff0000', description: '' },
    { id: 2, name: 'feature', color: '#00ff00', description: '' },
  ];
};

/**
 * 이슈 목록 조회 함수
 */
const fetchIssues = async (page: number = 0) => {
  try {
    if (useMock) {
      issues.value = await fetchMockIssues();
      totalPages.value = 1;
      currentPage.value = 0;
    } 
    else {
      const params: Record<string, any> = {
        page,
        size: pageSize,
      }
      if (statusFilter.value) {
        params.status = statusFilter.value
      }
      const response = await axios.get<{ success: boolean; data: Page<Issue> }>(
        'http://localhost:8080/issues',
        { params }
      )
      if (response.data.success) {
        const pageData = response.data.data
        issues.value = pageData.content
        totalPages.value = pageData.totalPages
        currentPage.value = pageData.number
      }
    }
  } catch (error) {
    console.error('이슈 목록 불러오기 실패:', error)
  }
}

/**
 * 사용자 목록 조회 함수
 */
const fetchUsers = async () => {
  try {
    if (useMock){
      users.value = await fetchMockUsers();
    }
    else{
        const response = await axios.get<{ success: boolean; data: User[] }>(
        'http://localhost:8080/auth/users'
        )
      if (response.data.success) {
        users.value = response.data.data
      }
    }
  } catch (error) {
    console.error('사용자 목록 불러오기 실패:', error)
  }
};

/**
 * 라벨 목록 조회 함수
 */
const fetchLabels = async () => {
  try {
    if (useMock) {
      labels.value = await fetchMockLabels();
    } else {
      const response = await axios.get<{ success: boolean; data: Label[] }>(
        'http://localhost:8080/labels'
      );
      if (response.data.success) {
        labels.value = response.data.data;
      }
    }
  } catch (error) {
    console.error('라벨 목록 불러오기 실패:', error);
  }
};

/**
 * 필터 상태 변경 핸들러
 */
const onFilter = (status: string) => {
  statusFilter.value = status
  currentPage.value = 0
  fetchIssues(0)
}

/**
 * 페이지 변경 핸들러
 */
const changePage = (pageNum: number) => {
  if (pageNum === currentPage.value) return
  currentPage.value = pageNum
  fetchIssues(pageNum)
}

/**
 * 이슈 생성/수정 핸들러
 * - 새 라벨 이름을 포함하는 경우, 라벨 생성 후 이슈에 적용하는 로직 포함
 */
const handleIssueFormSubmit = async (formData: IssueFormData & { newLabels?: string[] }) => {
  try {
    // 새롭게 입력된 라벨명이 있을 경우 먼저 라벨 생성 API 호출
    let newLabelIds: number[] = []
    if (formData.newLabels && formData.newLabels.length > 0) {
      for (const labelName of formData.newLabels) {
        // 라벨명 중복 체크: 이미 존재하면 추가하지 않음 (임시 프론트 필터 가능)
        if (labels.value.find((l) => l.name.toLowerCase() === labelName.toLowerCase())) {
          continue
        }
        try {
          const res = await axios.post('http://localhost:8080/labels', {
            name: labelName,
            color: '#000000', // 기본 색상(필요시 변경)
          })
          if (res.data.success) {
            newLabelIds.push(res.data.data.id)
            // 새 라벨 등록 후 frontend 라벨 리스트 갱신
            labels.value.push(res.data.data)
          }
        } catch (e) {
          console.error('라벨 생성 실패:', labelName, e)
        }
      }
    }

    // 기존 선택 라벨과 신규 생성 라벨 id 합치기
    const allLabelIds = [...formData.labelIds, ...newLabelIds]

    // 이슈 생성 API 호출 (라벨 ID 배열 통합해서 전달)
    const response = await axios.post('http://localhost:8080/issues', {
      title: formData.title,
      description: formData.description,
      assigneeId: formData.assigneeId,
      labels: allLabelIds,
    })

    if (response.data.success) {
      alert('이슈 생성 성공!')
      fetchIssues(currentPage.value)
    } else {
      alert('이슈 생성 실패')
    }
  } catch (e) {
    alert('서버 오류 발생')
    console.error(e)
  }
}

// 마운트 시 초기 데이터 로드
onMounted(() => {
  fetchIssues(0)
  fetchUsers()
  fetchLabels()
})
</script>

<template>
  <main >
    <h1>이슈 생성</h1>

    <!-- IssueForm에 사용자, 라벨 리스트 및 submit 이벤트 처리 함수 전달 -->
    <IssueForm
      :users="users"
      :labels="labels"
      @submit="handleIssueFormSubmit"
    />

    <!-- 라벨 관리 컴포넌트 추가 -->
    <LabelManager />

    <br /><br />

    <h1>이슈 목록</h1>

    <IssueFilter @filter="onFilter" />

    <IssueList :issues="issues" />

    <div class="pagination">
      <button
        v-for="pageNum in totalPages"
        :key="pageNum"
        @click="changePage(pageNum - 1)"
        :class="{ active: (pageNum - 1) === currentPage }"
      >
        {{ pageNum }}
      </button>
    </div>
  </main>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.pagination button {
  margin: 0 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  cursor: pointer;
}

.pagination button.active {
  font-weight: bold;
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
</style>
