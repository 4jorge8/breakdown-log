import { createRouter, createWebHistory } from 'vue-router'
import ReportView from '../views/ReportView.vue'
import BreakdownsView from '../views/BreakdownsView.vue'
import IndicatorsView from '../views/IndicatorsView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'report', component: ReportView },
    { path: '/breakdowns', name: 'breakdowns', component: BreakdownsView },
    { path: '/indicators', name: 'indicators', component: IndicatorsView },
  ],
})
