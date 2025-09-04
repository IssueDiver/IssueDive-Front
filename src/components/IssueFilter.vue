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
}>()

const activeFilter = ref('OPEN')
const searchQuery = ref('')
// 각 드롭다운의 선택 값을 관리할 ref
const selectedAuthor = ref<number | null>(null)
const selectedAssignee = ref<number | null>(null)
const selectedLabel = ref<number | null>(null)

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
    <div class="relative flex-grow">
      <span class="absolute inset-y-0 left-0 flex items-center pl-3">
        <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
      </span>
      <input 
        v-model="searchQuery" 
        @input="onSearchInput"
        class="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none rounded-md" 
        placeholder="Search or jump to..." 
      />
    </div>

    <div class="flex items-center gap-2">
      <div class="flex-shrink-0 flex items-center border border-gray-300 rounded-md bg-white">
        <div class="flex">
          <button @click="filterByStatus('')" :class="['px-3 py-1 text-sm font-medium border-r', activeFilter === '' ? 'bg-gray-100' : '']" class="rounded-l-md">All</button>
          <button @click="filterByStatus('OPEN')" :class="['px-3 py-1 text-sm font-medium border-r', activeFilter === 'OPEN' ? 'bg-gray-100' : '']">Open</button>
          <button @click="filterByStatus('CLOSED')" :class="['px-3 py-1 text-sm font-medium', activeFilter === 'CLOSED' ? 'bg-gray-100' : '']" class="rounded-r-md">Closed</button>
        </div>
      </div>
      
      <div class="flex-shrink-0 flex items-center gap-2">
        <select v-model="selectedAuthor" @change="applyFilters" class="border border-gray-300 rounded-md px-2 py-1 text-sm">
          <option :value="null">Author</option>
          <option v-for="user in users" :key="user.id" :value="user.id">{{ user.username }}</option>
        </select>
        <select v-model="selectedAssignee" @change="applyFilters" class="border border-gray-300 rounded-md px-2 py-1 text-sm">
          <option :value="null">Assignee</option>
          <option v-for="user in users" :key="user.id" :value="user.id">{{ user.username }}</option>
        </select>
        <select v-model="selectedLabel" @change="applyFilters" class="border border-gray-300 rounded-md px-2 py-1 text-sm">
          <option :value="null">Label</option>
          <option v-for="label in labels" :key="label.id" :value="label.id">{{ label.name }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<!-- <template>
  <div class="flex items-center gap-2 w-full">
    <div class="flex-shrink-0 flex items-center border border-gray-300 rounded-md bg-white">
      <div class="flex">
        <button 
          @click="filterByStatus('')" 
          :class="['px-4 py-2 text-sm font-medium border-r border-gray-300', activeFilter === '' ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50']"
          class="rounded-l-md"
        >
          All
        </button>
        <button 
          @click="filterByStatus('OPEN')" 
          :class="['px-4 py-2 text-sm font-medium border-r border-gray-300', activeFilter === 'OPEN' ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50']"
        >
          Open
        </button>
        <button 
          @click="filterByStatus('CLOSED')" 
          :class="['px-4 py-2 text-sm font-medium', activeFilter === 'CLOSED' ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50']"
          class="rounded-r-md"
        >
          Closed
        </button>
      </div>
    </div>
    
    <div class="flex-shrink-0 flex items-center gap-2">
      <select v-model="selectedAuthor" @change="applyFilters" class="border border-gray-300 rounded-md px-2 py-2 text-sm">
        <option :value="null">Author</option>
        <option v-for="user in users" :key="user.id" :value="user.id">
          {{ user.username }}
        </option>
      </select>

      <select v-model="selectedAssignee" @change="applyFilters" class="border border-gray-300 rounded-md px-2 py-2 text-sm">
        <option :value="null">Assignee</option>
        <option v-for="user in users" :key="user.id" :value="user.id">
          {{ user.username }}
        </option>
      </select>
      
      <select v-model="selectedLabel" @change="applyFilters" class="border border-gray-300 rounded-md px-2 py-2 text-sm">
        <option :value="null">Label</option>
        <option v-for="label in labels" :key="label.id" :value="label.id">
          {{ label.name }}
        </option>
      </select>
    </div>

    <div class="relative flex-grow">
      <span class="absolute inset-y-0 left-0 flex items-center pl-3">
        <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
      </span>
      <input 
        v-model="searchQuery" 
        @input="onSearchInput"
        class="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none rounded-md" 
        placeholder="Search issues..." 
      />
    </div>
  </div>
</template> -->