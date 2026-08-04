import { createRouter, createWebHistory } from 'vue-router'
import IndexView from '../views/IndexView.vue'

const routes = [
  { path: '/', name: 'index', component: IndexView },
  {
    // 팀원 한 명의 결과물
    path: '/m/:slug',
    name: 'member',
    component: () => import('../views/MemberView.vue'),
    props: true,
  },
  {
    // 나머지를 전부 받는다. 반드시 맨 마지막.
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (to, from, saved) => saved ?? { top: 0 },
})
