<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import api from '@/api'
import { getContrastingTextColor } from '@/utils/colors';
import type { Label } from '@/types/index'

// --- State ---
const labels = ref<Label[]>([]);
const newLabel = reactive({ name: '', color: '#d73a4a', description: '' });
const editingLabel = ref<Label | null>(null);
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
      await fetchLabels();
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

// 'Edit' 버튼을 누르면, 수정할 라벨 정보를 editingLabel에 복사합니다.
// v-if="editingLabel"에 의해 편집 모달이 화면에 표시됩니다.
const startEdit = (label: Label) => {
  editingLabel.value = { ...label };
};

// 편집 모달의 'Cancel' 버튼을 누르면, editingLabel을 null로 만들어 모달을 닫습니다.
const cancelEdit = () => {
    editingLabel.value = null;
}

// 편집 모달의 'Save changes' 버튼을 누르면 API를 호출합니다.
const saveEdit = async () => {
  if (!editingLabel.value) return;
  try {
    const res = await api.patch(`/labels/${editingLabel.value.id}`, editingLabel.value);
    if (res.data.success) {
      await fetchLabels();
      editingLabel.value = null; // 성공 시 모달 닫기
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
    await fetchLabels();
  } catch (e) {
    alert('서버 오류 발생');
    console.error(e);
  }
};

onMounted(() => {
  fetchLabels();
});
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Labels</h1>
      <button
        @click="isCreateModalVisible = true"
        class="flex-shrink-0 font-semibold px-4 py-2 rounded-md transition bg-green-600 text-white hover:bg-green-700"
      >
        New Label
      </button>
    </div>

    <!-- 1. 새 라벨 생성 모달 -->
    <div v-if="isCreateModalVisible" class="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div class="p-4 border-b">
          <h2 class="text-lg font-semibold">New label</h2>
        </div>
        <div class="p-4">
          <div class="mb-4 flex justify-center">
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
            <div class="md:col-span-5">
              <label for="label-name" class="block text-sm font-medium text-gray-700">Label name</label>
              <input v-model="newLabel.name" id="label-name" placeholder="Label name" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div class="md:col-span-5">
              <label for="label-description" class="block text-sm font-medium text-gray-700">Description</label>
              <input v-model="newLabel.description" id="label-description" placeholder="Description (optional)" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div class="md:col-span-5">
              <label for="label-color" class="block text-sm font-medium text-gray-700">Color</label>
              <div class="flex items-center gap-2 mt-1">
                <input v-model="newLabel.color" id="label-color" type="color" class="p-1 h-9 w-14 block bg-white border border-gray-300 cursor-pointer rounded-md" />
                <input v-model="newLabel.color" type="text" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
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

    <!-- 2. 라벨 수정 모달 -->
    <div v-if="editingLabel" class="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div class="p-4 border-b">
          <h2 class="text-lg font-semibold">Edit label</h2>
        </div>
        <div class="p-4">
          <div class="mb-4 flex justify-center">
            <span
              class="px-3 py-1 text-sm font-semibold rounded-full"
              :style="{ backgroundColor: editingLabel.color, color: getContrastingTextColor(editingLabel.color) }"
            >
              {{ editingLabel.name || 'Label preview' }}
            </span>
          </div>
          <form @submit.prevent="saveEdit" class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div class="md:col-span-5">
              <label for="edit-label-name" class="block text-sm font-medium text-gray-700">Label name</label>
              <input v-model="editingLabel.name" id="edit-label-name" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div class="md:col-span-5">
              <label for="edit-label-description" class="block text-sm font-medium text-gray-700">Description</label>
              <input v-model="editingLabel.description" id="edit-label-description" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div class="md:col-span-5">
              <label for="edit-label-color" class="block text-sm font-medium text-gray-700">Color</label>
              <div class="flex items-center gap-2 mt-1">
                <input v-model="editingLabel.color" id="edit-label-color" type="color" class="p-1 h-9 w-14 block bg-white border border-gray-300 rounded-md" />
                <input v-model="editingLabel.color" type="text" class="block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            <div class="md:col-span-5 text-right space-x-2">
              <button @click="cancelEdit" type="button" class="px-4 py-2 font-semibold bg-gray-200 rounded-md">Cancel</button>
              <button type="submit" class="px-4 py-2 font-semibold bg-blue-600 text-white rounded-md">Save changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 3. 라벨 목록 UI-->
    <div class="mt-8 border border-gray-300 rounded-lg">
      <div class="p-4 bg-gray-50 rounded-t-lg">
        <h3 class="text-lg font-semibold">{{ labels.length }} labels</h3>
      </div>
      <ul>
        <li v-for="label in labels" :key="label.id" class="border-t border-gray-300 p-4 flex items-center justify-between gap-4">
          <div class="flex-grow flex items-center gap-4">
              <span class="flex-shrink-0 px-3 py-1 text-sm font-semibold rounded-full" :style="{ backgroundColor: label.color, color: getContrastingTextColor(label.color) }">
                {{ label.name }}
              </span>
              <p class="text-sm text-gray-500 hidden md:block">{{ label.description }}</p>
          </div>
          <div class="flex-shrink-0 flex items-center space-x-4">
            <div v-if="label.issueOpenCount > 0" class="w-10 text-sm">
              <div class="relative flex justify-center group">
                <a href="#" class="group flex items-center text-gray-600 hover:text-blue-600">
                 <svg class="w-4 h-4 text-gray-500 group-hover:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1 -18 0a9 9 0 0 1 18 0Z" />
                  </svg>
                  <span class="ml-1">{{ label.issueOpenCount }}</span>
                  <div class="absolute bottom-full mb-2 hidden group-hover:block px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-10">
                    {{ label.issueOpenCount }} open issues
                  </div>
                </a>
              </div>
            </div>
            <div v-else class="w-10"></div>
            <div class="flex-shrink-0 space-x-4 text-sm">
              <button @click="startEdit(label)" class="text-blue-600 hover:underline">Edit</button>
              <button @click="deleteLabel(label.id)" class="text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

