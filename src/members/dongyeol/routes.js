import { memberLink } from '../link'

export const link = memberLink('dongyeol')

export default [
  {
    path: '',
    name: 'home',
    component: () => import('./views/WeatherHomeView.vue'),
    meta: { title: '오늘의 날씨', layout: 'weather-scene', scrollToTop: true },
  },
  {
    path: 'dashboard',
    name: 'dashboard',
    component: () => import('./views/DashboardView.vue'),
    meta: {
      title: 'API 대시보드',
      layout: 'lab-scene',
      scrollToTop: true,
      requiresAuth: true,
      auth: async () => {
        const { useAuthStore } = await import('./stores/auth.js')
        const authStore = useAuthStore()

        if (!authStore.isLoggedIn) return false

        try {
          await authStore.fetchMyProfile()
          return authStore.isLoggedIn
        } catch {
          return false
        }
      },
    },
  },
  {
    path: 'login',
    name: 'login',
    component: () => import('./views/LoginView.vue'),
    meta: { title: '로그인', layout: 'lab-scene', scrollToTop: true },
  },
  {
    path: 'about',
    name: 'about',
    component: () => import('./views/WeatherAboutView.vue'),
    meta: { title: '서비스 소개', layout: 'weather-scene', scrollToTop: true },
  },
  {
    path: 'weather/:cityId',
    name: 'detail',
    component: () => import('./views/WeatherDetailView.vue'),
    meta: { title: '도시 날씨', layout: 'weather-scene', scrollToTop: true },
  },
  {
    path: '404',
    name: 'not-found',
    component: () => import('./views/NotFoundView.vue'),
    meta: { title: '페이지를 찾을 수 없음', scrollToTop: true },
  },
  {
    path: ':pathMatch(.*)*',
    name: 'missing',
    component: () => import('./views/NotFoundView.vue'),
    meta: { title: '페이지를 찾을 수 없음', scrollToTop: true },
  },
]
