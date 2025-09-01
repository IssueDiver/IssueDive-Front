// router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
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
    component: IssueCreateView
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

export default router
