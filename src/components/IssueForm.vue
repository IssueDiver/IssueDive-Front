<script setup lang="ts">
// IssueForm.vue

// Vue Composition API에서 상태관리와 이벤트 처리용
import { reactive, computed, watch } from 'vue'
import type { IssueFormData } from '@/types/issue'
import type { User, Label } from '@/types/index'

// --- Props & Emits ---
// 부모 컴포넌트로부터 users, labels 받음
const props = defineProps<{
  users: User[]
  labels: Label[]
}>()

// 부모 컴포넌트에 submit 이벤트를 보낼 수 있도록 정의
const emit = defineEmits<{
  (e: 'submit', formData: IssueFormData): void
}>();

// --- State ---
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

// --- Handlers ---
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
  <form @submit.prevent="handleSubmit" class="mt-6">
    <div class="flex flex-col md:flex-row gap-8">

      <div class="flex-grow">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700">제목</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            placeholder="이슈 제목을 입력하세요"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div class="mt-4">
          <label for="description" class="block text-sm font-medium text-gray-700">상세 설명</label>
          <textarea
            id="description"
            v-model="formData.description"
            rows="10"
            placeholder="이슈에 대한 상세한 설명을 작성해주세요. 마크다운을 지원합니다."
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
      </div>

      <aside class="w-full md:w-64 flex-shrink-0">
        <div class="p-4 border rounded-md bg-white">
          <label for="assignee" class="text-sm font-semibold text-gray-600">담당자 (Assignee)</label>
          <select id="assignee" @change="onAssigneeChange" :value="formData.assigneeId ?? ''" class="mt-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
            <option value="">담당자 없음</option>
            <option v-for="user in props.users" :key="user.id" :value="user.id">
              {{ user.username }}
            </option>
          </select>
        </div>
        
        <div class="mt-4 p-4 border rounded-md bg-white">
          <h3 class="text-sm font-semibold text-gray-600 mb-2">라벨 (Labels)</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="label in props.labels"
              :key="label.id"
              type="button"
              @click="toggleLabel(label.id)"
              :class="[
                'px-3 py-1 text-xs font-semibold rounded-full transition-all duration-150',
                formData.labelIds.includes(label.id) ? 'text-white shadow-md' : 'hover:opacity-80'
              ]"
              :style="{ backgroundColor: label.color, opacity: formData.labelIds.includes(label.id) ? 1 : 0.5 }"
            >
              {{ label.name }}
            </button>
          </div>
        </div>
      </aside>
    </div>

    <div class="mt-8 pt-4 border-t border-gray-200 flex justify-end">
      <button type="submit" :disabled="!isTitleValid" class="px-6 py-2 font-semibold bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed">
        이슈 등록
      </button>
    </div>
  </form>
</template>