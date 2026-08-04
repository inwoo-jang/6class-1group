import { memberLink } from '../link'

export const link = memberLink('jaeheung')

export default [
  { path: '', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: 'about', name: 'about', component: () => import('./views/AboutView.vue') },
  { path: 'weather/:cityId', name: 'detail', component: () => import('./views/DetailView.vue') },
]
