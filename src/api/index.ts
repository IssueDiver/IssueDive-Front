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
  baseURL: import.meta.env.VITE_API_BASE_URL,
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

// 응답 인터셉터 (Response Interceptor)
// 모든 API 응답을 받은 후에 이 코드가 먼저 실행됩니다.
api.interceptors.response.use(
  (response) => {
    // 1. 성공적인 응답(2xx 상태 코드)은 아무것도 하지 않고 그대로 반환합니다.
    return response;
  },
  (error) => {
    // 2. 에러가 발생한 응답을 처리합니다.
    const authStore = useAuthStore();

    // 3. 만약 에러 응답이 존재하고, 그 상태 코드가 401(Unauthorized)이라면
    // 그리고 아직 세션 만료 알림이 표시되지 않았다면
    if (error.response && error.response.status === 401
      && !authStore.sessionExpiredAlertShown) {
      // 4. 플래그를 true로 설정하여 중복 알림 방지
      // 사용자에게 상황 알림
      authStore.sessionExpiredAlertShown = true;
      alert('세션이 만료되었습니다. 다시 로그인해주세요.');

      // 5. authStore의 logout 액션을 호출합니다.
      //    (이 액션은 localStorage를 비우고 로그인 페이지로 리디렉션합니다.)
      authStore.logout();
    }

    // 6. 처리된 에러를 반환하여, 각 API를 호출한 컴포넌트의 .catch() 블록에서도
    //    추가적인 에러 처리를 할 수 있도록 합니다.
    return Promise.reject(error);
  }
);


export default api;