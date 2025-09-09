// types/index.ts

export interface User {
  id: number
  username: string
  email: string
}

export interface Label {
  id: number
  name: string
  color: string
  description?: string
  issueOpenCount: number;
}
