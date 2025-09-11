<script setup lang="ts">
// src/components/CommentItem.vue

import type { Comment } from '@/types/comment'
// 재귀적으로 자기 자신을 사용하기 위해 컴포넌트를 임포트합니다.
import CommentItem from './CommentItem.vue'
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/types'
import { ref } from 'vue'

const authStore = useAuthStore(); 

// --- Props ---
const props = defineProps<{
  comment: Comment;
  currentUser: User | null;
  editingCommentId: number | null;
  replyingCommentId: number | null; 
}>();

// ===== 디버깅 코드 =====
console.log('--- Comment Debug ---');
console.log('Current User ID:', props.currentUser?.id, '(Type:', typeof props.currentUser?.id, ')');
console.log('Comment Author ID:', props.comment.authorId, '(Type:', typeof props.comment.authorId, ')');
console.log('---------------------');
// ==========================================

// --- Emits ---
const emit = defineEmits<{
  (e: 'startEdit', comment: Comment): void;
  (e: 'cancelEdit'): void;
  (e: 'submitEdit', commentId: number, newText: string): void; 
  (e: 'deleteComment', commentId: number): void;
  (e: 'toggleReplyMode', commentId: number): void;
  (e: 'submitReply', parentId: number, newText: string): void;
}>();

// --- Local State ---
// 각 CommentItem이 자신의 입력창 텍스트를 관리합니다.
const editText = ref(props.comment.description);
const replyText = ref('');

const forwardStartEdit = (comment: Comment) => {
  emit('startEdit', comment);
};
const forwardCancelEdit = () => {
  emit('cancelEdit');
};
const forwardSubmitEdit = (commentId: number, newText: string) => {
  emit('submitEdit', commentId, newText);
};
const forwardDeleteComment = (commentId: number) => {
  emit('deleteComment', commentId);
};
const forwardToggleReplyMode = (commentId: number) => {
  emit('toggleReplyMode', commentId);
};
const forwardSubmitReply = (parentId: number, newText: string) => {
  emit('submitReply', parentId, newText);
};
</script>

<template>
  <div class="flex gap-4">
    <div class="flex-shrink-0">
      <img :src="`https://i.pravatar.cc/40?u=${comment.authorId}`" alt="avatar" class="w-10 h-10 rounded-full" />
    </div>

    <div class="flex-grow">
      <div v-if="editingCommentId === comment.id" class="w-full">
        <textarea v-model="editText" rows="4" class="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        <div class="mt-2 text-right space-x-2">
          <button @click="emit('cancelEdit')" class="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300">취소</button>
          <button @click="emit('submitEdit', comment.id, editText)" class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">수정 완료</button>
        </div>
      </div>

      <!-- 기본 댓글 표시 UI -->
      <div v-else class="relative border border-gray-200 rounded-lg bg-white">
        <div class="absolute top-3 -left-2 w-4 h-4 bg-white border-l border-b border-gray-200 transform rotate-45"></div>
        <div class="bg-gray-50 px-4 py-2 border-b border-gray-200 rounded-t-lg flex justify-between items-center">
          <div>
            <span class="font-semibold text-gray-800">{{ comment.author || 'user' }}</span>
            <span class="text-sm text-gray-500 ml-2">commented on {{ new Date(comment.createdAt).toLocaleDateString() }}</span>
          </div>

          <div v-if="currentUser" class="flex items-center space-x-2">
            <button @click="emit('toggleReplyMode', comment.id)" class="text-sm text-gray-500 hover:text-blue-600">답글</button>
            <template v-if="currentUser.id === comment.authorId">
              <button @click="emit('startEdit', comment)" class="text-sm text-gray-500 hover:text-blue-600">수정</button>
              <button @click="emit('deleteComment', comment.id)" class="text-sm text-gray-500 hover:text-red-600">삭제</button>
            </template>
          </div>
        </div>
        <div class="p-4">
          <p class="text-gray-800 whitespace-pre-wrap">{{ comment.description }}</p>
        </div>
      </div>

      <!-- 답글 폼 UI를 CommentItem 내부로 이동 -->
      <div v-if="replyingCommentId === comment.id" class="mt-4 flex gap-4">
          <div class="flex-shrink-0">
            <img :src="`https://i.pravatar.cc/40?u=${currentUser?.id}`" alt="my-avatar" class="w-10 h-10 rounded-full" />
          </div>
          <div class="flex-grow">
            <textarea v-model="replyText" rows="3" placeholder="답글을 입력하세요..." class="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            <div class="mt-2 text-right space-x-2">
              <button @click="emit('toggleReplyMode', comment.id)" class="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300">취소</button>
              <button @click="emit('submitReply', comment.id, replyText); replyText = ''" class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">답글 등록</button>
            </div>
          </div>
      </div>
      
      <!-- 대댓글 렌더링 (재귀) -->
      <div v-if="comment.children && comment.children.length > 0" class="mt-4 space-y-4">
        <CommentItem
          v-for="reply in comment.children"
          :key="reply.id"
          :comment="reply"
          :current-user="currentUser"
          :editing-comment-id="editingCommentId"
          :replying-comment-id="replyingCommentId"
          @start-edit="forwardStartEdit"
          @cancel-edit="forwardCancelEdit"
          @submit-edit="forwardSubmitEdit"
          @delete-comment="forwardDeleteComment"
          @toggle-reply-mode="forwardToggleReplyMode"
          @submit-reply="forwardSubmitReply"
        />
      </div>
    </div>
  </div>
</template>

