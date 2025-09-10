<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick, reactive } from 'vue'
import type { User, Label } from '@/types/index'

defineProps<{ users: User[], labels: Label[] }>()

const emit = defineEmits<{
  (e: 'apply-filters', filters: { authorId: number | null, assigneeId: number | null, labelId: number | null }): void
  (e: 'sort', sortOptions: { sortBy: string; sortOrder: string }): void
}>()

const activeDropdown = ref<string | null>(null);
const dropdownContainer = ref<HTMLElement | null>(null);

const selectedFilters = reactive({
    authorId: null as number | null,
    assigneeId: null as number | null,
    labelId: null as number | null,
});

const sortOptions = [
    { text: 'Newest', value: 'createdAt-desc' },
    { text: 'Oldest', value: 'createdAt-asc' },
    { text: 'Most commented', value: 'commentCount-desc' },
    { text: 'Recently updated', value: 'updatedAt-desc' },
];
const selectedSort = ref(sortOptions[0]); // 기본값: Newest

const toggleDropdown = (name: string) => {
  activeDropdown.value = activeDropdown.value === name ? null : name
}

const selectFilter = (type: 'authorId' | 'assigneeId' | 'labelId', id: number | null) => {
    (selectedFilters as any)[type] = id;
    activeDropdown.value = null;
}

const selectSort = (option: { text: string; value: string }) => {
    selectedSort.value = option;
    activeDropdown.value = null; // 드롭다운 닫기
    const [sortBy, sortOrder] = option.value.split('-');
    emit('sort', { sortBy, sortOrder }); // 부모 컴포넌트로 이벤트 발생
}

watch(selectedFilters, (newFilters) => {
    emit('apply-filters', {
        authorId: newFilters.authorId,
        assigneeId: newFilters.assigneeId,
        labelId: newFilters.labelId,
    });
}, { deep: true });

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
    activeDropdown.value = null
  }
}

watch(activeDropdown, (isOpen) => {
  if (isOpen) {
    nextTick(() => document.addEventListener('mousedown', handleClickOutside))
  } else {
    document.removeEventListener('mousedown', handleClickOutside)
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

</script>
<template>
  <div class="flex items-center gap-4" ref="dropdownContainer">
    <!-- 드롭다운 필터 그룹 -->
    <div class="flex items-center gap-4">
      <!-- Author Filter -->
      <div class="relative">
        <button @click="toggleDropdown('author')" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
          Author
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
        </button>
        <div v-if="activeDropdown === 'author'" class="absolute z-10 mt-2 w-36 origin-top-right right-0 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <ul class="py-1 text-right">
            <li @click="selectFilter('authorId', null)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Any Author</li>
            <li v-for="user in users" :key="user.id" @click="selectFilter('authorId', user.id)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">{{ user.username }}</li>
          </ul>
        </div>
      </div>
      <!-- Label Filter -->
      <div class="relative">
        <button @click="toggleDropdown('label')" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
          Label
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
        </button>
        <div v-if="activeDropdown === 'label'" class="absolute z-10 mt-2 w-36 origin-top-right right-0 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <ul class="py-1 text-right">
            <li @click="selectFilter('labelId', null)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Any Label</li>
            <li v-for="label in labels" :key="label.id" @click="selectFilter('labelId', label.id)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">{{ label.name }}</li>
          </ul>
        </div>
      </div>
      <!-- Assignee Filter -->
      <div class="relative">
        <button @click="toggleDropdown('assignee')" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
          Assignee
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
        </button>
        <div v-if="activeDropdown === 'assignee'" class="absolute z-10 mt-2 w-36 origin-top-right right-0 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <ul class="py-1 text-right">
            <li @click="selectFilter('assigneeId', null)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Any Assignee</li>
            <li v-for="user in users" :key="user.id" @click="selectFilter('assigneeId', user.id)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">{{ user.username }}</li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- Sort Filter -->
    <div class="relative">
      <button @click="toggleDropdown('sort')" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
        Sort
        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
      </button>
      <div v-if="activeDropdown === 'sort'" class="absolute z-10 mt-2 w-38 origin-top-right right-0 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
        <ul class="py-1 text-right">
          <li v-for="option in sortOptions" :key="option.value" @click="selectSort(option)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
            {{ option.text }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

