<script setup lang="ts">
// IssueListItem.vue
// 타입 임포트
import type { Issue } from '@/types/issue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 부모 컴포넌트로부터 issue 객체를 받음
const props = defineProps<{ issue: Issue }>()

// 클릭 시 상세 페이지로 네비게이션 함수
const gotoDetail = () => {
  router.push({ name: 'issue-detail', params: { id: String(props.issue.id) } })
}
</script>

<template>
  <li class="issue-item" @click="gotoDetail" style="cursor: pointer;">
    <div class="item-details">
      <span class="status">{{ issue.status }}</span>
      <span class="title">{{ issue.title }}</span>
    </div>
    <div class="item-meta">
      <span>created at {{ new Date(issue.createdAt).toLocaleDateString() }}</span>
    </div>
  </li>
</template>
