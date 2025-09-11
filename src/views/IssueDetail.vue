<script setup lang="ts">
// IssueDetail.vue

import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import type { Issue } from '@/types/issue'
import type { Label, User } from '@/types/'
import CommentSection from '@/components/CommentSection.vue' 
import { getContrastingTextColor, generateRandomHexColor } from '@/utils/colors';
import { useAuthStore } from '@/stores/auth' 

// --- 상태 및 라우터 ---
const route = useRoute()
const router = useRouter()
const issueId = ref(Number(route.params.id))
const issue = ref<Issue | null>(null)
const labels = ref<Label[]>([])
const users = ref<User[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const authStore = useAuthStore() 
const previousIssueId = ref<number | null>(null)
const nextIssueId = ref<number | null>(null)
const showAssigneeDropdown = ref(false)
const showLabelDropdown = ref(false)
const newLabelName = ref('')
const isEditing = ref(false)
const editedTitle = ref('')
const editedDescription = ref('')
const showStatusDropdown = ref(false)
const assigneeDropdownContainer = ref<HTMLElement | null>(null);
const labelDropdownContainer = ref<HTMLElement | null>(null);
const statusDropdownContainer = ref<HTMLElement | null>(null)
const newLabelSearchText = ref(''); // 라벨 검색/입력 텍스트
const showNewLabelForm = ref(false); // 새 라벨 생성 폼 표시 여부
const newLabelData = ref({ name: '', description: '' }); // 새 라벨 데이터 (이름+설명)

const getUserById = (id: number | null) => users.value.find(u => u.id === id) || null
const getLabelById = (id: number) => labels.value.find(l => l.id === id) || null

const issueLabels = computed(() => {
  if (!issue.value || !labels.value.length) return [];
  // 현재 이슈의 labelIds 배열을 기반으로, 전체 라벨 목록에서 일치하는 라벨 객체를 찾아 반환
  return issue.value.labelIds.map(id => labels.value.find(l => l.id === id)).filter(Boolean) as Label[];
});

const issueStatusInfo = computed(() => {
  if (!issue.value) return { text: '', color: '', icon: '' };
  switch (issue.value.status) {
    case 'IN_PROGRESS':
      return { text: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: 'M16.023 9.348h4.992v-.001a10.5 10.5 0 0 0-9.348-9.348c-.001 0-.001.001 0 .001v4.992a5.5 5.5 0 0 1-1.42 3.879l-2.43-2.429A10.5 10.5 0 0 0 6.652 2.01v4.992a5.5 5.5 0 0 1 3.879 1.42l-2.429 2.43a10.5 10.5 0 0 0 0 9.898l2.429-2.43a5.5 5.5 0 0 1-1.42-3.879v-4.992c.001 0 .001-.001 0-.001a10.5 10.5 0 0 0 9.348 9.348v-4.992a5.5 5.5 0 0 1 1.42-3.879l2.43 2.429A10.5 10.5 0 0 0 17.348 6.652v-4.992a5.5 5.5 0 0 1-3.879-1.42l2.429-2.43z' };
    case 'CLOSED':
      return { text: 'Closed', color: 'bg-purple-100 text-purple-800', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' };
    case 'OPEN':
    default:
      return { text: 'Open', color: 'bg-green-100 text-green-800', icon: 'M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' };
  }
});

// --- API 호출 함수 ---
const changeIssueStatus = async (newStatus: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') => {
  if (!issue.value) return;
  try {
    const response = await api.patch(`/api/issues/${issueId.value}/status`, { status: newStatus });
    if (response.data.success) { issue.value.status = response.data.data.status; issue.value.updatedAt = response.data.data.updatedAt; }
  } catch (e) { console.error('이슈 상태 변경 실패:', e); alert('서버 오류로 상태 변경이 실패했습니다.'); } 
  finally { showStatusDropdown.value = false; }
}

const toggleAssigneeAndUpdate = async (userId: number) => {
  if (!issue.value) return;
  const ids = issue.value.assigneeIds || [];
  const index = ids.indexOf(userId);
  if (index === -1) { ids.push(userId); } else { ids.splice(index, 1); }
  issue.value.assigneeIds = [...ids];
  try { await api.patch(`/api/issues/${issueId.value}`, { assigneeIds: issue.value.assigneeIds }); } 
  catch (err) { alert('담당자 수정에 실패했습니다.'); fetchIssueDetail(); }
};

const toggleLabelAndUpdate = async (labelId: number) => {
  if (!issue.value) return;
  const ids = issue.value.labelIds || [];
  const index = ids.indexOf(labelId);
  if (index === -1) { ids.push(labelId); } else { ids.splice(index, 1); }
  issue.value.labelIds = [...ids];
  try { await api.patch(`/api/issues/${issueId.value}`, { labelIds: issue.value.labelIds }); } 
  catch (err) { alert('라벨 수정에 실패했습니다.'); fetchIssueDetail(); }
}

const createAndApplyLabel = async () => {
  const name = newLabelName.value.trim();
  if (!name || !issue.value) return;
  if (labels.value.some(l => l.name.toLowerCase() === name.toLowerCase())) { alert('이미 존재하는 라벨입니다.'); newLabelName.value = ''; return; }
  try {
    const res = await api.post('/api/labels', { name, color: generateRandomHexColor(), description: '' });
    if (res.data.success) {
      const newLabel = res.data.data;
      labels.value.push(newLabel);
      issue.value.labelIds = [...issue.value.labelIds, newLabel.id];
      await api.patch(`/api/issues/${issueId.value}`, { labelIds: issue.value.labelIds });
      newLabelName.value = '';
      showLabelDropdown.value = false;
    }
  } catch (err) { alert('새 라벨 생성 및 적용에 실패했습니다.'); fetchIssueDetail(); }
}

const fetchIssueDetail = async () => {
  try {
    loading.value = true;
    const [issueRes, labelRes, userRes, navRes] = await Promise.all([
      api.get(`/api/issues/${issueId.value}`),
      api.get('/api/labels'),
      api.get('/api/auth/users'),
      api.get(`/api/issues/${issueId.value}/navigation`, { params: route.query })
    ]);
    
     if (issueRes.data.success) {
      const newlyFetchedIssue = issueRes.data.data;
      issue.value = newlyFetchedIssue;
      editedTitle.value = newlyFetchedIssue.title;
      editedDescription.value = newlyFetchedIssue.description || '';
    }
    if (labelRes.data.success) labels.value = labelRes.data.data;
    if (userRes.data.success) users.value = userRes.data.data;
    if (navRes.data.success) {
      previousIssueId.value = navRes.data.data.previousIssueId;
      nextIssueId.value = navRes.data.data.nextIssueId;
    }
  } catch (e) {
    error.value = '이슈 정보를 불러오는 데 실패했습니다.';
    console.error(e);
  } finally {
    loading.value = false;
  }
}

const goToIssue = (id: number | null) => {
  if (id === null) return;
  router.push({ name: 'issue-detail', params: { id }, query: route.query });
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
    const response = await api.patch(`/api/issues/${issueId.value}`, {
      title: editedTitle.value,
      description: editedDescription.value
    });
    if (response.data.success) {
      issue.value = response.data.data;
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
      await api.delete(`/api/issues/${issueId.value}`);
      alert('이슈가 삭제되었습니다.');
      router.push({ name: 'home' });
    } catch (err) {
      console.error('Failed to delete issue:', err);
      alert('이슈 삭제에 실패했습니다.');
    }
  }
}

// --- 

// [수정] 라벨 추가/제거 로직
const toggleLabel = async (labelId: number) => {
  if (!issue.value) return;
  const issueLabelIds = issue.value.labelIds || [];
  let updatedLabelIds: number[] = [];

  if (issueLabelIds.includes(labelId)) {
    // 이미 있으면 제거
    updatedLabelIds = issueLabelIds.filter(id => id !== labelId);
  } else {
    // 없으면 추가
    updatedLabelIds = [...issueLabelIds, labelId];
  }

  try {
    const response = await api.patch(`/api/issues/${issueId.value}`, { labelIds: updatedLabelIds });
    if (response.data.success) {
      issue.value.labelIds = response.data.data.labelIds;
    }
  } catch (error) {
    console.error("라벨 업데이트 실패:", error);
  }
};

// [수정] 즉시 라벨 생성 및 추가 로직
const createAndAddLabel = async () => {
  if (!newLabelData.value.name.trim()) {
    alert('라벨 이름을 입력해주세요.');
    return;
  }

  try {
    // 1. 새 라벨 생성 API 호출
    const createResponse = await api.post<{ success: boolean; data: Label }>('/api/labels', {
      name: newLabelData.value.name,
      description: newLabelData.value.description,
      color: generateRandomHexColor(),
    });

    if (createResponse.data.success) {
      const newLabel = createResponse.data.data;
      labels.value.push(newLabel); // 전체 라벨 목록에 추가

      // 2. 생성된 라벨을 현재 이슈에 추가
      await toggleLabel(newLabel.id);
      
      // 3. 상태 초기화
      newLabelSearchText.value = '';
      newLabelData.value = { name: '', description: '' };
      showNewLabelForm.value = false;
    }
  } catch (error) {
    console.error("라벨 생성 실패:", error);
    alert("라벨 생성에 실패했습니다.");
  }
};


// [추가] 라벨 검색 텍스트가 변경될 때 호출되는 함수
const onLabelSearchChange = () => {
  // 사용자가 입력한 텍스트와 일치하는 라벨이 없고, 입력값이 있다면
  if (newLabelSearchText.value && !filteredLabels.value.some(l => l.name.toLowerCase() === newLabelSearchText.value.toLowerCase())) {
    newLabelData.value.name = newLabelSearchText.value;
    showNewLabelForm.value = true; // 새 라벨 생성 폼을 보여줌
  } else {
    showNewLabelForm.value = false; // 그렇지 않으면 숨김
  }
}

const filteredLabels = computed(() => {
  if (!newLabelSearchText.value) return labels.value;
  return labels.value.filter(label => 
    label.name.toLowerCase().includes(newLabelSearchText.value.toLowerCase())
  );
});


// -- handler
const handleClickOutside = (event: MouseEvent) => {
  if (assigneeDropdownContainer.value && !assigneeDropdownContainer.value.contains(event.target as Node)) { showAssigneeDropdown.value = false; }
  if (labelDropdownContainer.value && !labelDropdownContainer.value.contains(event.target as Node)) { showLabelDropdown.value = false; }
  if (statusDropdownContainer.value && !statusDropdownContainer.value.contains(event.target as Node)) { showStatusDropdown.value = false; }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

watch(() => route.params.id, (newId) => {
  if (newId && Number(newId) !== issue.value?.id) {
    issueId.value = Number(newId);
    issue.value = null; // 기존 데이터를 비워 로딩 상태를 명확히 함
    previousIssueId.value = null;
    nextIssueId.value = null;
    fetchIssueDetail();
  }
}, { immediate: true });
</script>

<template>
  <div v-if="loading">
    <p>Loading...</p>
  </div>
  <div v-else-if="issue">
    <div class="mb-4 pb-4 border-b border-gray-200 flex justify-between items-start">
      <!-- 제목, 상태, 작성자 정보 -->
      <div v-if="!isEditing" class="flex-grow">
        <h1 class="text-3xl font-bold text-gray-900">{{ issue.title }} <span class="text-3xl text-gray-400 font-light">#{{ issue.id }}</span></h1>
        <div class="flex items-center mt-2">
          <span :class="issueStatusInfo.color" class="px-3 py-1 text-sm font-semibold leading-none rounded-full flex items-center">
            <svg class="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" :d="issueStatusInfo.icon" clip-rule="evenodd" /></svg>
            {{ issueStatusInfo.text }}
          </span>
          <span class="ml-4 text-sm text-gray-600">
            <strong>{{ getUserById(issue.authorId)?.username || 'unknown user' }}</strong> opened this issue on {{ new Date(issue.createdAt).toLocaleString() }}
          </span>
        </div>
      </div>
      <!-- 수정 모드 제목 입력 -->
      <div v-if="isEditing" class="flex-grow mr-4">
        <input v-model="editedTitle" type="text" class="w-full text-3xl font-bold text-gray-900 border-2 border-blue-400 rounded-md p-2" />
      </div>
      
      <!-- 오른쪽 영역: 수정/삭제 버튼 또는 이전/다음 버튼 -->
      <div class="flex items-center space-x-2 flex-shrink-0 pt-2">
        <div v-if="!isEditing && authStore.user && authStore.user.id === issue.authorId" class="flex items-center space-x-2">
          <button @click="startEditing" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Edit</button>
          <button @click="deleteIssue" class="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-gray-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">Delete</button>
        </div>
        
        <div v-if="!isEditing" class="flex items-center space-x-2">
          <button @click="goToIssue(previousIssueId)" :disabled="!previousIssueId" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            &laquo; Previous
          </button>
          <button @click="goToIssue(nextIssueId)" :disabled="!nextIssueId" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Next &raquo;
          </button>
        </div>
      </div>
    </div>
    
    <div class="flex flex-col md:flex-row gap-8">
      <div class="flex-grow">
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
          
          <!-- Assignees Dropdown -->
          <div class="relative" ref="assigneeDropdownContainer">
            <div @click="showAssigneeDropdown = !showAssigneeDropdown" class="p-4 border rounded-md bg-white cursor-pointer hover:bg-gray-50">
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Assignees</h3>
              <div v-if="issue.assigneeIds.length > 0" class="flex flex-wrap gap-2">
                <div v-for="assigneeId in issue.assigneeIds" :key="assigneeId" class="flex items-center">
                  <img :src="`https://i.pravatar.cc/20?u=${assigneeId}`" class="w-5 h-5 rounded-full mr-2" />
                  <span>{{ getUserById(assigneeId)?.username || '...' }}</span>
                </div>
              </div>
              <p v-else class="text-sm text-gray-500">No one assigned</p>
            </div>
            
            <div v-if="showAssigneeDropdown" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <ul class="max-h-60 overflow-auto">
                <li v-for="user in users" :key="user.id" @click.stop="toggleAssigneeAndUpdate(user.id)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center">
                  <input type="checkbox" :checked="issue.assigneeIds.includes(user.id)" class="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none" />
                  <span>{{ user.username }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Labels Dropdown -->
          <div class="relative" ref="labelDropdownContainer">
          <div @click="showLabelDropdown = !showLabelDropdown" class="p-4 border rounded-md bg-white cursor-pointer hover:bg-gray-50 flex justify-between items-center">
            <div>
              <h3 class="text-sm font-semibold text-gray-500">Labels</h3>
              <p v-if="issueLabels.length === 0" class="text-gray-400 text-sm mt-1">None yet</p>
            </div>
            <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-1.025 1.11-1.115l.61-.162a2.25 2.25 0 0 1 2.15 0l.61.162c.55.09 1.02.573 1.11 1.115l.078.462a2.25 2.25 0 0 0 3.72 1.482l.36-.36a2.25 2.25 0 0 1 3.182 3.182l-.36.36a2.25 2.25 0 0 0-1.482 3.72l-.462.078c-.542.09-1.025.56-1.115 1.11l-.162.61a2.25 2.25 0 0 1-2.15 1.588l-.61-.162a2.25 2.25 0 0 0-3.72-1.482l-.36.36a2.25 2.25 0 0 1-3.182-3.182l.36-.36a2.25 2.25 0 0 0 1.482-3.72l.462-.078a2.25 2.25 0 0 1 1.588-2.15l.162-.61Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
          </div>
          <!-- 라벨 목록 -->
          <ul class="mt-2 space-y-1" v-if="issueLabels.length > 0">
            <li v-for="label in issueLabels" :key="label.id">
              <span :style="{ backgroundColor: label.color, color: getContrastingTextColor(label.color) }" class="px-2 py-0.5 text-xs font-semibold rounded-full">{{ label.name }}</span>
            </li>
          </ul>

          <!-- 드롭다운 메뉴 -->
          <div v-if="showLabelDropdown" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div class="p-2 border-b">
              <input 
                type="text" 
                v-model="newLabelSearchText"
                @input="onLabelSearchChange"
                placeholder="Filter labels" 
                class="w-full px-2 py-1 text-sm border-gray-300 rounded-md"
              >
            </div>
            
            <div v-if="showNewLabelForm" class="p-2 border-b bg-gray-50">
                <p class="text-xs text-gray-600 mb-2">Create new label "{{ newLabelData.name }}"</p>
                <input 
                  type="text"
                  v-model="newLabelData.description"
                  placeholder="Description (optional)"
                  class="w-full px-2 py-1 mb-2 text-sm border-gray-300 rounded-md"
                >
                <button @click="createAndAddLabel" class="w-full text-sm bg-green-600 text-white py-1 rounded-md hover:bg-green-700">Create</button>
            </div>

            <ul>
              <li v-for="label in filteredLabels" :key="label.id" @click="toggleLabel(label.id)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center justify-between">
                <div class="flex items-center">
                  <span class="w-4 h-4 rounded-full mr-2" :style="{ backgroundColor: label.color }"></span>
                  {{ label.name }}
                </div>
                <svg v-if="issue?.labelIds.includes(label.id)" class="w-4 h-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
              </li>
            </ul>
          </div>
        </div>

          <!-- Status Dropdown -->
          <div class="relative" ref="statusDropdownContainer">
            <div @click="showStatusDropdown = !showStatusDropdown" class="p-4 border rounded-md bg-white cursor-pointer hover:bg-gray-50">
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Status</h3>
              <p class="font-semibold">{{ issueStatusInfo.text }}</p>
            </div>
            <div v-if="showStatusDropdown" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <ul>
                <li @click.stop="changeIssueStatus('OPEN')" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Open</li>
                <li @click.stop="changeIssueStatus('IN_PROGRESS')" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">In Progress</li>
                <li @click.stop="changeIssueStatus('CLOSED')" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Closed</li>
              </ul>
            </div>
          </div>

        </div>
      </aside>
    </div>
  </div>
  <div v-else-if="error">
    <p class="text-red-500">{{ error }}</p>
  </div>
</template>

<style scoped>
/* 템플릿 내에 모든 스타일이 정의되어 있으므로 비워둡니다. */
</style>

