import { memberLink } from '../link'

/**
 * 최종 결과물 · 주소표
 * ------------------------------------------------------------------
 * 여기 적은 경로는 전부 /m/inwoo 아래에 붙는다.
 *
 *   /m/inwoo                  홈 — 오늘 한눈에
 *   /m/inwoo/weather          날씨 — 전국 도시 오늘 현황
 *   /m/inwoo/weather/:cityId  도시 상세 + 시간별 예보
 *   /m/inwoo/tarot            운세 — 타로 세 장으로 보는 오늘
 *   /m/inwoo/games            게임 — 룰렛 · 로또 번호 뽑기
 *   /m/inwoo/tests            테스트 — 룰 기반 심리테스트
 *   /m/inwoo/admin            관리자 — 전체 기록 관리 (role: ADMIN)
 *   /m/inwoo/login            로그인 — 운세 기록을 남기려면 필요하다
 *   /m/inwoo/records          내 운세 기록 (로그인한 사람만)
 *
 * meta.requiresAuth 를 적어 두면 router/index.js 의 가드가 로그인을 확인한다.
 * 화면마다 "로그인했나?"를 따로 검사하지 않기 위해서다.
 *
 * 이름은 짧게 둔다. 갤러리 등록소가 'inwoo.' 을 앞에 붙여 주므로
 * 다른 팀원과 같은 이름을 써도 부딪히지 않는다.
 */

/**
 * 갤러리에 얹히면서 라우트 이름 앞에 'inwoo.' 이 자동으로 붙는다.
 * 그 규칙을 화면마다 외울 필요가 없도록 도우미를 한 번 만들어 쓴다.
 *
 *   router.push(link('detail', { cityId: 'seoul' }))  → /m/inwoo/weather/seoul
 */
export const link = memberLink('inwoo')

export default [
  {
    // 기본 화면 — /final 로 들어오면 이게 뜬다
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
    path: 'games',
    name: 'games',
    component: () => import('./views/GamesView.vue'),
  },
  {
    path: 'games/roulette',
    name: 'roulette',
    component: () => import('./views/RouletteView.vue'),
  },
  {
    path: 'games/lotto',
    name: 'lotto',
    component: () => import('./views/LottoView.vue'),
  },
  {
    path: 'tests',
    name: 'tests',
    component: () => import('./views/TestsView.vue'),
  },
  {
    // :testId 자리에 animal · zombie 가 들어온다
    path: 'tests/:testId',
    name: 'test',
    component: () => import('./views/TestPlayView.vue'),
  },
  {
    // 관리자만 — meta.requiresAdmin 을 라우터 가드가 확인한다
    path: 'admin',
    name: 'admin',
    component: () => import('./views/AdminView.vue'),
    /*
     * 관리자만. 갤러리의 가드는 meta.auth 하나만 보므로 로그인과 권한을
     * 여기서 함께 확인한다 — 관리자가 아니면 로그인 화면으로 돌려보낸다.
     * 진짜로 막는 곳은 서버(와 브라우저 폴백)로, 토큰의 role 을 보고 403 을 준다.
     */
    meta: {
      requiresAuth: true,
      auth: async () => {
        const { useAuthStore } = await import('./stores/authStore')
        const auth = useAuthStore()
        await auth.restore()
        return auth.isLoggedIn && auth.isAdmin
      },
    },
  },
  {
    path: 'login',
    name: 'login',
    component: () => import('./views/LoginView.vue'),
  },
  {
    path: 'records',
    name: 'records',
    component: () => import('./views/RecordsView.vue'),
    /*
     * 로그인하지 않았다면 가드가 로그인 화면으로 보낸다.
     * "로그인했는지" 판단은 이 프로젝트만 아는 일이므로 여기서 알려 준다.
     * 저장소는 화면이 뜰 때 불러야 하므로 함수 안에서 import 한다.
     */
    meta: {
      requiresAuth: true,
      auth: async () => {
        const { useAuthStore } = await import('./stores/authStore')
        const auth = useAuthStore()
        await auth.restore()
        return auth.isLoggedIn
      },
    },
  },
  {
    // 이 영역 안에서만 도는 Catch-all. 반드시 형제들 뒤에 와야 한다
    path: ':pathMatch(.*)*',
    name: 'missing',
    component: () => import('./views/NotFoundView.vue'),
  },
]
