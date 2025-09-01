//types/comment.ts

export interface Comment {
  id: number
  issueId: number
  authorId: number
  author?: string // 백엔드에서 author 필드를 보내주므로 username 객체 대신 string으로 변경
  parentId: number | null
  description: string
  createdAt: string // 백엔드 타입이 LocalDateTime이므로 string으로 받습니다.
  updatedAt: string
  children?: Comment[] 
}