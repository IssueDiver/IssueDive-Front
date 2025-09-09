<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';
import api from '@/api'
import { getContrastingTextColor } from '@/utils/colors';
import type { Label } from '@/types/index'

// --- State ---
// 전체 라벨 목록
const labels = ref<Label[]>([]);
// 새 라벨 생성을 위한 폼 데이터
const newLabel = reactive({ name: '', color: '#d73a4a', description: '' });
// 수정 중인 라벨 데이터 (수정 취소를 위해 원본과 분리)
const editingLabel = ref<Label | null>(null);
// 새 라벨 생성 폼의 표시 여부를 제어하는 상태 변수
// const isCreateFormVisible = ref(false);
// 새 라벨 생성 모달의 표시 여부를 제어하는 상태 변수
const isCreateModalVisible = ref(false);

// --- API Functions ---
const fetchLabels = async () => {
  try {
    const res = await api.get<{ success: boolean; data: Label[] }>('/labels');
    if (res.data.success) {
      labels.value = res.data.data;
    }
  } catch (e) {
    console.error('라벨 목록을 불러오는 데 실패했습니다.', e);
  }
};

const createLabel = async () => {
  if (!newLabel.name.trim()) {
    alert('라벨 이름을 입력하세요.');
    return;
  }
  try {
    const res = await api.post('/labels', newLabel);
    if (res.data.success) {
      await fetchLabels(); // 전체 목록을 새로고침하여 최신 상태를 반영
      // 폼 초기화
      newLabel.name = '';
      newLabel.color = '#d73a4a';
      newLabel.description = '';
      isCreateModalVisible.value = false;
    } else {
      alert('라벨 생성 실패');
    }
  } catch (e) {
    alert('서버 오류 발생');
    console.error(e);
  }
};

const startEdit = (label: Label) => {
  // 수정할 데이터를 복사하여 editingLabel에 할당
  editingLabel.value = { ...label };
};

const cancelEdit = () => {
    editingLabel.value = null;
}

const saveEdit = async () => {
  if (!editingLabel.value) return;
  try {
    const res = await api.patch(`/labels/${editingLabel.value.id}`, editingLabel.value);
    if (res.data.success) {
      await fetchLabels(); // 전체 목록 새로고침
      editingLabel.value = null; // 수정 모드 종료
    } else {
      alert('라벨 수정 실패');
    }
  } catch (e) {
    alert('서버 오류 발생');
    console.error(e);
  }
};

const deleteLabel = async (id: number) => {
  if (!confirm('이 라벨을 삭제하시겠습니까? 이 라벨을 사용하는 모든 이슈에서 제거됩니다.')) return;
  try {
    await api.delete(`/labels/${id}`);
    await fetchLabels(); // 성공 시 목록 새로고침
  } catch (e) {
    alert('서버 오류 발생');
    console.error(e);
  }
};

// 컴포넌트가 마운트될 때 라벨 목록을 불러옵니다.
onMounted(() => {
  fetchLabels();
});
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Labels</h1>
      <button @click="isCreateModalVisible = true" class="flex-shrink-0 font-semibold px-4 py-2 rounded-md transition bg-green-600 text-white hover:bg-green-700">
        New Label
      </button>
    </div>

    <!-- v-if를 사용하여 "New Label" 버튼 클릭 시에만 모달이 보이도록 합니다. -->
    <div v-if="isCreateModalVisible" class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <!-- 모달 콘텐츠 -->
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div class="p-4 border-b">
          <h2 class="text-lg font-semibold">Create a new label</h2>
        </div>
        <div class="p-4">
          <div class="mb-4">
            <span
              class="px-3 py-1 text-sm font-semibold rounded-full"
              :style="{ 
                backgroundColor: newLabel.color,
                color: getContrastingTextColor(newLabel.color) 
              }"
            >
              {{ newLabel.name || 'Label preview' }}
            </span>
          </div>
          <form @submit.prevent="createLabel" class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div class="md:col-span-2">
              <label for="label-name" class="block text-sm font-medium text-gray-700">Label name</label>
              <input v-model="newLabel.name" id="label-name" placeholder="Label name" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div class="md:col-span-2">
              <label for="label-description" class="block text-sm font-medium text-gray-700">Description</label>
              <input v-model="newLabel.description" id="label-description" placeholder="Description (optional)" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label for="label-color" class="block text-sm font-medium text-gray-700">Color</label>
              <div class="flex items-center mt-1">
                <input v-model="newLabel.color" id="label-color" type="color" class="h-9 w-12 cursor-pointer" />
                <span class="ml-2 text-gray-600">{{ newLabel.color }}</span>
              </div>
            </div>
            <div class="md:col-span-5 text-right space-x-2">
              <button @click="isCreateModalVisible = false" type="button" class="px-4 py-2 font-semibold bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 font-semibold bg-green-600 text-white rounded-md hover:bg-green-700">
                Create label
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="mt-8 border border-gray-300 rounded-lg">
      <div class="p-4 bg-gray-50 rounded-t-lg">
        <h3 class="text-lg font-semibold">{{ labels.length }} labels</h3>
      </div>
      <ul>
        <li v-for="label in labels" :key="label.id" class="border-t border-gray-300 p-4 flex items-center justify-between">
          <template v-if="editingLabel && editingLabel.id === label.id">
              <form @submit.prevent="saveEdit" class="flex-grow grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div class="md:col-span-2">
                    <input v-model="editingLabel.name" class="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div class="md:col-span-2">
                    <input v-model="editingLabel.description" class="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <input v-model="editingLabel.color" type="color" class="h-9 w-12" />
                  </div>
                  <div class="md:col-span-5 text-right space-x-2">
                    <button type="button" @click="cancelEdit" class="px-3 py-1 font-semibold text-sm bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" class="px-3 py-1 font-semibold text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">Save changes</button>
                  </div>
              </form>
          </template>

          <template v-else>
            <div class="flex-grow">
              <span class="px-3 py-1 text-sm font-semibold rounded-full" :style="{ backgroundColor: label.color, color: getContrastingTextColor(label.color) }">
                {{ label.name }}
              </span>
              <p class="text-sm text-gray-500 mt-2">{{ label.description }}</p>
            </div>

            <div class="flex items-center space-x-4">
              <div v-if="label.issueOpenCount > 0" class="flex items-center space-x-2 text-sm text-gray-600">
                  <span class="hidden md:inline-flex items-center rounded-md bg-gray-700 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-gray-500/10">{{ label.issueOpenCount }} open issues</span>
                  <a href="#" class="hover:text-blue-600 flex items-center">
                    <svg class="w-4 h-4 text-blue-500 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    <span>{{ label.issueOpenCount }}</span>
                  </a>
              </div>
              <div class="flex-shrink-0 space-x-4 text-sm">
                <button @click="startEdit(label)" class="text-blue-600 hover:underline">Edit</button>
                <button @click="deleteLabel(label.id)" class="text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          </template>
        </li>
      </ul>
    </div>
  </div>
</template>