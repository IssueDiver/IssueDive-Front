<script setup lang="ts">
// IssueFilter.vue
/**
 * 검색창과 필터 버튼을 하나의 그룹으로 묶어 깃허브의 검색바와 유사하게 만들었습니다.
 * 선택된 필터 버튼에 bg-gray-100 클래스를 적용하여 활성화 상태를 시각적으로 표시합니다.
 */
import { ref } from 'vue'

// 이벤트 선언, 'filter' 이벤트 발생 시 string 타입 값을 부모에 전달
const emit = defineEmits<{
  (e: 'filter', status: string): void
  (e: 'search', query: string): void
}>()

const activeFilter = ref('OPEN')
const searchQuery = ref('')

// 버튼 클릭시 필터 상태를 부모에게 알림
const filterByStatus = (status: string) => {
  activeFilter.value = status
  emit('filter', status)
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
  <div class="flex items-center border border-gray-300 rounded-md bg-white">
    <div class="flex">
      <button @click="filterByStatus('OPEN')" 
              :class="['px-4 py-2 text-sm font-medium border-r border-gray-300', activeFilter === 'OPEN' ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50']"
              class="rounded-l-md">
        Open
      </button>
      <button @click="filterByStatus('CLOSED')" 
              :class="['px-4 py-2 text-sm font-medium', activeFilter === 'CLOSED' ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50']">
        Closed
      </button>
    </div>
    <div class="relative flex-grow">
      <span class="absolute inset-y-0 left-0 flex items-center pl-3">
        <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
      </span>
      <input 
        v-model="searchQuery" 
        @input="onSearchInput"
        class="w-full pl-10 pr-4 py-2 border-l border-gray-300 focus:outline-none rounded-r-md" 
        placeholder="Search issues by title" 
      />
    </div>
  </div>
</template>