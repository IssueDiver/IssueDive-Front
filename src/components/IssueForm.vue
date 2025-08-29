<script setup lang="ts">
// IssueForm.vue

// Vue Composition API에서 상태관리와 이벤트 처리용
import { reactive, computed, watch } from 'vue'
import type { IssueFormData } from '@/types/issue'
import type { User, Label } from '@/types/index'

// 부모 컴포넌트로부터 users, labels 받음
const props = defineProps<{
  users: User[]
  labels: Label[]
}>()

// 부모 컴포넌트에 submit 이벤트를 보낼 수 있도록 정의
const emit = defineEmits<{
  (e: 'submit', formData: IssueFormData): void
}>();

// 폼 데이터를 reactive 상태로 선언하고 초깃값 설정
const formData = reactive<IssueFormData>({
  title: '',
  description: '',
  assigneeId: null,
  labelIds: [],
  labelIdsString: ''
});

// 제목이 비었는지 여부를 판단하는 계산 속성
const isTitleValid = computed(() => formData.title.trim().length > 0)

// 라벨 입력 문자열 변경 시 labelIds 배열 업데이트 함수
const onLabelIdsChange = () => {
  formData.labelIds = formData.labelIdsString
    .split(',')
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))
}

// 체크박스로 라벨 선택 변경 시 labelIds 업데이트
const toggleLabel = (labelId: number) => {
  const index = formData.labelIds.indexOf(labelId)
  if (index === -1) {
    formData.labelIds.push(labelId)
  } else {
    formData.labelIds.splice(index, 1)
  }
}

// 담당자 select 변경 시 assigneeId 업데이트
const onAssigneeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const val = target.value
  formData.assigneeId = val ? parseInt(val) : null
}


// 폼 제출 시 발생하는 함수
const handleSubmit = () => {
  if (!isTitleValid.value) {
    alert('제목을 입력해주세요.')
    return
  }
  // 양방향 바인딩 기반으로 labelIds도 업데이트(버튼 누르기 전에도 반영 보장)
  onLabelIdsChange()
  // 부모 컴포넌트로 현재 폼 데이터 전송
  emit('submit', { ...formData })
}
</script>
<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label for="title">제목<span style="color:red;">*</span></label>
      <input
        id="title"
        v-model="formData.title"
        type="text"
        placeholder="이슈 제목 입력"
        required
      />
    </div>

    <div>
      <label for="description">상세 설명</label>
      <textarea
        id="description"
        v-model="formData.description"
        placeholder="이슈 내용을 상세히 작성"
      ></textarea>
    </div>

    <div>
      <label for="assignee">담당자</label>
      <select id="assignee" @change="onAssigneeChange" :value="formData.assigneeId ?? ''">
        <option value="">선택 안함</option>
        <option v-for="user in props.users" :key="user.id" :value="user.id">
          {{ user.username }} (ID: {{ user.id }})
        </option>
      </select>
    </div>

    <div>
      <label>라벨 선택</label>
      <div>
        <label
          v-for="label in props.labels"
          :key="label.id"
          style="margin-right: 1rem; cursor: pointer;"
        >
          <input
            type="checkbox"
            :value="label.id"
            :checked="formData.labelIds.includes(label.id)"
            @change="toggleLabel(label.id)"
          />
          <span :style="{ color: label.color }">{{ label.name }}</span>
        </label>
      </div>
    </div>

    <button type="submit" :disabled="!isTitleValid">등록 / 수정</button>
  </form>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
}
label {
  font-weight: bold;
}
input,
textarea,
select {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
}
button {
  padding: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>