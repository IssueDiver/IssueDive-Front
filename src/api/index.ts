// src/api/index.ts

import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: 'http://localhost:8080', // 기본 URL 설정
  headers: {
    'Content-Type': 'application/json',
  },
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