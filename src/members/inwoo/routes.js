/**
 * 장인우 · 하위 주소표
 * ------------------------------------------------------------------
 * 여기 적은 경로는 전부 /m/inwoo 아래에 붙는다.
 *
 *   ''                 → /m/inwoo             홈 — 오늘 한눈에
 *   'weather'          → /m/inwoo/weather     날씨 — 전국 도시 오늘 현황
 *   'weather/:cityId'  → /m/inwoo/weather/seoul  도시 상세 + 시간별 예보
 *   'tarot'            → /m/inwoo/tarot       운세 — 타로 세 장
 *
 * 이름(name)은 갤러리가 자동으로 'inwoo.' 를 앞에 붙여 준다.
 * 그래서 다른 팀원이 똑같이 'home' 이라고 지어도 부딪히지 않는다.
 * 코드에서 부를 때는 규칙을 외우지 말고 아래 link() 를 쓴다.
 */
import { memberLink } from '../link'

/** router.push(link('detail', { cityId: 'seoul' })) → /m/inwoo/weather/seoul */
export const link = memberLink('inwoo')

export default [
  {
    // 기본 화면 — /m/inwoo 로 들어오면 이게 뜬다
    path: '',
    name: 'home',
    component: () => import('./views/HomeView.vue'),
  },
  {
    path: 'weather',
    name: 'weather',
    component: () => import('./views/DashboardView.vue'),
  },
  {
    // :cityId 자리에 들어온 값을 useRoute() 로 읽는다
    path: 'weather/:cityId',
    name: 'detail',
    component: () => import('./views/DetailView.vue'),
  },
  {
    path: 'tarot',
    name: 'tarot',
    component: () => import('./views/TarotView.vue'),
  },
  {
    // 이 영역 안에서만 도는 Catch-all. 반드시 형제들 뒤에 와야 한다
    path: ':pathMatch(.*)*',
    name: 'missing',
    component: () => import('./views/NotFoundView.vue'),
  },
]
