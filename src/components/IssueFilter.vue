<script setup lang="ts">
// IssueFilter.vue

// 이벤트 선언, 'filter' 이벤트 발생 시 string 타입 값을 부모에 전달
const emit = defineEmits<{
  (e: 'filter', status: string): void
}>()

// 버튼 클릭시 필터 상태를 부모에게 알림
const filterByStatus = (status: string) => {
  emit('filter', status)
}
</script>

<template>
  <div>
    <button @click="filterByStatus('OPEN')">Open</button>
    <button @click="filterByStatus('CLOSED')">Closed</button>
    <button @click="filterByStatus('')">All</button>
  </div>
</template>

<style scoped>
button {
  margin-right: 0.5rem;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
}
button:hover {
  background-color: var(--color-background-mute);
}
</style>
