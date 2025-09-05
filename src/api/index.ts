// src/api/index.ts

import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// 'qs' 라이브러리를 사용하면 더 복잡한 경우도 처리할 수 있지만, 간단한 배열 처리를 위해 직접 파라미터 직렬화 함수를 만듭니다.
const paramsSerializer = (params: Record<string, any>): string => {
  const parts: string[] = [];
  for (const key in params) {
    const value = params[key];
    if (value === null || typeof value === 'undefined') {
      continue;
    }
    // 값이 배열인 경우, 각 항목에 대해 'key=value' 쌍을 추가합니다.
    if (Array.isArray(value)) {
      value.forEach((item) => {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
      });
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.join('&');
};

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: 'http://localhost:8080', // 기본 URL 설정
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer,
});

// 요청 인터셉터 (Request Interceptor)
// 모든 API 요청이 보내지기 전에 이 코드가 먼저 실행됩니다.
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.accessToken;

    // 토큰이 있으면 Authorization 헤더에 추가
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;