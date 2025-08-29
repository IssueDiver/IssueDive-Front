<script setup lang="ts">
// CommentSection.vue

import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import { useMock } from '@/config/mockConfig'
import type { Comment } from '@/types/comment'

const props = defineProps<{ issueId: number }>()

// 댓글 목록 상태
const comments = ref<Comment[]>([])

// 새 댓글 입력 상태
const newComment = ref('')

// 수정 중인 댓글 ID와 수정 텍스트 기록
const editingCommentId = ref<number | null>(null)
const editText = ref('')

// 대댓글 입력 상태 관리 객체: 댓글 ID별 대댓글 입력 텍스트
const replyTexts = reactive<Record<number, string>>({})

// 대댓글 작성 모드 상태 관리: 댓글 ID별 true/false
const replyMode = reactive<Record<number, boolean>>({})

// 목업 댓글 데이터
const mockComments: Comment[] = [
  {
    id: 1,
    issueId: props.issueId,
    authorId: 1,
    parentId: null,
    description: '테스트 댓글 1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: []
  },
  {
    id: 2,
    issueId: props.issueId,
    authorId: 2,
    parentId: null,
    description: '테스트 댓글 2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: []
  }
]

/**
 * 서버 혹은 모킹으로 댓글 목록 불러오기
 */
const fetchComments = async () => {
  try {
    if (useMock) {
      comments.value = mockComments
    } else {
      const response = await axios.get<{ success: boolean; data: { comments: Comment[] } }>(
        `http://localhost:8080/issues/${props.issueId}/comments`
      )
      if (response.data.success) {
        comments.value = response.data.data.comments
      }
    }
  } catch (e) {
    console.error('댓글 조회 실패', e)
  }
}

/**
 * 새 댓글 등록
 */
const submitComment = async () => {
  if (!newComment.value.trim()) {
    alert('댓글 내용을 입력하세요.')
    return
  }

  try {
    if (useMock) {
      const newId = comments.value.length + 1
      comments.value.push({
        id: newId,
        issueId: props.issueId,
        authorId: 1,
        parentId: null,
        description: newComment.value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: []
      })
      newComment.value = ''
    } else {
      const response = await axios.post(
        `http://localhost:8080/issues/${props.issueId}/comments`,
        { description: newComment.value }
      )
      if (response.data.success) {
        newComment.value = ''
        await fetchComments()
      } else {
        alert('댓글 작성 실패')
      }
    }
  } catch {
    alert('서버 오류 발생')
  }
}

/**
 * 댓글 수정 시작 - 수정창 열기
 */
const startEdit = (comment: Comment) => {
  editingCommentId.value = comment.id
  editText.value = comment.description
}

/**
 * 댓글 수정 취소
 */
const cancelEdit = () => {
  editingCommentId.value = null
  editText.value = ''
}

/**
 * 댓글 수정 제출
 */
const submitEdit = async (commentId: number) => {
  if (!editText.value.trim()) {
    alert('수정할 댓글 내용을 입력하세요.')
    return
  }

  try {
    if (useMock) {
      const comment = comments.value.find(c => c.id === commentId)
      if (comment) {
        comment.description = editText.value
        comment.updatedAt = new Date().toISOString()
      }
      cancelEdit()
    } else {
      const response = await axios.patch(
        `http://localhost:8080/issues/${props.issueId}/comments/${commentId}`,
        { description: editText.value }
      )
      if (response.data.success) {
        await fetchComments()
        cancelEdit()
      } else {
        alert('댓글 수정 실패')
      }
    }
  } catch {
    alert('서버 오류 발생')
  }
}

/**
 * 댓글 삭제
 */
const deleteComment = async (commentId: number) => {
  if (!confirm('댓글을 삭제하시겠습니까?')) return

  try {
    if (useMock) {
      comments.value = comments.value.filter(c => c.id !== commentId)
    } else {
      const response = await axios.delete(
        `http://localhost:8080/issues/${props.issueId}/comments/${commentId}`
      )
      if (response.data.success) {
        await fetchComments()
      } else {
        alert('댓글 삭제 실패')
      }
    }
  } catch {
    alert('서버 오류 발생')
  }
}

/**
 * 대댓글 작성 모드 토글
 */
const toggleReplyMode = (commentId: number) => {
  replyMode[commentId] = !replyMode[commentId]
  if (!replyMode[commentId]) {
    replyTexts[commentId] = ''
  }
}

/**
 * 대댓글 등록
 */
const submitReply = async (parentId: number) => {
  const text = replyTexts[parentId]?.trim()
  if (!text) {
    alert('대댓글 내용을 입력하세요.')
    return
  }

  try {
    if (useMock) {
      const newId = comments.value.length + 1
      comments.value.push({
        id: newId,
        issueId: props.issueId,
        authorId: 1,
        parentId,
        description: text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: []
      })
      replyTexts[parentId] = ''
      replyMode[parentId] = false
    } else {
      const response = await axios.post(
        `http://localhost:8080/issues/${props.issueId}/comments`,
        { description: text, parentId }
      )
      if (response.data.success) {
        await fetchComments()
        replyTexts[parentId] = ''
        replyMode[parentId] = false
      } else {
        alert('대댓글 작성 실패')
      }
    }
  } catch {
    alert('서버 오류 발생')
  }
}

onMounted(() => {
  fetchComments()
})
</script>

<template>
  <div class="comment-section">
    <h3>댓글</h3>
    <!-- 새 댓글 작성 폼 -->
    <textarea v-model="newComment" placeholder="댓글을 입력하세요" rows="3" class="comment-input"></textarea>
    <button @click="submitComment">댓글 등록</button>

    <!-- 댓글 리스트 -->
    <ul class="comment-list">
      <li v-for="comment in comments.filter(c => !c.parentId)" :key="comment.id" class="comment-item">
        <div v-if="editingCommentId === comment.id">
          <textarea v-model="editText" rows="3"></textarea>
          <button @click="submitEdit(comment.id)">수정 완료</button>
          <button @click="cancelEdit">수정 취소</button>
        </div>
        <div v-else>
          <p>{{ comment.description }}</p>
          <small>작성일: {{ new Date(comment.createdAt).toLocaleString() }}</small>

          <div class="comment-actions">
            <button @click="startEdit(comment)">수정</button>
            <button @click="deleteComment(comment.id)">삭제</button>
            <button @click="toggleReplyMode(comment.id)">답글</button>
          </div>
        </div>

        <!-- 대댓글 입력 영역 -->
        <div v-if="replyMode[comment.id]" class="reply-form">
          <textarea v-model="replyTexts[comment.id]" rows="2" placeholder="답글을 입력하세요"></textarea>
          <button @click="submitReply(comment.id)">답글 등록</button>
          <button @click="toggleReplyMode(comment.id)">취소</button>
        </div>

        <!-- 대댓글 리스트 -->
        <ul class="reply-list">
          <li v-for="reply in comments.filter(c => c.parentId === comment.id)" :key="reply.id" class="reply-item">
            <p>{{ reply.description }}</p>
            <small>작성일: {{ new Date(reply.createdAt).toLocaleString() }}</small>
            <div class="comment-actions">
              <button @click="startEdit(reply)">수정</button>
              <button @click="deleteComment(reply.id)">삭제</button>
            </div>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.comment-section {
  margin-top: 2rem;
}
.comment-input {
  width: 100%;
  padding: 0.5rem;
  resize: vertical;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
.comment-list,
.reply-list {
  list-style: none;
  padding: 0;
}
.comment-item {
  border-bottom: 1px solid #ddd;
  padding: 0.5rem 0;
}
.comment-actions button {
  margin-right: 0.5rem;
}
.reply-form {
  margin: 0.5rem 0 1rem 1rem;
}
.reply-item {
  border-left: 3px solid #ddd;
  padding-left: 1rem;
  margin-bottom: 0.5rem;
}
</style>
