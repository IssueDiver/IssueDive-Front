<script setup lang="ts">
// src/components/CommentSection.vue

// --- Imports ---
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import api from '@/api'
import CommentItem from './CommentItem.vue' // 새로 만든 CommentItem 컴포넌트를 임포트합니다.
import { useMock } from '@/config/mockConfig'
import type { Comment } from '@/types/comment'

// --- Props ---
const props = defineProps<{ issueId: number }>()

// --- State Management ---
// 전체 댓글 목록 (백엔드에서 받은 트리 구조)
const comments = ref<Comment[]>([])
// 새 댓글 입력을 위한 상태
const newComment = ref('')
// 수정 모드를 위한 상태
const editingCommentId = ref<number | null>(null)
const editText = ref('')
// 답글 모드를 위한 상태
const replyTexts = reactive<Record<number, string>>({})
const replyMode = reactive<Record<number, boolean>>({})

// --- Mock Data ---
const mockComments: Comment[] = [
  {
    id: 1, issueId: props.issueId, authorId: 1, author: 'jiwoo', parentId: null,
    description: '첫 번째 테스트 댓글입니다. UI가 어떻게 보이나요?',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    children: [
      {
        id: 3, issueId: props.issueId, authorId: 1, author: 'jiwoo', parentId: 1,
        description: '네, 동의합니다. 타임라인 형태가 마음에 들어요.',
        createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        children: []
      }
    ]
  },
  {
    id: 2, issueId: props.issueId, authorId: 2, author: 'gemini', parentId: null,
    description: 'Tailwind CSS를 적용하니 훨씬 보기 좋아졌네요!',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    children: []
  }
];

// --- API Functions ---
/**
 * 서버 혹은 모킹으로 댓글 목록 불러오기
 */
const fetchComments = async () => {
  try {
    if (useMock) {
      comments.value = mockComments
    } else {
      // 백엔드 API 응답 구조에 맞게 수정
      const response = await api.get<{ success: boolean; data: Comment[] }>(
        `/issues/${props.issueId}/comments`
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
      `/issues/${props.issueId}/comments`,
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
const submitEdit = async (commentId: number) => {
  if (!editText.value.trim()) {
    alert('수정할 댓글 내용을 입력하세요.')
    return
  }
  try {
    const response = await api.patch(
      `/issues/${props.issueId}/comments/${commentId}`,
      { description: editText.value }
    )
    if (response.data.success) {
      await fetchComments() // 목록 새로고침
      cancelEdit()
    } else {
      alert('댓글 수정 실패')
    }
  } catch(e) {
    console.error('댓글 수정 중 서버 오류 발생', e);
    alert('서버 오류 발생')
  }
};

/**
 * 댓글 삭제
 */
const deleteComment = async (commentId: number) => {
  if (!confirm('댓글을 삭제하시겠습니까?')) return
  try {
    // 백엔드 API가 noContent(204)를 반환하므로 응답 본문 처리는 필요 없을 수 있습니다.
    await api.delete(
      `/issues/${props.issueId}/comments/${commentId}`
    )
    await fetchComments() // 성공 시 목록 새로고침
  } catch(e) {
    console.error('댓글 삭제 중 서버 오류 발생', e);
    alert('서버 오류 발생')
  }
};

/**
 * 대댓글(답글) 등록
 */
const submitReply = async (parentId: number) => {
  const text = replyTexts[parentId]?.trim()
  if (!text) {
    alert('대댓글 내용을 입력하세요.')
    return
  }
  try {
    const response = await api.post(
      `/issues/${props.issueId}/comments`,
      { description: text, parentId } // 부모 ID 포함하여 요청
    )
    if (response.data.success) {
      await fetchComments() // 목록 새로고침
      replyTexts[parentId] = ''
      replyMode[parentId] = false
    } else {
      alert('대댓글 작성 실패')
    }
  } catch(e) {
    console.error('대댓글 작성 중 서버 오류 발생', e);
    alert('서버 오류 발생')
  }
};


// --- Event Handlers (자식 컴포넌트로부터 받은 이벤트를 처리) ---

/**
 * 수정 모드 시작
 */
const handleStartEdit = (comment: Comment) => {
  editingCommentId.value = comment.id
  editText.value = comment.description
};

/**
 * 수정 모드 취소
 */
const cancelEdit = () => {
  editingCommentId.value = null
  editText.value = ''
};

/**
 * 답글 모드 토글
 */
const handleToggleReplyMode = (commentId: number) => {
  // 모든 답글 창을 닫고 클릭한 것만 열기 (선택적 UX 개선)
  Object.keys(replyMode).forEach(key => {
    replyMode[Number(key)] = false;
  });
  replyMode[commentId] = !replyMode[commentId];

  if (!replyMode[commentId]) {
    replyTexts[commentId] = ''
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
      <div v-for="comment in comments" :key="comment.id">
        <div v-if="editingCommentId === comment.id" class="flex gap-4">
          <div class="flex-shrink-0">
            <img :src="`https://i.pravatar.cc/40?u=${comment.authorId}`" alt="avatar" class="w-10 h-10 rounded-full" />
          </div>
          <div class="flex-grow">
            <textarea v-model="editText" rows="4" class="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            <div class="mt-2 text-right space-x-2">
              <button @click="cancelEdit" class="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300">취소</button>
              <button @click="submitEdit(comment.id)" class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">수정 완료</button>
            </div>
          </div>
        </div>

        <CommentItem
          v-else
          :comment="comment"
          @start-edit="handleStartEdit"
          @delete-comment="deleteComment"
          @toggle-reply-mode="handleToggleReplyMode"
        />
        
        <div v-if="replyMode[comment.id]" class="mt-4 flex gap-4 ml-14">
            <div class="flex-shrink-0">
              <img src="https://i.pravatar.cc/40?u=currentUser" alt="my-avatar" class="w-10 h-10 rounded-full" />
            </div>
            <div class="flex-grow">
              <textarea v-model="replyTexts[comment.id]" rows="3" placeholder="답글을 입력하세요..." class="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              <div class="mt-2 text-right space-x-2">
                <button @click="handleToggleReplyMode(comment.id)" class="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300">취소</button>
                <button @click="submitReply(comment.id)" class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">답글 등록</button>
              </div>
            </div>
          </div>
      </div>
    </div>

    <div class="mt-8 pt-6 border-t border-gray-200 flex gap-4">
      <div class="flex-shrink-0">
        <img src="https://i.pravatar.cc/40?u=currentUser" alt="my-avatar" class="w-10 h-10 rounded-full" />
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

<style scoped>
/* Tailwind CSS를 사용하므로 스타일은 비워둡니다. */
</style>