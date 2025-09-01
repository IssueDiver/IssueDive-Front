// config/mockConfig.ts

export const useMock = false;

export const mockUsers = [
  { id: 1, username: 'testuser1', password: 'password', email: 'testuser1@example.com' },
  { id: 2, username: 'testuser2', password: 'password', email: 'testuser2@example.com' },
  { id: 3, username: 'testuser3', password: 'password', email: 'testuser3@example.com' },
]

export interface MockLoginSuccess {
  success: true
  user: { id: number; username: string; email: string }
}
export interface MockLoginFail {
  success: false
  message: string
}
export type MockLoginResult = MockLoginSuccess | MockLoginFail

export type MockRegisterResult =  { 
  success: boolean; 
  message?: string 
}

export async function mockLogin(username: string, password: string): Promise<MockLoginResult>  {
  const user = mockUsers.find(u => u.username === username && u.password === password)
  if (user) {
    return { success: true, user }
  }
  return { success: false, message: '사용자명 또는 비밀번호가 틀렸습니다.' }
}

export async function mockRegister(username: string, email: string, password: string): Promise<MockRegisterResult> {
  const exists = mockUsers.some(u => u.username === username)
  if (exists) {
    return { success: false, message: '이미 존재하는 사용자명입니다.' }
  }
  mockUsers.push({ id: mockUsers.length + 1, username, email, password })
  return { success: true }
}
