<script setup lang="ts">
// src/components/CommentItem.vue

import type { Comment } from '@/types/comment'
// 재귀적으로 자기 자신을 사용하기 위해 컴포넌트를 임포트합니다.
import CommentItem from './CommentItem.vue'
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore(); 

// --- Props ---
const props = defineProps<{
  comment: Comment;
}>();

// --- Emits ---
const emit = defineEmits<{
  (e: 'startEdit', comment: Comment): void;
  (e: 'deleteComment', commentId: number): void;
  (e: 'toggleReplyMode', commentId: number): void;
}>();

// --- Event Forwarding Handlers ---
const forwardStartEdit = (comment: Comment) => {
  emit('startEdit', comment);
};
const forwardDeleteComment = (id: number) => {
  emit('deleteComment', id);
};
const forwardToggleReplyMode = (id: number) => {
  emit('toggleReplyMode', id);
};
</script>

<template>
  <div class="flex gap-4">
    <div class="flex-shrink-0">
      <img :src="`https://i.pravatar.cc/40?u=${comment.authorId}`" alt="avatar" class="w-10 h-10 rounded-full" />
    </div>

    <div class="flex-grow">
      <div class="relative border border-gray-200 rounded-lg bg-white">
        <div class="absolute top-3 -left-2 w-4 h-4 bg-white border-l border-b border-gray-200 transform rotate-45"></div>

        <div class="bg-gray-50 px-4 py-2 border-b border-gray-200 rounded-t-lg flex justify-between items-center">
          <div>
            <span class="font-semibold text-gray-800">{{ comment.author || 'user' }}</span>
            <span class="text-sm text-gray-500 ml-2">commented on {{ new Date(comment.createdAt).toLocaleDateString() }}</span>
          </div>

          <div v-if="authStore.currentUserId === comment.authorId" class="flex items-center space-x-2">
            <button @click="emit('toggleReplyMode', comment.id)" class="text-sm text-gray-500 hover:text-blue-600">답글</button>
            <button @click="emit('startEdit', comment)" class="text-sm text-gray-500 hover:text-blue-600">수정</button>
            <button @click="emit('deleteComment', comment.id)" class="text-sm text-gray-500 hover:text-red-600">삭제</button>
          </div>
          <div v-else>
            <button @click="emit('toggleReplyMode', comment.id)" class="text-sm text-gray-500 hover:text-blue-600">답글</button>
          </div>

        </div>

        <div class="p-4">
          <p class="text-gray-800 whitespace-pre-wrap">{{ comment.description }}</p>
        </div>
      </div>

      <div v-if="comment.children && comment.children.length > 0" class="mt-4 space-y-4">
        <CommentItem
          v-for="reply in comment.children"
          :key="reply.id"
          :comment="reply"
          @start-edit="forwardStartEdit"
          @delete-comment="forwardDeleteComment"
          @toggle-reply-mode="forwardToggleReplyMode"
        />
      </div>
    </div>
  </div>
</template>