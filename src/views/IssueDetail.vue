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

const getUserById = (id: number | null) => users.value.find(u => u.id === id) || null
const getLabelById = (id: number) => labels.value.find(l => l.id === id) || null

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
    const response = await api.patch(`/issues/${issueId.value}/status`, { status: newStatus });
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
  try { await api.patch(`/issues/${issueId.value}`, { assigneeIds: issue.value.assigneeIds }); } 
  catch (err) { alert('담당자 수정에 실패했습니다.'); fetchIssueDetail(); }
};

const toggleLabelAndUpdate = async (labelId: number) => {
  if (!issue.value) return;
  const ids = issue.value.labelIds || [];
  const index = ids.indexOf(labelId);
  if (index === -1) { ids.push(labelId); } else { ids.splice(index, 1); }
  issue.value.labelIds = [...ids];
  try { await api.patch(`/issues/${issueId.value}`, { labelIds: issue.value.labelIds }); } 
  catch (err) { alert('라벨 수정에 실패했습니다.'); fetchIssueDetail(); }
}

const createAndApplyLabel = async () => {
  const name = newLabelName.value.trim();
  if (!name || !issue.value) return;
  if (labels.value.some(l => l.name.toLowerCase() === name.toLowerCase())) { alert('이미 존재하는 라벨입니다.'); newLabelName.value = ''; return; }
  try {
    const res = await api.post('/labels', { name, color: generateRandomHexColor(), description: '' });
    if (res.data.success) {
      const newLabel = res.data.data;
      labels.value.push(newLabel);
      issue.value.labelIds = [...issue.value.labelIds, newLabel.id];
      await api.patch(`/issues/${issueId.value}`, { labelIds: issue.value.labelIds });
      newLabelName.value = '';
      showLabelDropdown.value = false;
    }
  } catch (err) { alert('새 라벨 생성 및 적용에 실패했습니다.'); fetchIssueDetail(); }
}

const fetchIssueDetail = async () => {
  try {
    loading.value = true;
    // ⭐️ 4. Promise.all 배열 안에서 누락되었던 쉼표(,)를 추가합니다.
    const [issueRes, labelRes, userRes, navRes] = await Promise.all([
      api.get(`/issues/${issueId.value}`),
      api.get('/labels'),
      api.get('/auth/users'),
      api.get(`/issues/${issueId.value}/navigation`, { params: route.query })
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
    const response = await api.patch(`/issues/${issueId.value}`, {
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
      await api.delete(`/issues/${issueId.value}`);
      alert('이슈가 삭제되었습니다.');
      router.push({ name: 'home' });
    } catch (err) {
      console.error('Failed to delete issue:', err);
      alert('이슈 삭제에 실패했습니다.');
    }
  }
}

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
      <!-- 제목, 상태, 작성자 정보 (기존 구조 유지) -->
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

          <div class="relative" ref="labelDropdownContainer">
            <div @click="showLabelDropdown = !showLabelDropdown" class="p-4 border rounded-md bg-white cursor-pointer hover:bg-gray-50">
              <h3 class="text-sm font-semibold text-gray-500 mb-2">Labels</h3>
              <div v-if="issue.labelIds.length > 0" class="flex flex-wrap gap-2">
                <span v-for="labelId in issue.labelIds" :key="labelId" :style="{ backgroundColor: getLabelById(labelId)?.color, color: getContrastingTextColor(getLabelById(labelId)?.color || '#000000') }" class="px-3 py-1 text-xs font-semibold rounded-full shadow-sm">{{ getLabelById(labelId)?.name }}</span>
              </div>
              <p v-else class="text-sm text-gray-500">None yet</p>
            </div>
             <div v-if="showLabelDropdown" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <ul class="max-h-60 overflow-auto">
                <li class="p-2">
                  <input v-model="newLabelName" @keydown.enter.prevent="createAndApplyLabel" @click.stop type="text" placeholder="새 라벨 입력 후 Enter" class="block w-full text-xs px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </li>
                <li v-for="label in labels" :key="label.id" @click.stop="toggleLabelAndUpdate(label.id)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center">
                  <input type="checkbox" :checked="issue.labelIds.includes(label.id)" class="mr-3 pointer-events-none" />
                  <span :style="{ backgroundColor: label.color, color: getContrastingTextColor(label.color) }" class="px-2 py-0.5 text-xs font-semibold rounded-full">{{ label.name }}</span>
                </li>
              </ul>
            </div>
          </div>

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

