<script setup lang="ts">
// src/components/IssueListItem.vue
// 타입 임포트
import type { Issue } from '@/types/issue'
import { useRouter } from 'vue-router'
import type { Label, User } from '@/types'
import { getContrastingTextColor } from '@/utils/colors'; 

const router = useRouter()

// 부모 컴포넌트로부터 issue 객체를 받음
const props = defineProps<{ 
  issue: Issue & { // Issue 타입에 assignee와 labels를 추가
    assignee: User | null;
    labels: Label[];
  }
}>()

const labels = props.issue.labelIds || [];
const assignee = props.issue.assigneeId || null;

// 클릭 시 상세 페이지로 네비게이션 함수
const gotoDetail = () => {
  router.push({ name: 'issue-detail', params: { id: String(props.issue.id) } })
}
</script>

<template>
  <li @click="gotoDetail" 
      class="flex items-start px-4 py-3 border-t border-gray-200 hover:bg-gray-50 cursor-pointer">
    <div class="pr-4 pt-1">
      <svg v-if="issue.status === 'OPEN'" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <svg v-else class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>

    <div class="flex-grow">
      <div class="flex items-center">
        <a class="font-semibold text-gray-800 hover:text-blue-600">{{ issue.title }}</a>
        <span v-for="label in labels" :key="label.id"
              :style="{ backgroundColor: label.color, color: getContrastingTextColor(label.color) }" 
              class="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full">
          {{ label.name }}
        </span>
      </div>
      <div class="text-xs text-gray-500 mt-1">
        #{{ issue.id }} opened on {{ new Date(issue.createdAt).toLocaleDateString() }} by {{ issue.author?.username || 'unknown' }}
      </div>
    </div>

    <div v-if="assignee" class="flex-shrink-0 ml-4">
      <img :src="`https://i.pravatar.cc/24?u=${assignee.id}`" 
           :alt="assignee.username" 
           class="h-6 w-6 rounded-full"
           :title="`Assigned to ${assignee.username}`">
    </div>
  </li>
</template>