<script setup lang="ts">
// IssueDetail.vue

// Vue, 라우터, axios, 타입 임포트
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/api'
import type { Issue } from '@/types/issue'
import type { Label, User } from '@/types/'
import CommentSection from '@/components/CommentSection.vue' 
import { getContrastingTextColor, generateRandomHexColor } from '@/utils/colors';
import { useAuthStore } from '@/stores/auth' 

// --- 기본 상태 및 라우터 ---
const route = useRoute()
const router = useRouter()
const issueId = Number(route.params.id)
const issue = ref<Issue | null>(null)
const labels = ref<Label[]>([]) // 전체 라벨 리스트
const users = ref<User[]>([])   // 전체 사용자 목록
const loading = ref(true)
const error = ref<string | null>(null)
const authStore = useAuthStore() 

// --- 수정 UI를 위한 상태 ---
const showAssigneeDropdown = ref(false)
const showLabelDropdown = ref(false)
const newLabelName = ref('') // 새 라벨 입력을 위한 상태
const isEditing = ref(false) // 수정 모드 활성화 여부
const editedTitle = ref('')
const editedDescription = ref('')

// 드롭다운 컨테이너를 위한 템플릿 참조
const assigneeDropdownContainer = ref<HTMLElement | null>(null);
const labelDropdownContainer = ref<HTMLElement | null>(null);

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
// const updateAssignee = async (newAssigneeId: number | null) => {
//   if (!issue.value) return
//   issue.value.assigneeId = newAssigneeId
//   showAssigneeDropdown.value = false // 드롭다운 닫기

//   try {
//     await api.patch(`/issues/${issueId}`, {
//       assigneeId: newAssigneeId
//     })
//   } catch (err) {
//     console.error('Failed to update assignee:', err)
//     alert('담당자 수정에 실패했습니다. 페이지를 새로고침합니다.')
//     fetchIssueDetail() // 실패 시 롤백
//   }
// }

/**
 * 다중 담당자 선택/해제 및 API 호출을 처리하는 함수
 */
const toggleAssigneeAndUpdate = async (userId: number) => {
  if (!issue.value) return;

  const currentAssigneeIds = issue.value.assigneeIds || [];
  const index = currentAssigneeIds.indexOf(userId);

  // 이미 포함되어 있으면 제거, 없으면 추가
  if (index === -1) {
    currentAssigneeIds.push(userId);
  } else {
    currentAssigneeIds.splice(index, 1);
  }
  // Vue의 반응성을 위해 새로운 배열로 교체
  issue.value.assigneeIds = [...currentAssigneeIds];

  try {
    // 백엔드에 전체 담당자 ID 목록을 담아 업데이트 요청
    await api.patch(`/issues/${issueId}`, {
      assigneeIds: issue.value.assigneeIds
    });
  } catch (err) {
    console.error('Failed to update assignees:', err);
    alert('담당자 수정에 실패했습니다. 페이지를 새로고침합니다.');
    fetchIssueDetail(); // 실패 시 롤백
  }
};

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
      showLabelDropdown.value = false;
    }
  } catch (err) {
    console.error('Failed to create and apply label:', err);
    alert('새 라벨 생성 및 적용에 실패했습니다.');
    fetchIssueDetail(); // 실패 시 롤백
  }
}

/**
 * 외부 클릭을 감지하여 드롭다운을 닫는 핸들러
 */
const handleClickOutside = (event: MouseEvent) => {
  // 담당자 드롭다운이 열려 있고, 클릭된 영역이 드롭다운 컨테이너의 바깥쪽일 때
  if (assigneeDropdownContainer.value && !assigneeDropdownContainer.value.contains(event.target as Node)) {
    showAssigneeDropdown.value = false;
  }
  // 라벨 드롭다운이 열려 있고, 클릭된 영역이 드롭다운 컨테이너의 바깥쪽일 때
  if (labelDropdownContainer.value && !labelDropdownContainer.value.contains(event.target as Node)) {
    showLabelDropdown.value = false;
  }
};

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
    if (issueRes.data.success) {
      issue.value = issueRes.data.data;
      editedTitle.value = issue.value.title;
      editedDescription.value = issue.value.description || '';
    }
    if (labelRes.data.success) labels.value = labelRes.data.data
    if (userRes.data.success) users.value = userRes.data.data
  } catch (e) {
    error.value = '서버 오류가 발생했습니다.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

const startEditing = () => {
  if (!issue.value) return;
  editedTitle.value = issue.value.title;
  editedDescription.value = issue.value.description || '';
  isEditing.value = true;
}

const cancelEdit = () => {
  isEditing.value = false;
}

const saveChanges = async () => {
  if (!issue.value) return;
  try {
    const response = await api.patch(`/issues/${issueId}`, {
      title: editedTitle.value,
      description: editedDescription.value
    });
    if (response.data.success) {
      issue.value = response.data.data; // 서버로부터 받은 최신 정보로 업데이트
      isEditing.value = false;
      alert('이슈가 성공적으로 수정되었습니다.');
    }
  } catch (err) {
    console.error('Failed to save issue changes:', err);
    alert('이슈 수정에 실패했습니다.');
  }
}

const deleteIssue = async () => {
  if (!issue.value) return;
  if (confirm(`정말로 이슈 #${issue.value.id}을(를) 삭제하시겠습니까?`)) {
    try {
      await api.delete(`/issues/${issueId}`);
      alert('이슈가 삭제되었습니다.');
      router.push({ name: 'home' }); // 삭제 후 홈으로 이동
    } catch (err) {
      console.error('Failed to delete issue:', err);
      alert('이슈 삭제에 실패했습니다.');
    }
  }
}

// --- Lifecycle Hooks ---
// 컴포넌트 로딩 시 실행
onMounted(() => {
  if (!issueId || isNaN(issueId)) {
    router.push({ name: 'home' })
  } else {
    fetchIssueDetail()
  }
  document.addEventListener('click', handleClickOutside);
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
})
</script>

<template>
  <div v-if="loading">
    <p>Loading...</p>
  </div>
  <div v-else-if="issue">
    <!-- 수정 모드일 때와 아닐 때를 구분하여 UI를 렌더링합니다. -->
    <div v-if="isEditing" class="mb-4">
      <input v-model="editedTitle" type="text" class="w-full text-3xl font-bold text-gray-900 border-2 border-blue-400 rounded-md p-2" />
    </div>
    <div v-else class="mb-4 pb-4 border-b border-gray-200 flex justify-between items-start">
      <div>
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
      <!-- 현재 사용자가 작성자일 경우에만 수정/삭제 버튼을 보여줍니다. -->
      <div v-if="authStore.user && authStore.user.id === issue.authorId" class="flex items-center space-x-2 flex-shrink-0 pt-2">
        <button @click="startEditing" class="text-sm font-medium text-gray-600 hover:text-blue-600 border px-3 py-1 rounded-md">Edit</button>
        <button @click="deleteIssue" class="text-sm font-medium text-gray-600 hover:text-red-600 border px-3 py-1 rounded-md">Delete</button>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-8">
      <div class="flex-grow">
        <!-- 수정 모드일 때는 textarea를 보여줍니다. -->
        <div v-if="isEditing" class="mb-4">
          <textarea v-model="editedDescription" rows="10" class="w-full p-2 border-2 border-blue-400 rounded-md"></textarea>
          <div class="mt-2 flex justify-end space-x-2">
            <button @click="cancelEdit" class="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 font-semibold">Cancel</button>
            <button @click="saveChanges" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">Save changes</button>
          </div>
        </div>
        <div v-else class="prose max-w-none p-4 border rounded-md bg-white">
          <p>{{ issue.description || 'No description provided.' }}</p>
        </div>
        
        <CommentSection :issue-id="issueId" />
      </div>
      
      <aside class="w-full md:w-64 flex-shrink-0">
        <div class="space-y-4">
          
          <!-- <div class="p-4 border rounded-md bg-white">
            <h3 class="text-sm font-semibold text-gray-500 mb-2">Author</h3>
            <p class="text-gray-800">{{ getUserById(issue.authorId)?.username || 'Unknown' }}</p>
          </div> -->

          <div class="relative" ref="assigneeDropdownContainer">
            <div @click="showAssigneeDropdown = !showAssigneeDropdown" class="p-4 border rounded-md bg-white cursor-pointer hover:bg-gray-50">
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Assignees</h3>
              <!-- 담당자가 여러 명일 수 있으므로 v-for로 표시 -->
              <div v-if="issue.assigneeIds.length > 0" class="flex flex-wrap gap-2">
                <span v-for="userId in issue.assigneeIds" :key="userId" class="px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-800 rounded-full">
                  {{ getUserById(userId)?.username || 'Unknown' }}
                </span>
              </div>
              <p v-else class="text-sm text-gray-500">No one assigned</p>
            </div>
            
            <!-- 드롭다운 메뉴: 체크박스 -->
            <div v-if="showAssigneeDropdown" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <ul class="max-h-60 overflow-auto">
                <!-- 각 사용자를 클릭하면 toggleAssigneeAndUpdate 함수가 호출됩니다. -->
                <li v-for="user in users" :key="user.id" @click.stop="toggleAssigneeAndUpdate(user.id)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center">
                  <input 
                    type="checkbox" 
                    :checked="issue.assigneeIds.includes(user.id)"
                    class="mr-3 pointer-events-none" 
                  />
                  {{ user.username }}
                </li>
              </ul>
            </div>
          </div>

          <div class="relative" ref="labelDropdownContainer">
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