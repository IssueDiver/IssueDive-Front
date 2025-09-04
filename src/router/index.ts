// router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'; 
import HomeView from '@/views/HomeView.vue'
import IssueDetail from '@/views/IssueDetail.vue' // 상세 페이지 import
import LabelManager from '@/components/LabelManager.vue' // 라벨 관리 페이지 컴포넌트
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import IssueCreateView from '@/views/IssueCreateView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/issues/new', 
    name: 'issue-create',
    component: IssueCreateView,
    meta: { requiresAuth: true } // login이 필요한 페이지
  },
  {
    path: '/issues/:id',
    name: 'issue-detail',
    component: IssueDetail,
    props: true
  },
  {
    path: '/labels',
    name: 'label-manager',
    component: LabelManager
  },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 네비게이션 가드
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  // 로그인이 필요한 페이지에 접근하려 할 때
  if (to.meta.requiresAuth && !isAuthenticated) {
    // 로그인 되어 있지 않으면 로그인 페이지로 리디렉션
    next({ name: 'login' });
  } 
  // 로그인된 상태에서 로그인/회원가입 페이지에 접근하려 할 때
  else if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    // 홈으로 리디렉션
    next({ name: 'home' });
  } 
  // 그 외의 경우는 정상적으로 진행
  else {
    next();
  }
});

export default router
