<script setup lang="ts">
// src/views/IssueCreateView.vue
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import IssueForm from '@/components/IssueForm.vue'
import type { IssueFormData } from '@/types/issue'
import type { User, Label } from '@/types/index'
import { generateRandomHexColor } from '@/utils/colors'

const router = useRouter()

// 폼에 전달할 사용자 및 라벨 목록 상태
const users = ref<User[]>([])
const labels = ref<Label[]>([])
const isLoading = ref(true)

/**
 * 폼에 필요한 초기 데이터(사용자, 라벨)를 불러옵니다.
 */
const fetchInitialData = async () => {
  try {
    isLoading.value = true
    // Promise.all을 사용해 두 API를 병렬로 호출합니다.
    const [userRes, labelRes] = await Promise.all([
      axios.get<{ success: boolean; data: User[] }>('http://localhost:8080/auth/users'),
      axios.get<{ success: boolean; data: Label[] }>('http://localhost:8080/labels')
    ])

    if (userRes.data.success) {
      users.value = userRes.data.data
    }
    if (labelRes.data.success) {
      labels.value = labelRes.data.data
    }
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
  console.log('View(부모)가 Form에서 받은 데이터:', formData);
  
  try {
    const newLabelIds: number[] = [];
    
    // 1. 새로 입력된 라벨 이름이 있다면, 라벨 생성 API를 먼저 호출합니다.
    if (formData.newLabels && formData.newLabels.length > 0) {
      console.log(`새 라벨 ${formData.newLabels.join(', ')} 을(를) 생성합니다.`);
      
      for (const labelName of formData.newLabels) {
        try {
          const res = await axios.post<{ success: boolean, data: Label }>('http://localhost:8080/labels', {
            name: labelName,
            color: generateRandomHexColor(), // 랜덤 색상 사용
            description: ''
          });
          if (res.data.success) {
            newLabelIds.push(res.data.data.id); // 새로 생성된 라벨의 ID를 저장합니다.
          }
        } catch (labelError) {
          console.error(`라벨 '${labelName}' 생성 실패:`, labelError);
          alert(`라벨 '${labelName}' 생성에 실패했습니다.`);
          return; // 라벨 생성을 하나라도 실패하면 전체 프로세스를 중단합니다.
        }
      }
    }
    
    // 2. 기존에 선택된 라벨 ID와 새로 생성된 라벨 ID를 합칩니다.
    const allLabelIds = [...formData.labelIds, ...newLabelIds];

    // 3. 최종적으로 합쳐진 라벨 목록으로 이슈 생성 API를 호출합니다.
    const response = await axios.post('http://localhost:8080/issues', {
      title: formData.title,
      description: formData.description,
      assigneeId: formData.assigneeId,
      labels: allLabelIds,
    });

    if (response.data.success) {
      alert('이슈가 성공적으로 생성되었습니다!')
      const newIssueId = response.data.data.id;
      // 생성된 이슈의 상세 페이지로 이동합니다.
      router.push({ name: 'issue-detail', params: { id: newIssueId } });
    } else {
      alert('이슈 생성에 실패했습니다.');
    }
  } catch (e) {
    console.error('Error submitting issue:', e);
    alert('서버 오류가 발생했습니다.');
  }
}

// 컴포넌트가 마운트될 때 데이터를 불러옵니다.
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