import { memberLink } from '../link'

export const link = memberLink('youngwoo')

export default [
  { path: '', name: 'home', component: () => import('./views/WeatherHomeView.vue') },
  { path: 'about', name: 'about', component: () => import('./views/WeatherAboutView.vue') },
  {
    path: 'weather/:cityId',
    name: 'detail',
    component: () => import('./views/WeatherDetailView.vue'),
  },
  {
    path: ':pathMatch(.*)*',
    name: 'missing',
    component: () => import('./views/NotFoundView.vue'),
  },
]
