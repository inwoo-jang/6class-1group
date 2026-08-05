import { memberLink } from '../link'

/**
 * 가연의 주소표.
 * ------------------------------------------------------------------
 * 원래 router/index.js 에 있던 것과 같은 화면, 같은 순서다.
 * 다만 여기서는 앞의 '/' 를 뗀다 — 부모(/m/gayeon)가 이미 붙여 준다.
 */
export const link = memberLink('gayeon')

export default [
  {
    path: '',
    name: 'home',
    component: () => import('./views/WeatherHomeView.vue'),
  },
  {
    path: 'about',
    name: 'about',
    component: () => import('./views/WeatherAboutView.vue'),
  },
  {
    path: 'festivals',
    name: 'festivals',
    component: () => import('./views/FestivalListView.vue'),
  },
  {
    path: 'weather/:cityId',
    name: 'weatherDetail',
    component: () => import('./views/WeatherDetailView.vue'),
  },
  {
    path: 'mock-api',
    name: 'mockApi',
    component: () => import('./views/MockApiView.vue'),
  },
  {
    path: 'signup',
    name: 'signup',
    component: () => import('./views/SignupView.vue'),
  },
  {
    path: 'login',
    name: 'login',
    component: () => import('./views/LoginView.vue'),
  },
  {
    path: ':pathMatch(.*)*',
    name: 'notFound',
    component: () => import('./views/NotFoundView.vue'),
  },
]
