<script setup lang="ts">
import type { Issue } from '@/types/issue'
import { useRouter, useRoute } from 'vue-router'
import type { Label, User } from '@/types'
import { getContrastingTextColor } from '@/utils/colors'; 

const router = useRouter()
const route = useRoute()

const props = defineProps<{ 
  issue: Issue & {
    author: User | null; 
    assignees: User[];
    labels: Label[];
  }
}>()

const gotoDetail = () => {
  router.push({ 
    name: 'issue-detail', 
    params: { id: String(props.issue.id) },
    query: route.query 
  })
}

const formatDate = (dateString: string) => {
  // dateString이 유효하지 않으면 빈 문자열을 반환하여 에러를 방지합니다.
  if (!dateString) return 'a while ago';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'invalid date';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}. ${month}. ${day}.`;
}
</script>

<template>
  <li @click="gotoDetail" 
      class="flex items-start px-4 py-3 border-t border-gray-200 hover:bg-gray-50 cursor-pointer">
    <div class="pr-4 pt-1">
      <!-- 이슈 상태 아이콘 -->
      <svg v-if="issue.status === 'OPEN'" class="w-5 h-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1 -18 0a9 9 0 0 1 18 0Z" /></svg>
      <svg v-else-if="issue.status === 'IN_PROGRESS'" class="w-5 h-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
      <svg v-else class="w-5 h-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
    </div>

    <div class="flex-grow">
      <div class="flex items-center">
        <a class="font-semibold text-gray-800 hover:text-blue-600">{{ issue.title }}</a>
        <span v-for="label in issue.labels" :key="label.id"
              :style="{ backgroundColor: label.color, color: getContrastingTextColor(label.color) }" 
              class="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full">
          {{ label.name }}
        </span>
      </div>
      <div class="text-xs text-gray-500 mt-1">
        #{{ issue.id }} opened on {{ formatDate(issue.createdAt) }} by {{ issue.author?.username || 'unknown' }}
      </div>
    </div>

    <div v-if="issue.assignees.length > 0" class="flex-shrink-0 ml-4 flex items-center -space-x-2">
      <img v-for="assignee in issue.assignees" :key="assignee.id" 
           :src="`https://i.pravatar.cc/24?u=${assignee.id}`" 
           :alt="assignee.username"
           class="w-6 h-6 rounded-full border-2 border-white"
           :title="assignee.username">
    </div>
  </li>
</template>
