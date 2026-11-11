import { createRouter, createWebHistory } from 'vue-router'
import ReportView from '../views/ReportView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'report', component: ReportView }],
})
