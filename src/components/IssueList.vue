<script setup lang="ts">
// IssueList.vue
  // IssueListItem 컴포넌트를 불러옵니다.
  import IssueListItem from './IssueListItem.vue'
  import type { Issue } from '@/types/issue' // @는 src 폴더를 가리키는 별칭입니다.

// 부모 컴포넌트로부터 'issues'라는 이름의 데이터를 받겠다고 정의합니다.
defineProps<{
  issues: Issue[]
}>()
</script>

<template>
  <ul>
    <IssueListItem
      v-for="issue in issues"
      :key="issue.id"
      :issue="issue" 
    />
  </ul>
</template>

<style scoped>
/* 이 컴포넌트에서만 사용할 스타일 */
ul {
  list-style: none;
  padding: 0;
}
</style>