//types/comment.ts

export interface Comment {
  id: number
  issueId: number
  authorId: number
  parentId: number | null
  description: string
  createdAt: string
  updatedAt: string
  children?: Comment[] // 대댓글 배열
}
