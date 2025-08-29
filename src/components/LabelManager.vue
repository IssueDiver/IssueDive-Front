<script setup lang="ts">
// LabelManager.vue

import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';
import type { Label } from '@/types/index'

const labels = ref<Label[]>([]);
const newLabel = reactive({ name: '', color: '#000000', description: '' });
const editingLabel = ref<Label | null>(null);

const fetchLabels = async () => {
  try {
    const res = await axios.get<{ success: boolean; data: Label[] }>('http://localhost:8080/labels');
    if (res.data.success) {
      labels.value = res.data.data;
    }
  } catch (e) {
    console.error(e);
  }
};

const createLabel = async () => {
  if (!newLabel.name.trim()) {
    alert('라벨 이름을 입력하세요.');
    return;
  }
  try {
    const res = await axios.post('http://localhost:8080/labels', newLabel);
    if (res.data.success) {
      labels.value.push(res.data.data);
      newLabel.name = '';
      newLabel.color = '#000000';
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
  editingLabel.value = { ...label };
};

const saveEdit = async () => {
  if (!editingLabel.value) return;
  try {
    const res = await axios.patch(`http://localhost:8080/labels/${editingLabel.value.id}`, editingLabel.value);
    if (res.data.success) {
      const idx = labels.value.findIndex(l => l.id === editingLabel.value?.id);
      if (idx !== -1) labels.value[idx] = res.data.data;
      editingLabel.value = null;
    } else {
      alert('라벨 수정 실패');
    }
  } catch (e) {
    alert('서버 오류 발생');
    console.error(e);
  }
};

const deleteLabel = async (id: number) => {
  if (!confirm('라벨을 삭제하시겠습니까?')) return;
  try {
    const res = await axios.delete(`http://localhost:8080/labels/${id}`);
    if (res.data.success) {
      labels.value = labels.value.filter(l => l.id !== id);
    } else {
      alert('라벨 삭제 실패');
    }
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
    <h3>라벨 관리</h3>

    <div>
      <input v-model="newLabel.name" placeholder="라벨 이름" />
      <input v-model="newLabel.color" type="color" />
      <input v-model="newLabel.description" placeholder="설명 (선택)" />
      <button @click="createLabel">생성</button>
    </div>

    <ul>
      <li v-for="label in labels" :key="label.id">
        <template v-if="editingLabel && editingLabel.id === label.id">
          <input v-model="editingLabel.name" />
          <input v-model="editingLabel.color" type="color" />
          <input v-model="editingLabel.description" />
          <button @click="saveEdit">저장</button>
          <button @click="editingLabel = null">취소</button>
        </template>
        <template v-else>
          <span :style="{ color: label.color }">{{ label.name }}</span> - {{ label.description }}
          <button @click="startEdit(label)">수정</button>
          <button @click="deleteLabel(label.id)">삭제</button>
        </template>
      </li>
    </ul>
  </div>
</template>

<style scoped>
input {
  margin-right: 0.5rem;
}
button {
  margin-left: 0.5rem;
}
</style>
