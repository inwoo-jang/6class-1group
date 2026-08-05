import { createRouter, createWebHistory } from 'vue-router'
import WeatherHomeView from '../views/WeatherHomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: WeatherHomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/WeatherAboutView.vue'),
    },
    {
      path: '/festivals',
      name: 'festivals',
      component: () => import('../views/FestivalListView.vue'),
    },
    {
      path: '/weather/:cityId',
      name: 'weatherDetail',
      component: () => import('../views/WeatherDetailView.vue'),
    },
    { path: '/mock-api', name: 'mockApi', component: () => import('../views/MockApiView.vue') },
    { path: '/signup', name: 'signup', component: () => import('../views/SignupView.vue') },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

export default router
