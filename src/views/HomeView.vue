<script setup lang="ts">
// src/views/HomeView.vue

import { ref, onMounted, computed, reactive } from 'vue'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import IssueList from '@/components/IssueList.vue'
import IssueFilter from '@/components/IssueFilter.vue'
import type { Issue, Page } from '@/types/issue'
import type { User, Label } from '@/types/index'

const issues = ref<Issue[]>([])
const users = ref<User[]>([])
const labels = ref<Label[]>([])
const currentPage = ref(0)
const totalPages = ref(0)
const pageSize = 6

const apiParams = reactive({
  status: 'OPEN',
  query: '',
  authorId: null as number | null,
  assigneeIds: [] as number[], 
  labelIds: [] as number[], 
  sortBy: 'createdAt',
  sortOrder: 'desc',
})

const authStore = useAuthStore() 
const router = useRouter()


const fetchIssues = async (page: number = 0) => {
  try {
    const params: Record<string, any> = {
      page,
      size: pageSize,
      sort: apiParams.sortBy,
      order: apiParams.sortOrder,
    }
    if (apiParams.status) params.status = apiParams.status
    if (apiParams.query) params.query = apiParams.query
    if (apiParams.authorId) params.authorId = apiParams.authorId
    if (apiParams.assigneeIds.length > 0) params.assigneeIds = apiParams.assigneeIds
    if (apiParams.labelIds.length > 0) params.labelIds = apiParams.labelIds

    const response = await api.get<{ success: boolean; data: Page<Issue> }>('/api/issues', { params })

    if (response.data.success) {
      const pageData = response.data.data
      issues.value = pageData.content
      totalPages.value = pageData.totalPages
      currentPage.value = pageData.number
    }
  } catch (error) {
    console.error('이슈 목록 불러오기 실패:', error)
  }
}

const fetchUsers = async () => {
  try {
    const response = await api.get<{ success: boolean; data: User[] }>('/api/auth/users')
    if (response.data.success) users.value = response.data.data
  } catch (error) { console.error('사용자 목록 불러오기 실패:', error) }
};

const fetchLabels = async () => {
  try {
    const response = await api.get<{ success: boolean; data: Label[] }>('/api/labels');
    if (response.data.success) labels.value = response.data.data;
  } catch (error) { console.error('라벨 목록 불러오기 실패:', error); }
};

let debounceTimer: number
const onSearchInput = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 0
    fetchIssues(0)
  }, 500)
}

const onSort = (sortOptions: { sortBy: string; sortOrder: string }) => {
  apiParams.sortBy = sortOptions.sortBy
  apiParams.sortOrder = sortOptions.sortOrder
  fetchIssues(0)
}

const changePage = (pageNum: number) => {
  if (pageNum === currentPage.value) return
  currentPage.value = pageNum
  fetchIssues(pageNum)
}

// [수정] IssueFilter에서 오는 이벤트 핸들러를 단순화합니다.
const onApplyFilters = (filters: { authorId: number | null, assigneeId: number | null, labelId: number | null }) => {
  apiParams.authorId = filters.authorId;
  apiParams.assigneeIds = filters.assigneeId ? [filters.assigneeId] : [];
  apiParams.labelIds = filters.labelId ? [filters.labelId] : [];
  
  currentPage.value = 0
  fetchIssues(0)
}

// [수정] 상태 필터 버튼 클릭 핸들러 (세 가지 상태 모두 처리)
const onStatusFilter = (status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') => {
    apiParams.status = status;
    currentPage.value = 0;
    fetchIssues(0);
}

const enrichedIssues = computed(() => {
  if (!users.value.length || !labels.value.length) {
    return issues.value.map(issue => ({ ...issue, author: null, assignees: [], labels: [] }));
  }
  return issues.value.map(issue => {
      const author = users.value.find(user => user.id === issue.authorId) || null;
      const assignees = issue.assigneeIds
        .map(assigneeId => users.value.find(user => user.id === assigneeId))
        .filter(user => user !== undefined) as User[];
      const issueLabels = issue.labelIds
        .map(labelId => labels.value.find(label => label.id === labelId))
        .filter(label => label !== undefined) as Label[];
      return { ...issue, author, assignees, labels: issueLabels }
    })
  })

onMounted(() => {
  Promise.all([
    fetchLabels(),
    fetchUsers()
  ]).then(() => {
    fetchIssues(0);
  });
})
</script>

<template>
  <div>
    <!-- 1. 페이지 제목과 'New Issue' 버튼 (기존과 동일) -->
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-gray-800">Issues</h1>
      <router-link
        :to="{ name: 'issue-create' }"
        class="flex-shrink-0 bg-green-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-green-700 transition"
      >
        New Issue
      </router-link>
    </div>

    <!-- 2. 검색창 (필터 위로 이동) -->
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

    <!-- 3. 필터와 이슈 목록을 담는 통합 컨테이너 -->
    <div class="bg-white border border-gray-200 rounded-lg">
      <!-- 3-1. 필터 헤더 -->
      <div class="px-4 py-3 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <!-- 상태 필터 (Open / In Progress / Closed) -->
          <div class="flex items-center gap-4">
              <button @click="onStatusFilter('OPEN')" class="flex items-center gap-2 font-semibold" :class="apiParams.status === 'OPEN' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'">
                  Open
              </button>
               <button @click="onStatusFilter('IN_PROGRESS')" class="flex items-center gap-2 font-semibold" :class="apiParams.status === 'IN_PROGRESS' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'">
                  In Progress
              </button>
              <button @click="onStatusFilter('CLOSED')" class="flex items-center gap-2 font-semibold" :class="apiParams.status === 'CLOSED' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'">
                  Closed
              </button>
          </div>
          <!-- 드롭다운 필터 -->
          <IssueFilter
            :users="users"
            :labels="labels"
            @apply-filters="onApplyFilters"
            @sort="onSort"
          />
      </div>
      <!-- 3-2. 이슈 목록 -->
      <IssueList :issues="enrichedIssues" />
    </div>

    <!-- 페이지네이션 -->
    <div class="pagination mt-6 flex justify-center items-center gap-2">
      <button v-if="currentPage > 0" @click="changePage(currentPage - 1)" class="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">&laquo; Previous</button>
      <button v-for="pageNum in totalPages" :key="pageNum - 1" @click="changePage(pageNum - 1)" :class="['px-3 py-1 text-sm font-medium border rounded-md', currentPage === pageNum - 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50']">{{ pageNum }}</button>
      <button v-if="currentPage < totalPages - 1" @click="changePage(currentPage + 1)" class="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Next &raquo;</button>
    </div>
  </div>
</template>

<style scoped>
.pagination button.active {
  background-color: #0969da;
  color: white;
  border-color: #0969da;
}
</style>

