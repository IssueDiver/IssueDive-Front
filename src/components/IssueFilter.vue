<script setup lang="ts">
// IssueFilter.vue
/**
 * 검색창과 필터 버튼을 하나의 그룹으로 묶어 깃허브의 검색바와 유사하게 만들었습니다.
 * 선택된 필터 버튼에 bg-gray-100 클래스를 적용하여 활성화 상태를 시각적으로 표시합니다.
 */
import { ref } from 'vue'
import type { User, Label } from '@/types/index'

const props = defineProps<{
  users: User[]
  labels: Label[]
}>()

// 이벤트 선언, 'filter' 이벤트 발생 시 string 타입 값을 부모에 전달
const emit = defineEmits<{
  (e: 'filter', status: string): void
  (e: 'search', query: string): void
  (e: 'apply-filters', filters: { authorId: number | null; assigneeId: number | null; labelId: number | null }): void
  (e: 'sort', sortOptions: { sortBy: string; sortOrder: string }): void
}>()

const activeFilter = ref('OPEN')
const searchQuery = ref('')
// 각 드롭다운의 선택 값을 관리할 ref
const selectedAuthor = ref<number | null>(null)
const selectedAssignee = ref<number | null>(null)
const selectedLabel = ref<number | null>(null)
const selectedSort = ref('createdAt-desc') // 기본값
const sortOptions = ref([
  { value: 'createdAt-desc', text: 'Newest' },
  { value: 'createdAt-asc', text: 'Oldest' },
  { value: 'updatedAt-desc', text: 'Recently updated' },
  { value: 'comments-desc', text: 'Most commented' }, // (백엔드 구현 필요)
])

// 정렬 변경 시 부모에게 알리는 핸들러
const handleSortChange = () => {
  const [sortBy, sortOrder] = selectedSort.value.split('-')
  emit('sort', { sortBy, sortOrder })
}

// 버튼 클릭시 필터 상태를 부모에게 알림
const filterByStatus = (status: string) => {
  activeFilter.value = status
  emit('filter', status)
}

// 드롭다운 값이 변경될 때마다 모든 필터 값을 부모에게 전달하는 함수
const applyFilters = () => {
  emit('apply-filters', {
    authorId: selectedAuthor.value,
    assigneeId: selectedAssignee.value,
    labelId: selectedLabel.value,
  })
}

const handleSearch = () => {
    emit('search', searchQuery.value)
}

// 디바운싱을 위한 타이머 변수
let debounceTimer: number;
/**
 * 검색어가 입력될 때마다 호출되는 함수
 */
const onSearchInput = () => {
  // 1. 이전에 설정된 타이머가 있다면 취소합니다. (버스가 출발하기 전에 사람이 또 탄 경우)
  clearTimeout(debounceTimer);

  // 2. 500밀리초(0.5초) 후에 검색 이벤트를 실행하도록 새로운 타이머를 설정합니다.
  debounceTimer = setTimeout(() => {
    emit('search', searchQuery.value);
  }, 500);
}
</script>

<template>
  <div class="w-full flex flex-col gap-y-3">
    <!-- 1. 검색창 -->
    <div class="relative flex-grow">
      <span class="absolute inset-y-0 left-0 flex items-center pl-3">
        <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
      </span>
      <input 
        v-model="searchQuery" 
        @input="onSearchInput"
        class="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none rounded-md" 
        placeholder="Search or jump to a title, author, or label..." 
      />
    </div>

    <!-- 2. 필터 및 정렬 영역 -->
    <!-- justify-between을 추가하여 왼쪽 필터와 오른쪽 정렬을 양 끝으로 분리합니다. -->
    <div class="flex items-center justify-between gap-2">
      <!-- 2-1. 왼쪽: 모든 필터 그룹 -->
      <div class="flex items-center gap-2">
        <!-- 상태 필터 버튼 -->
        <div class="flex-shrink-0 flex items-center border border-gray-300 rounded-md bg-white">
          <div class="flex">
            <button @click="filterByStatus('')" :class="['px-3 py-1 text-sm font-medium border-r', activeFilter === '' ? 'bg-gray-100' : '']" class="rounded-l-md">All</button>
            <button @click="filterByStatus('OPEN')" :class="['px-3 py-1 text-sm font-medium border-r', activeFilter === 'OPEN' ? 'bg-gray-100' : '']">Open</button>
            <button @click="filterByStatus('IN_PROGRESS')" :class="['px-3 py-1 text-sm font-medium border-r', activeFilter === 'IN_PROGRESS' ? 'bg-gray-100' : '']">In Progress</button>
            <button @click="filterByStatus('CLOSED')" :class="['px-3 py-1 text-sm font-medium', activeFilter === 'CLOSED' ? 'bg-gray-100' : '']" class="rounded-r-md">Closed</button>
          </div>
        </div>
        
        <!-- 상세 필터 드롭다운 -->
        <div class="flex-shrink-0 flex items-center gap-2">
          <select v-model="selectedAuthor" @change="applyFilters" class="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white">
            <option :value="null">Author</option>
            <option v-for="user in users" :key="user.id" :value="user.id">{{ user.username }}</option>
          </select>
          <select v-model="selectedAssignee" @change="applyFilters" class="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white">
            <option :value="null">Assignee</option>
            <option v-for="user in users" :key="user.id" :value="user.id">{{ user.username }}</option>
          </select>
          <select v-model="selectedLabel" @change="applyFilters" class="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white">
            <option :value="null">Label</option>
            <option v-for="label in labels" :key="label.id" :value="label.id">{{ label.name }}</option>
          </select>
        </div>
      </div>

      <!-- 2-2. 오른쪽: 새로 추가된 정렬 드롭다운 -->
      <div class="flex-shrink-0">
        <select 
          v-model="selectedSort" 
          @change="handleSortChange" 
          class="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white"
        >
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">
            {{ option.text }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>