<script setup lang="ts">
// src/components/CommentSection.vue

// --- Imports ---
import { ref, onMounted } from 'vue'
import api from '@/api'
import CommentItem from './CommentItem.vue' // 새로 만든 CommentItem 컴포넌트를 임포트합니다.
import { useMock } from '@/config/mockConfig'
import type { Comment } from '@/types/comment'
import { useAuthStore } from '@/stores/auth' 

// --- Props ---
const props = defineProps<{ issueId: number }>()

// --- State Management ---
const comments = ref<Comment[]>([])
const newComment = ref('')
const authStore = useAuthStore()
const currentUser = authStore.user
const editingCommentId = ref<number | null>(null)
const replyingCommentId = ref<number | null>(null)

// --- API Functions ---
/**
 * 서버 혹은 모킹으로 댓글 목록 불러오기
 */
const fetchComments = async () => {
  try {
    if (useMock) {
      // comments.value = mockComments
    } else {
      // 백엔드 API 응답 구조에 맞게 수정
      const response = await api.get<{ success: boolean; data: Comment[] }>(
        `/api/issues/${props.issueId}/comments`
      )
      if (response.data.success) {
        comments.value = response.data.data
      }
    }
  } catch (e) {
    console.error('댓글 조회 실패', e)
  }
};

/**
 * 새 댓글 등록
 */
const submitComment = async () => {
  if (!newComment.value.trim()) {
    alert('댓글 내용을 입력하세요.')
    return
  }
  try {
    const response = await api.post(
      `/api/issues/${props.issueId}/comments`,
      { description: newComment.value }
    )
    if (response.data.success) {
      newComment.value = ''
      await fetchComments() // 목록 새로고침
    } else {
      alert('댓글 작성 실패')
    }
  } catch (e) {
    console.error('댓글 작성 중 서버 오류 발생', e);
    alert('서버 오류 발생')
  }
};

/**
 * 댓글 수정 제출
 */
const submitEdit = async (commentId: number, newText: string) => {
  if (!newText.trim()) return;
  try {
    await api.patch(`/api/issues/${props.issueId}/comments/${commentId}`, { description: newText });
    await fetchComments();
    cancelEdit(); // 수정 모드 종료
  } catch(e) { console.error('댓글 수정 실패', e); }
};

/**
 * 댓글 삭제
 */
const deleteComment = async (commentId: number) => {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  try {
    await api.delete(`/api/issues/${props.issueId}/comments/${commentId}`);
    await fetchComments();
  } catch(e) { console.error('댓글 삭제 실패', e); }
};

/**
 * 대댓글(답글) 등록
 */
const submitReply = async (parentId: number, newText: string) => {
  if (!newText.trim()) return;
  try {
    await api.post(`/api/issues/${props.issueId}/comments`, { description: newText, parentId });
    await fetchComments();
    replyingCommentId.value = null; // 답글 모드 종료
  } catch(e) { console.error('대댓글 작성 실패', e); }
};

// --- Event Handlers (자식 컴포넌트로부터 받은 이벤트를 처리) ---

/**
 * 수정 모드 시작
 */
const handleStartEdit = (comment: Comment) => {
  editingCommentId.value = comment.id;
  replyingCommentId.value = null; // 다른 모드는 닫기
};

/**
 * 수정 모드 취소
 */
const cancelEdit = () => {
  editingCommentId.value = null;
};


/**
 * 답글 모드 토글
 */
const handleToggleReplyMode = (commentId: number) => {
  editingCommentId.value = null; // 다른 모드는 닫기
  // 이미 열려있던 답글창을 다시 누르면 닫습니다.
  if (replyingCommentId.value === commentId) {
    replyingCommentId.value = null;
  } else {
    replyingCommentId.value = commentId;
  }
};


// --- Lifecycle Hook ---
onMounted(() => {
  fetchComments()
})
</script>

<template>
  <div class="comment-section mt-8">
    <div class="space-y-6">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :current-user="currentUser"
        :editing-comment-id="editingCommentId"
        :replying-comment-id="replyingCommentId"
        @start-edit="handleStartEdit"
        @cancel-edit="cancelEdit"
        @submit-edit="submitEdit"
        @delete-comment="deleteComment"
        @toggle-reply-mode="handleToggleReplyMode"
        @submit-reply="submitReply"
      />
    </div>

    <!-- 새 댓글 작성 폼 -->
    <div class="mt-8 pt-6 border-t border-gray-200 flex gap-4">
      <div class="flex-shrink-0">
        <img :src="`https://i.pravatar.cc/40?u=${currentUser?.id}`" alt="my-avatar" class="w-10 h-10 rounded-full" />
      </div>
      <div class="flex-grow">
        <div class="border border-gray-300 rounded-lg">
          <textarea v-model="newComment" placeholder="새로운 댓글을 입력하세요..." rows="5" class="w-full p-3 border-b border-gray-300 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          <div class="p-3 bg-gray-50 rounded-b-lg flex justify-end">
            <button @click="submitComment" class="px-4 py-2 font-semibold bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300" :disabled="!newComment.trim()">
              댓글 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

