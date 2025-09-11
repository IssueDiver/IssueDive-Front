<script setup lang="ts">
// src/views/IssueCreateView.vue
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import IssueForm from '@/components/IssueForm.vue'
import type { IssueFormData } from '@/types/issue'
import type { User, Label } from '@/types/index'
import { generateRandomHexColor } from '@/utils/colors'

const router = useRouter()
const users = ref<User[]>([])
const labels = ref<Label[]>([])
const isLoading = ref(true)

const fetchInitialData = async () => {
  try {
    isLoading.value = true
    const [userRes, labelRes] = await Promise.all([
      api.get<{ success: boolean; data: User[] }>('/api/auth/users'),
      api.get<{ success: boolean; data: Label[] }>('/api/labels')
    ])
    if (userRes.data.success) users.value = userRes.data.data
    if (labelRes.data.success) labels.value = labelRes.data.data
  } catch (error) {
    console.error('Failed to fetch initial data:', error)
    alert('데이터를 불러오는 데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

/**
 * IssueForm 컴포넌트에서 submit 이벤트가 발생했을 때 호출될 핸들러입니다.
 */
const handleIssueSubmit = async (formData: IssueFormData & { newLabels: string[] }) => {
  try {
    const newLabelIds: number[] = [];
    
    // 1. 새로 입력된 라벨 이름이 있다면, 라벨 생성 API를 먼저 호출합니다.
    if (formData.newLabels && formData.newLabels.length > 0) {
      for (const labelName of formData.newLabels) {
        try {
          const res = await api.post<{ success: boolean, data: Label }>('/api/labels', {
            name: labelName,
            color: generateRandomHexColor(),
            description: ''
          });
          if (res.data.success) {
            const newLabel = res.data.data;
            newLabelIds.push(newLabel.id);
            
            // 새로 생성된 라벨을 labels ref에 즉시 추가합니다.
            //    - 이렇게 하면 자식(IssueForm)에게 prop이 업데이트되어 UI가 즉시 갱신됩니다.
            labels.value.push(newLabel);
          }
        } catch (labelError) {
          console.error(`라벨 '${labelName}' 생성 실패:`, labelError);
          alert(`라벨 '${labelName}' 생성에 실패했습니다.`);
          return;
        }
      }
    }
    
    const allLabelIds = [...formData.labelIds, ...newLabelIds];

    // API 요청 시 assigneeId 대신 assigneeIds를 사용합니다.
    const response = await api.post('/api/issues', {
      title: formData.title,
      description: formData.description,
      assigneeIds: formData.assigneeIds, 
      labels: allLabelIds,
    });

    if (response.data.success) {
      alert('이슈가 성공적으로 생성되었습니다!')
      const newIssueId = response.data.data.id;
      router.push({ name: 'issue-detail', params: { id: newIssueId } });
    } else {
      alert('이슈 생성에 실패했습니다.');
    }
  } catch (e) {
    console.error('Error submitting issue:', e);
    alert('서버 오류가 발생했습니다.');
  }
}

onMounted(fetchInitialData)
</script>

<template>
  <div>
    <div class="pb-4 border-b border-gray-200">
      <h1 class="text-3xl font-bold text-gray-900">새 이슈 생성</h1>
    </div>
    <div v-if="isLoading" class="py-10 text-center">
      <p>데이터를 불러오는 중입니다...</p>
    </div>
    <IssueForm
      v-else
      :users="users"
      :labels="labels"
      @submit="handleIssueSubmit"
    />
  </div>
</template>
