<script setup lang="ts">
// src/views/HomeView.vue

// Vue Composition API import
import { ref, onMounted, computed } from 'vue'
// axios import
import axios from 'axios'
import api from '@/api'

import { useMock } from '@/config/mockConfig'
import { useRouter } from 'vue-router'

// Import components
import IssueList from '@/components/IssueList.vue'
import IssueFilter from '@/components/IssueFilter.vue'
import IssueForm from '@/components/IssueForm.vue'
import LabelManager from '@/components/LabelManager.vue' // 라벨 관리 컴포넌트 임포트
import { getContrastingTextColor } from '@/utils/colors'; 

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
const statusFilter = ref('OPEN')
const searchQuery = ref('') 
const router = useRouter()
const authorFilter = ref<number | null>(null)
const assigneeFilter = ref<number | null>(null)
const labelFilter = ref<number | null>(null)

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
      if (statusFilter.value) params.status = statusFilter.value
      if (searchQuery.value) params.query = searchQuery.value
      if (authorFilter.value) params.authorId = authorFilter.value
      if (assigneeFilter.value) params.assigneeId = assigneeFilter.value
      if (labelFilter.value) params.labelIds = [labelFilter.value] 
      
      const response = await api.get<{ success: boolean; data: Page<Issue> }>(
        '/issues', // 기본 URL이 인스턴스에 설정되어 있음.
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
        const response = await api.get<{ success: boolean; data: User[] }>(
        '/auth/users'
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
      const response = await api.get<{ success: boolean; data: Label[] }>(
        '/labels'
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
 * IssueFilter에서 search 이벤트가 발생했을 때 호출될 핸들러
 */
const onSearch = (query: string) => {
  searchQuery.value = query
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

const onApplyFilters = (filters: { authorId: number | null; assigneeId: number | null; labelId: number | null }) => {
  authorFilter.value = filters.authorId
  assigneeFilter.value = filters.assigneeId
  labelFilter.value = filters.labelId
  currentPage.value = 0 // 필터 변경 시 첫 페이지로 이동
  fetchIssues(0)
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
          const res = await api.post('/labels', {
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
    const response = await api.post('/issues', {
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

// "데이터가 조합된" 새로운 이슈 목록을 생성하는 computed 속성
const enrichedIssues = computed(() => {
  // users와 labels 데이터가 아직 로드되지 않았다면 빈 배열 반환
  if (!users.value.length || !labels.value.length) {
    return []
  }

  // 각 이슈에 대해 필요한 데이터를 조합
  return issues.value.map(issue => {
    // 담당자 ID에 해당하는 user 객체 찾기
    const assignee = users.value.find(user => user.id === issue.assigneeId) || null;
    
    // 라벨 ID 목록에 해당하는 label 객체들의 배열 만들기
    const issueLabels = issue.labelIds
      .map(labelId => labels.value.find(label => label.id === labelId))
      .filter(label => label !== undefined) as Label[]; // filter로 undefined 제거

    return {
      ...issue, // 기존 이슈 데이터 복사
      assignee, // 찾아낸 담당자 객체 추가
      labels: issueLabels, // 찾아낸 라벨 객체 배열 추가
    }
  })
})

// 마운트 시 초기 데이터 로드
onMounted(() => {
  // 라벨과 유저 정보가 있어야 이슈 데이터를 조합할 수 있으므로 먼저 불러옵니다.
  Promise.all([
    fetchLabels(),
    fetchUsers()
  ]).then(() => {
    fetchIssues(0);
  });
})

// IssueForm으로 이동하는 함수
const go_to_new_issue_page = () => {
    // router.push({ name: 'issue-create' }); // '/issues/new' 같은 라우트 필요
    alert('새 이슈 생성 페이지로 이동합니다. (라우터 설정 필요)');
}

</script>
<template>
  <div>
    <div class="flex justify-between items-start mb-4 gap-4">
      <IssueFilter 
        class="flex-grow"
        :users="users" 
        :labels="labels"
        @filter="onFilter" 
        @search="onSearch"
        @apply-filters="onApplyFilters"
      />
      
      <router-link
        :to="{ name: 'issue-create' }"
        class="flex-shrink-0 bg-green-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-green-700 transition"
      >
        New Issue
      </router-link>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg">
       <IssueList :issues="enrichedIssues" />
    </div>

    <div class="pagination mt-6">
    </div>
  </div>
</template>

<style scoped>
/* 페이지네이션 스타일은 유지하거나 Tailwind로 변경 가능 */
.pagination button.active {
  background-color: #0969da; /* GitHub 파란색 */
  color: white;
  border-color: #0969da;
}
</style>