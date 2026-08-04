import { memberLink } from '../link'

export const link = memberLink('jaeheung')

export default [
  { path: '', name: 'home', component: () => import('./views/WeatherStoreHomeView.vue') },
  { path: 'about', name: 'about', component: () => import('./views/WeatherStoreAboutView.vue') },
  { path: 'weather/:cityId', name: 'detail', component: () => import('./views/WeatherStoreDetailView.vue') },
  { path: 'magpie-heung', name: 'magpie-heung', component: () => import('./views/MagpieHeungView.vue') },
]
