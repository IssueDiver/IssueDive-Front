<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { User, Label } from '@/types/index'

// --- Props & Emits 정의 (기존과 유사) ---
defineProps<{
  users: User[]
  labels: Label[]
}>()

const emit = defineEmits<{
  // (e: 'search', query: string): void
  (
    e: 'apply-filters',
    filters: {
      view: string
      status: string
      labelId: number | null
    }
  ): void
  (e: 'sort', sortOptions: { sortBy: string; sortOrder: string }): void
}>()

// --- 상태(State) 관리 변경점 ---
// 1. View, Status, Label 필터를 하나의 반응형 객체로 통합하여 관리합니다.
const filters = reactive({
  view: 'ALL', // 'ALL', 'CREATED_BY_ME', 'ASSIGNED_TO_ME'
  status: 'OPEN', // '', 'OPEN', 'IN_PROGRESS', 'CLOSED'
  labelId: null as number | null,
})

// 2. 검색, 정렬, 드롭다운 UI를 위한 상태
const searchQuery = ref('')
const selectedSort = ref('createdAt-desc')
const isFilterDropdownOpen = ref(false) // Filters 드롭다운 열림/닫힘 상태

// 드롭다운 컨테이너를 참조할 ref
const filterDropdownRef = ref<HTMLElement | null>(null)

const sortOptions = ref([
  { value: 'createdAt-desc', text: 'Newest' },
  { value: 'createdAt-asc', text: 'Oldest' },
  { value: 'updatedAt-desc', text: 'Recently updated' },
  { value: 'comments-desc', text: 'Most commented' },
])

// 외부 클릭을 감지하는 핸들러 
const handleClickOutside = (event: MouseEvent) => {
  // 클릭된 요소가 드롭다운 컨테이너 내부에 포함되어 있지 않다면,
  if (filterDropdownRef.value && !filterDropdownRef.value.contains(event.target as Node)) {
    // 드롭다운을 닫습니다.
    isFilterDropdownOpen.value = false
  }
}

// 드롭다운의 열림/닫힘 상태를 감지(watch)하여 이벤트 리스너를 추가/제거합니다.
watch(isFilterDropdownOpen, (isOpen) => {
  if (isOpen) {
    // 드롭다운이 열릴 때, document에 클릭 이벤트 리스너를 추가합니다.
    // nextTick을 사용하여 현재 클릭 이벤트가 버블링된 후 리스너를 추가하도록 합니다.
    nextTick(() => {
      document.addEventListener('mousedown', handleClickOutside)
    })
  } else {
    // 드롭다운이 닫힐 때, 리스너를 제거합니다.
    document.removeEventListener('mousedown', handleClickOutside)
  }
})

// 컴포넌트가 언마운트될 때 만약을 위해 리스너를 한번 더 제거합니다 (메모리 누수 방지).
onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

// 1. 필터 객체가 변경될 때마다 'apply-filters' 이벤트를 emit합니다.
watch(
  filters,
  (newFilters) => {
    isFilterDropdownOpen.value = false // 필터 변경 시 드롭다운 닫기
    emit('apply-filters', newFilters)
  },
  { deep: true } // 객체 내부의 변경을 감지
)

// 2. 정렬 변경 핸들러 (기존과 동일)
const handleSortChange = () => {
  const [sortBy, sortOrder] = selectedSort.value.split('-')
  emit('sort', { sortBy, sortOrder })
}

// // 3. 검색 입력 핸들러 (기존과 동일, 디바운싱)
// let debounceTimer: number
// const onSearchInput = () => {
//   clearTimeout(debounceTimer)
//   debounceTimer = setTimeout(() => {
//     emit('search', searchQuery.value)
//   }, 500)
// }

// 4. View 필터 선택 핸들러
const selectView = (view: 'ALL' | 'CREATED_BY_ME' | 'ASSIGNED_TO_ME') => {
  filters.view = view
}

// 5. 드롭다운 내 필터 초기화 핸들러
const clearSubFilters = () => {
  filters.status = ''
  filters.labelId = null
}

</script>
<template>
  <div class="w-full flex flex-col gap-y-3">
    <!-- <div class="relative flex-grow">
      <span class="absolute inset-y-0 left-0 flex items-center pl-3">
        <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
      </span>
      <input 
        v-model="searchQuery" 
        @input="onSearchInput"
        class="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none rounded-md" 
        placeholder="Search by title, author, label..." 
      />
    </div> -->
    
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex-shrink-0 flex items-center border border-gray-300 rounded-md bg-white text-sm font-medium">
          <button @click="selectView('ALL')" :class="['px-3 py-1.5 rounded-l-md', filters.view === 'ALL' ? 'bg-gray-100' : '']">All</button>
          <button @click="selectView('CREATED_BY_ME')" :class="['px-3 py-1.5 border-l', filters.view === 'CREATED_BY_ME' ? 'bg-gray-100' : '']">Created by me</button>
          <button @click="selectView('ASSIGNED_TO_ME')" :class="['px-3 py-1.5 border-l rounded-r-md', filters.view === 'ASSIGNED_TO_ME' ? 'bg-gray-100' : '']">Assigned to me</button>
        </div>
      </div>

      <div class="flex-shrink-0 flex items-center gap-2">
        <div class="flex items-center gap-2">
          <label for="sort-select" class="text-sm font-medium text-gray-700">Sort by:</label>
          <select id="sort-select" v-model="selectedSort" @change="handleSortChange" class="border border-gray-300 rounded-md pl-2 pr-8 py-1.5 text-sm bg-white">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.text }}</option>
          </select>
        </div>

        <div class="relative" ref="filterDropdownRef">
          <button
            @click="isFilterDropdownOpen = !isFilterDropdownOpen"
            class="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-sm font-medium hover:bg-gray-50 flex items-center gap-1"
          >
            Filters
            <svg class="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
           <div v-if="isFilterDropdownOpen" class="absolute z-10 mt-2 w-64 origin-top-right right-0 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div class="py-1">
              <div class="flex justify-between items-center px-4 py-2">
                 <h3 class="text-sm font-semibold text-gray-700">Filter by</h3>
                 <button @click="clearSubFilters" class="text-sm text-blue-600 hover:underline">Clear all</button>
              </div>
              <div class="border-t border-gray-200 px-4 py-3">
                <p class="text-xs font-semibold text-gray-500 mb-2">Status</p>
                <div class="space-y-2">
                    <label class="flex items-center text-sm"><input type="radio" v-model="filters.status" value="" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"><span class="ml-2 text-gray-700">All</span></label>
                    <label class="flex items-center text-sm"><input type="radio" v-model="filters.status" value="OPEN" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"><span class="ml-2 text-gray-700">Open</span></label>
                    <label class="flex items-center text-sm"><input type="radio" v-model="filters.status" value="IN_PROGRESS" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"><span class="ml-2 text-gray-700">In Progress</span></label>
                    <label class="flex items-center text-sm"><input type="radio" v-model="filters.status" value="CLOSED" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"><span class="ml-2 text-gray-700">Closed</span></label>
                </div>
              </div>
              <div class="border-t border-gray-200 px-4 py-3">
                <p class="text-xs font-semibold text-gray-500 mb-2">Label</p>
                <div class="space-y-2">
                    <label class="flex items-center text-sm"><input type="radio" v-model="filters.labelId" :value="null" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"><span class="ml-2 text-gray-700">Any</span></label>
                    <label v-for="label in labels" :key="label.id" class="flex items-center text-sm"><input type="radio" v-model="filters.labelId" :value="label.id" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"><span class="ml-2 text-gray-700">{{ label.name }}</span></label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>