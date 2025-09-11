<script setup lang="ts">
// IssueForm.vue

// Vue Composition API에서 상태관리와 이벤트 처리용
import { reactive, computed, watch, ref } from 'vue'
import type { IssueFormData } from '@/types/issue'
import type { User, Label } from '@/types/index'
import { getContrastingTextColor } from '@/utils/colors' 

// --- Props & Emits ---
// 부모 컴포넌트로부터 users, labels 받음
const props = defineProps<{
  users: User[]
  labels: Label[]
}>()

// 부모 컴포넌트에 submit 이벤트를 보낼 수 있도록 정의
const emit = defineEmits<{
  (e: 'submit', formData: IssueFormData & { newLabels: string[] }): void
}>()

// --- State ---
// 폼 데이터를 reactive 상태로 선언하고 초깃값 설정
const formData = reactive<IssueFormData>({
  title: '',
  description: '',
  assigneeIds: [],
  labelIds: [],
  labelIdsString: ''
});

// 제목이 비었는지 여부를 판단하는 계산 속성
const isTitleValid = computed(() => formData.title.trim().length > 0)

// 새 라벨 입력을 위한 상태
const newLabelName = ref('')
const newLabelStrings = ref<string[]>([])

// --- Handlers ---
const toggleAssignee = (userId: number) => {
  const index = formData.assigneeIds.indexOf(userId)
  if (index === -1) {
    formData.assigneeIds.push(userId)
  } else {
    formData.assigneeIds.splice(index, 1)
  }
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

/**
 * 새 라벨을 입력하고 Enter를 눌렀을 때 실행되는 함수
 */
const addNewLabel = () => {
  const name = newLabelName.value.trim();
  if (!name) return; // 입력값이 없으면 아무것도 안 함

  // 1. 기존 라벨 목록에 같은 이름이 있는지 확인 (대소문자 무시)
  const existingLabel = props.labels.find(label => label.name.toLowerCase() === name.toLowerCase());

  if (existingLabel) {
    // 2-1. 같은 이름의 라벨이 존재하면 -> 해당 라벨을 '선택' 상태로 만듭니다.
    // 이미 선택되어 있지 않은 경우에만 추가
    if (!formData.labelIds.includes(existingLabel.id)) {
      formData.labelIds.push(existingLabel.id);
    }
  } else {
    // 2-2. 기존 라벨에 없다면 -> '새로 만들 라벨' 목록에 추가합니다.
    // 이미 새로 만들 라벨 목록에 없는 경우에만 추가
    if (!newLabelStrings.value.find(newLabel => newLabel.toLowerCase() === name.toLowerCase())) {
        newLabelStrings.value.push(name);
    }
  }

  newLabelName.value = ''; // 입력창 초기화
}

// 부모로부터 받은 labels prop이 변경될 때를 감지합니다.
//    - 새 라벨이 생성되어 props.labels에 추가되면,
//    - 해당 라벨을 자동으로 선택된 상태로 만듭니다.
watch(() => props.labels, (newLabels, oldLabels) => {
  if (newLabels.length > oldLabels.length) {
    const newlyAddedLabel = newLabels[newLabels.length - 1]; // 가장 마지막에 추가된 라벨
    // 이 라벨이 내가 방금 입력한 새 라벨 목록에 있는지 확인
    const newLabelIndex = newLabelStrings.value.findIndex(
      name => name.toLowerCase() === newlyAddedLabel.name.toLowerCase()
    );
    if (newLabelIndex > -1) {
      // 있다면, 선택된 ID 목록에 추가하고, 새로 만들 목록에서는 제거
      formData.labelIds.push(newlyAddedLabel.id);
      newLabelStrings.value.splice(newLabelIndex, 1);
    }
  }
}, { deep: true });

/**
 * 폼 제출 시 새로 생성할 라벨 이름 목록도 함께 emit
 */
const handleSubmit = () => {
  if (!isTitleValid.value) {
    alert('제목을 입력해주세요.')
    return
  }
  const submissionData = {
    ...JSON.parse(JSON.stringify(formData)),
    newLabels: newLabelStrings.value
  }
  console.log('Form에서 부모로 보내는 데이터:', submissionData);
  emit('submit', submissionData)
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
            placeholder="이슈에 대한 상세한 설명을 작성해주세요."
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
      </div>

      <aside class="w-full md:w-64 flex-shrink-0">
      <div class="p-4 border rounded-md bg-white">
          <h3 class="text-sm font-semibold text-gray-600 mb-2">담당자 (Assignees)</h3>
          <ul class="max-h-40 overflow-auto space-y-2">
            <li v-for="user in props.users" :key="user.id" @click="toggleAssignee(user.id)" class="flex items-center cursor-pointer p-1 rounded-md hover:bg-gray-100">
              <input 
                type="checkbox" 
                :checked="formData.assigneeIds.includes(user.id)"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
              >
              <img :src="`https://i.pravatar.cc/24?u=${user.id}`" class="w-6 h-6 rounded-full mx-2" />
              <span class="text-sm">{{ user.username }}</span>
            </li>
          </ul>
        </div>
        
        
        <div class="mt-4 p-4 border rounded-md bg-white">
          <h3 class="text-sm font-semibold text-gray-600 mb-2">라벨 (Labels)</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="label in props.labels"
              :key="label.id"
              type="button"
              @click="toggleLabel(label.id)"
              :class="[ 'px-3 py-1 text-xs font-semibold rounded-full transition-all duration-150', formData.labelIds.includes(label.id) ? 'shadow-md' : 'opacity-60 hover:opacity-100']"
              :style="{ backgroundColor: label.color, color: getContrastingTextColor(label.color) }"
            >
              {{ label.name }}
            </button>
          </div>
          
          <div v-if="newLabelStrings.length > 0" class="flex flex-wrap gap-2 mt-2">
            <span v-for="name in newLabelStrings" :key="name" class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800 animate-pulse">
              {{ name }} (새 라벨)
            </span>
          </div>

          <div class="mt-4">
            <input 
              v-model="newLabelName"
              @keydown.enter.prevent="addNewLabel"
              type="text" 
              placeholder="새 라벨 입력 후 Enter"
              class="block w-full text-xs px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
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