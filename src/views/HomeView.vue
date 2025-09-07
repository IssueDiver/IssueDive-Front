<script setup lang="ts">
// src/views/HomeView.vue

import { ref, onMounted, computed, reactive } from 'vue'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useMock } from '@/config/mockConfig'
import { useRouter } from 'vue-router'
import IssueList from '@/components/IssueList.vue'
import IssueFilter from '@/components/IssueFilter.vue'
import type { Issue, IssueFormData, Page } from '@/types/issue'
import type { User, Label } from '@/types/index'

// 상태 변수 선언
const issues = ref<Issue[]>([])    // 이슈 리스트
const users = ref<User[]>([])      // 사용자 리스트
const labels = ref<Label[]>([])    // 라벨 리스트

// 페이지, 필터 변수
const currentPage = ref(0)
const totalPages = ref(0)
const pageSize = 6

// API 요청을 위한 파라미터를 하나의 반응형 객체로 관리
const apiParams = reactive({
  status: 'OPEN', // 기본값
  query: '',
  authorId: null as number | null,
  assigneeIds: [] as number[], 
  labelIds: [] as number[], 
  sortBy: 'createdAt',
  sortOrder: 'desc',
})

const authStore = useAuthStore() 
const router = useRouter()


/**
 * 이슈 목록 조회 함수
 */
const fetchIssues = async (page: number = 0) => {
  try {
    if (useMock) {
      // issues.value = await fetchMockIssues();
      // totalPages.value = 1;
      // currentPage.value = 0;
    } 
    else {
      const params: Record<string, any> = {
        page,
        size: pageSize,
        sort: apiParams.sortBy,
        order: apiParams.sortOrder,
      }
      // 값이 있는 필터만 파라미터에 추가
      if (apiParams.status) params.status = apiParams.status
      if (apiParams.query) params.query = apiParams.query
      if (apiParams.authorId) params.authorId = apiParams.authorId
      if (apiParams.assigneeIds.length > 0) params.assigneeIds = apiParams.assigneeIds // axios는 배열을 자동으로 ?assigneeIds=1&assigneeIds=2 형태로 변환해줍니다.
      if (apiParams.labelIds.length > 0) params.labelIds = apiParams.labelIds

      const response = await api.get<{ success: boolean; data: Page<Issue> }>('/issues', { params })

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
      // users.value = await fetchMockUsers();
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
      // labels.value = await fetchMockLabels();
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


// --- 이벤트 핸들러 변경점 ---

/**
 * IssueFilter에서 search 이벤트가 발생했을 때 호출될 핸들러
 */
const onSearch = (query: string) => {
  apiParams.query = query
  currentPage.value = 0
  fetchIssues(0)
}

// 디바운싱 로직이 포함된 onSearchInput 핸들러
let debounceTimer: number
const onSearchInput = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 0
    fetchIssues(0) // apiParams.query는 v-model을 통해 이미 최신 상태입니다.
  }, 500)
}


/**
 * 정렬 변경을 처리할 핸들러
 */
const onSort = (sortOptions: { sortBy: string; sortOrder: string }) => {
  apiParams.sortBy = sortOptions.sortBy
  apiParams.sortOrder = sortOptions.sortOrder
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

// 4. 통합 필터 적용 핸들러
const onApplyFilters = (filters: { view: string; status: string; labelId: number | null }) => {
  const loggedInUserId = authStore.user?.id

  // 필터 초기화
  apiParams.authorId = null
  apiParams.assigneeIds = [] // 빈 배열로 초기화

  // View 값에 따라 authorId 또는 assigneeIds 설정
  if (filters.view === 'CREATED_BY_ME') {
    apiParams.authorId = loggedInUserId || null
  } else if (filters.view === 'ASSIGNED_TO_ME') {
    // 로그인한 사용자의 ID를 배열에 담아 할당
    if (loggedInUserId) {
      apiParams.assigneeIds = [loggedInUserId]
    }
  }

  // Status와 LabelId 설정
  apiParams.status = filters.status
  // 단일 라벨 필터링의 경우, 배열에 담아서 할당
  apiParams.labelIds = filters.labelId ? [filters.labelId] : []

  // 필터 변경 시 첫 페이지부터 다시 조회
  currentPage.value = 0
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
    return issues.value.map(issue => ({
      ...issue,
      author: null,
      assignees: [], 
      labels: []
    }));
  }

  // 각 이슈에 대해 필요한 데이터를 조합
  return issues.value.map(issue => {
      // 작성자 ID에 해당하는 user 객체 찾기
      const author = users.value.find(user => user.id === issue.authorId) || null;

      // 담당자 ID '배열'을 순회하며 해당하는 user '배열'을 만들기
      const assignees = issue.assigneeIds
        .map(assigneeId => users.value.find(user => user.id === assigneeId))
        .filter(user => user !== undefined) as User[]; // filter로 undefined 제거

      // 라벨 ID 목록에 해당하는 label 객체들의 배열 만들기
      const issueLabels = issue.labelIds
        .map(labelId => labels.value.find(label => label.id === labelId))
        .filter(label => label !== undefined) as Label[];

      return {
        ...issue,        // 기존 이슈 데이터 복사
        author,          // 찾아낸 작성자 객체
        assignees,       // 찾아낸 담당자 '배열'
        labels: issueLabels, // 찾아낸 라벨 객체 배열 
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
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-gray-800">Issues</h1>
      <router-link
        :to="{ name: 'issue-create' }"
        class="flex-shrink-0 bg-green-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-green-700 transition"
      >
        New Issue
      </router-link>
    </div>

    <IssueFilter
      class="mb-4"
      :users="users"
      :labels="labels"
      @apply-filters="onApplyFilters"
      @sort="onSort"
    />

    <div class="relative flex-grow mb-4">
      <span class="absolute inset-y-0 left-0 flex items-center pl-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5 text-gray-500"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
      </span>
      <input 
        v-model="apiParams.query" 
        @input="onSearchInput"
        class="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none rounded-md" 
        placeholder="Search by title, author, label..." 
      />
    </div>

    <div class="bg-white border border-gray-200 rounded-lg">
       <IssueList :issues="enrichedIssues" />
    </div>

    <div class="pagination mt-6 flex justify-center items-center gap-2">
      <button
        v-if="currentPage > 0"
        @click="changePage(currentPage - 1)"
        class="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        &laquo; Previous
      </button>
      <button
        v-for="pageNum in totalPages"
        :key="pageNum - 1"
        @click="changePage(pageNum - 1)"
        :class="[
          'px-3 py-1 text-sm font-medium border rounded-md',
          currentPage === pageNum - 1
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        ]"
      >
        {{ pageNum }}
      </button>
      <button
        v-if="currentPage < totalPages - 1"
        @click="changePage(currentPage + 1)"
        class="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Next &raquo;
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 페이지네이션 스타일은 유지하거나 Tailwind로 변경 가능 */
.pagination button.active {
  background-color: #0969da;
  color: white;
  border-color: #0969da;
}
</style>