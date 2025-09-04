<script setup lang="ts">
// IssueDetail.vue

// Vue, 라우터, axios, 타입 임포트
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/api'
import type { Issue } from '@/types/issue'
import type { Label, User } from '@/types/'
import CommentSection from '@/components/CommentSection.vue' // ⭐️ 댓글 컴포넌트 임포트 확인
import { getContrastingTextColor, generateRandomHexColor } from '@/utils/colors';

// --- 기본 상태 및 라우터 ---
const route = useRoute()
const router = useRouter()
const issueId = Number(route.params.id)
const issue = ref<Issue | null>(null)
const labels = ref<Label[]>([]) // 전체 라벨 리스트
const users = ref<User[]>([])   // 전체 사용자 목록
const loading = ref(true)
const error = ref<string | null>(null)

// --- 수정 UI를 위한 상태 ---
const showAssigneeDropdown = ref(false)
const showLabelDropdown = ref(false)
const newLabelName = ref('') // 새 라벨 입력을 위한 상태

// --- 헬퍼 함수 ---
const getLabelById = (id: number) => labels.value.find(l => l.id === id)
const getAssigneeById = (id: number | null) => {
  if (!id) return null;
  return users.value.find(u => u.id === id)
}
const getUserById = (id: number | null) => {
  if (!id) return null;
  return users.value.find(u => u.id === id)
}

// --- API 호출 함수 ---
/**
 * 이슈 상태 변경 (OPEN/CLOSED)
 */
const changeIssueStatus = async (newStatus: 'OPEN' | 'CLOSED') => {
  if (!issue.value) return
  try {
    const response = await api.patch(`/issues/${issueId}/status`, { status: newStatus })
    if (response.data.success && issue.value) {
      issue.value.status = response.data.data.status
      issue.value.updatedAt = response.data.data.updatedAt
      alert(`이슈 상태가 ${newStatus}(으)로 변경되었습니다.`)
    }
  } catch (e) {
    console.error('이슈 상태 변경 실패:', e)
    alert('서버 오류로 상태 변경이 실패했습니다.')
  }
}

/**
 * 담당자를 업데이트하고 즉시 저장하는 함수
 */
const updateAssignee = async (newAssigneeId: number | null) => {
  if (!issue.value) return
  issue.value.assigneeId = newAssigneeId
  showAssigneeDropdown.value = false // 드롭다운 닫기

  try {
    await api.patch(`/issues/${issueId}`, {
      assigneeId: newAssigneeId
    })
  } catch (err) {
    console.error('Failed to update assignee:', err)
    alert('담당자 수정에 실패했습니다. 페이지를 새로고침합니다.')
    fetchIssueDetail() // 실패 시 롤백
  }
}

/**
 * 라벨을 토글하고 즉시 저장하는 함수
 */
const toggleLabelAndUpdate = async (labelId: number) => {
  if (!issue.value) return;

  const currentLabelIds = issue.value.labelIds || [];
  const index = currentLabelIds.indexOf(labelId);

  if (index === -1) {
    currentLabelIds.push(labelId);
  } else {
    currentLabelIds.splice(index, 1);
  }
  issue.value.labelIds = [...currentLabelIds];

  try {
    await api.patch(`/issues/${issueId}`, {
      labelIds: issue.value.labelIds
    })
  } catch (err) {
    console.error('Failed to update labels:', err)
    alert('라벨 수정에 실패했습니다. 페이지를 새로고침합니다.')
    fetchIssueDetail() // 실패 시 롤백
  }
}


/**
 * 새 라벨을 생성하고 이슈에 바로 적용하는 함수
 */
const createAndApplyLabel = async () => {
  const name = newLabelName.value.trim();
  if (!name || !issue.value) return;

  // 이미 존재하는 라벨인지 확인
  if (labels.value.some(l => l.name.toLowerCase() === name.toLowerCase())) {
    alert('이미 존재하는 라벨입니다.');
    newLabelName.value = '';
    return;
  }

  try {
    // 1. 새 라벨 생성 API 호출
    const createResponse = await api.post<{ success: boolean, data: Label }>('/labels', {
      name: name,
      color: generateRandomHexColor(),
      description: ''
    });

    if (createResponse.data.success) {
      const newLabel = createResponse.data.data;
      
      // 2. 전체 라벨 목록(ref)에 새 라벨 추가 -> UI 즉시 반영
      labels.value.push(newLabel);
      
      // 3. 현재 이슈의 라벨 목록에 새 라벨 ID 추가
      const updatedLabelIds = [...issue.value.labelIds, newLabel.id];
      issue.value.labelIds = updatedLabelIds; // 화면 즉시 반영
      
      // 4. 이슈 업데이트 API 호출
      await api.patch(`/issues/${issueId}`, {
        labelIds: updatedLabelIds
      });

      newLabelName.value = ''; // 입력창 비우기
    }
  } catch (err) {
    console.error('Failed to create and apply label:', err);
    alert('새 라벨 생성 및 적용에 실패했습니다.');
    fetchIssueDetail(); // 실패 시 롤백
  }
}

/**
 * 페이지에 필요한 모든 데이터를 불러옵니다.
 */
const fetchIssueDetail = async () => {
  try {
    loading.value = true
    const [issueRes, labelRes, userRes] = await Promise.all([
      api.get<{ success: boolean; data: Issue }>(`/issues/${issueId}`),
      api.get<{ success: boolean; data: Label[] }>('/labels'),
      api.get<{ success: boolean; data: User[] }>('/auth/users')
    ])
    if (issueRes.data.success) issue.value = issueRes.data.data
    if (labelRes.data.success) labels.value = labelRes.data.data
    if (userRes.data.success) users.value = userRes.data.data
  } catch (e) {
    error.value = '서버 오류가 발생했습니다.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 컴포넌트 로딩 시 실행
onMounted(() => {
  if (!issueId || isNaN(issueId)) {
    router.push({ name: 'home' })
  } else {
    fetchIssueDetail()
  }
})
</script>

<template>
  <div v-if="loading">
    <p>Loading...</p>
  </div>
  <div v-else-if="issue">
    <div class="mb-4 pb-4 border-b border-gray-200">
      <h1 class="text-3xl font-bold text-gray-900">{{ issue.title }} <span class="text-3xl text-gray-400 font-light">#{{ issue.id }}</span></h1>
      <div class="flex items-center mt-2">
        <span :class="[issue.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800']" class="px-3 py-1 text-sm font-semibold leading-none rounded-full">
          {{ issue.status }}
        </span>
        <span class="ml-4 text-sm text-gray-600">
          <strong>{{ getUserById(issue.authorId)?.username || 'unknown user' }}</strong> opened this issue on {{ new Date(issue.createdAt).toLocaleString() }}
        </span>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-8">
      <div class="flex-grow">
        <div class="prose max-w-none p-4 border rounded-md bg-white">
          <p>{{ issue.description || 'No description provided.' }}</p>
        </div>
        
        <CommentSection :issue-id="issueId" />
      </div>

      <aside class="w-full md:w-64 flex-shrink-0">
        <div class="space-y-4">
          
          <div class="p-4 border rounded-md bg-white">
            <h3 class="text-sm font-semibold text-gray-500 mb-2">Author</h3>
            <p class="text-gray-800">{{ getUserById(issue.authorId)?.username || 'Unknown' }}</p>
          </div>

          <div class="relative">
            <div @click="showAssigneeDropdown = !showAssigneeDropdown" class="p-4 border rounded-md bg-white cursor-pointer hover:bg-gray-50">
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Assignees</h3>
              <p>{{ getUserById(issue.assigneeId)?.username || 'No one assigned' }}</p>
            </div>
            <div v-if="showAssigneeDropdown" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <ul class="max-h-60 overflow-auto">
                <li @click.stop="updateAssignee(null)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Unassigned</li>
                <li v-for="user in users" :key="user.id" @click.stop="updateAssignee(user.id)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  {{ user.username }}
                </li>
              </ul>
            </div>
          </div>

          <div class="relative">
            <div @click="showLabelDropdown = !showLabelDropdown" class="p-4 border rounded-md bg-white cursor-pointer hover:bg-gray-50">
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Labels</h3>
              <div v-if="issue.labelIds.length > 0" class="flex flex-wrap gap-2">
                <span v-for="labelId in issue.labelIds" :key="labelId"
                      :style="{ backgroundColor: getLabelById(labelId)?.color, color: getContrastingTextColor(getLabelById(labelId)?.color || '#000000') }"
                      class="px-3 py-1 text-xs font-semibold rounded-full shadow-sm">
                  {{ getLabelById(labelId)?.name }}
                </span>
              </div>
              <p v-else class="text-sm text-gray-500">None yet</p>
            </div>
             <div v-if="showLabelDropdown" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <ul class="max-h-60 overflow-auto">
                <li class="p-2">
                  <input 
                    v-model="newLabelName"
                    @keydown.enter.prevent="createAndApplyLabel"
                    @click.stop
                    type="text" 
                    placeholder="새 라벨 입력 후 Enter"
                    class="block w-full text-xs px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </li>
                <li v-for="label in labels" :key="label.id" @click.stop="toggleLabelAndUpdate(label.id)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center">
                  <input type="checkbox" :checked="issue.labelIds.includes(label.id)" class="mr-3 pointer-events-none">
                  <span :style="{ backgroundColor: label.color, color: getContrastingTextColor(label.color) }" class="px-2 py-0.5 text-xs font-semibold rounded-full">{{ label.name }}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="p-4 border rounded-md bg-white">
            <button @click="changeIssueStatus(issue.status === 'OPEN' ? 'CLOSED' : 'OPEN')"
                    class="w-full text-center py-2 px-4 border rounded-md hover:bg-gray-100 font-semibold text-gray-700">
                {{ issue.status === 'OPEN' ? 'Close issue' : 'Reopen issue' }}
            </button>
          </div>

        </div>
      </aside>
    </div>
  </div>
  <div v-else-if="error">
    <p class="text-red-500">{{ error }}</p>
  </div>
</template>