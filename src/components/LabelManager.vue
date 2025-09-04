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
    <div class="p-4 border border-gray-300 rounded-lg">
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
        <div class="md:col-span-5 text-right">
          <button type="submit" class="px-4 py-2 font-semibold bg-green-600 text-white rounded-md hover:bg-green-700">
            Create label
          </button>
        </div>
      </form>
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
            <div class="flex-shrink-0 space-x-4 text-sm">
              <button @click="startEdit(label)" class="text-blue-600 hover:underline">Edit</button>
              <button @click="deleteLabel(label.id)" class="text-red-600 hover:underline">Delete</button>
            </div>
          </template>
        </li>
      </ul>
    </div>
  </div>
</template>