<script setup lang="ts">
// src/components/IssueListItem.vue
// 타입 임포트
import type { Issue } from '@/types/issue'
import { useRouter, useRoute } from 'vue-router'
import type { Label, User } from '@/types'
import { getContrastingTextColor } from '@/utils/colors'; 

const router = useRouter()
const route = useRoute()

// 부모 컴포넌트로부터 issue 객체를 받음
// Props 정의를 HomeView에서 보내주는 'enriched' 데이터 구조와 일치
const props = defineProps<{ 
  issue: Issue & { // Issue 타입에 author, assignee, labels 객체를 추가
    author: User | null; 
    assignees: User[];
    labels: Label[];
  }
}>()

// const labels = props.issue.labelIds || [];
// const assignee = props.issue.assigneeId || null;

// 클릭 시 상세 페이지로 네비게이션 함수
const gotoDetail = () => {
  router.push({ 
    name: 'issue-detail', 
    params: { id: String(props.issue.id) },
    query: route.query 
  })
}
</script>

<template>
  <li @click="gotoDetail" 
      class="flex items-start px-4 py-3 border-t border-gray-200 hover:bg-gray-50 cursor-pointer">
    <div class="pr-4 pt-1">
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
        #{{ issue.id }} opened on {{ new Date(issue.createdAt).toLocaleDateString() }} by {{ issue.author?.username || 'unknown' }}
      </div>
    </div>

    <!-- 담당자가 한 명 이상일 때만 컨테이너를 보여줍니다. -->
    <div v-if="issue.assignees.length > 0" class="flex-shrink-0 ml-4 flex items-center -space-x-2">
      <!-- v-for를 사용해 담당자 목록을 순회하며 이미지를 렌더링합니다. -->
      <img 
        v-for="assignee in issue.assignees" 
        :key="assignee.id"
        :src="`https://i.pravatar.cc/24?u=${assignee.id}`" 
        :alt="assignee.username" 
        class="h-6 w-6 rounded-full border-2 border-white"
        :title="`Assigned to ${assignee.username}`"
      >
    </div>
  </li>
</template>