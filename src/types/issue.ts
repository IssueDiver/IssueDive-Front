// types/issue.ts

// export 키워드를 사용해서 다른 파일에서 이 타입을 import해서 쓸 수 있도록 합니다.
export interface Issue {
  id: number;
  title: string;
  description: string | null;
  status: string;
  authorId: number;
  assigneeId: number | null;
  labelIds: number[];
  createdAt: string;
  updatedAt: string;
}

// 백엔드의 Page<T> 객체와 동일한 구조의 타입을 추가합니다.
// <T>는 제네릭(Generic)으로, 이 페이지가 어떤 타입의 데이터를 담고 있는지 명시합니다.
export interface Page<T> {
  content: T[]; // 실제 데이터 배열 (우리 경우는 Issue[] 가 됩니다)
  totalPages: number; // 전체 페이지 수
  totalElements: number; // 전체 요소 개수
  number: number; // 현재 페이지 번호 (0부터 시작)
  size: number; // 한 페이지의 크기
}

export interface Meta {
  page: number;
  size: number;
  total: number;
}

export interface IssuesResponse {
  meta: Meta;
  issues: Issue[];
}

// 이슈 생성/수정 폼 데이터 타입 정의
export interface IssueFormData {
  title: string
  description: string
  assigneeId: number | null
  labelIds: number[]
  labelIdsString: string  // 문자열 상태
}