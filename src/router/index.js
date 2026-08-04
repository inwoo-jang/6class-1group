import { createRouter, createWebHistory } from 'vue-router'
import IndexView from '../views/IndexView.vue'
import MemberView from '../views/MemberView.vue'
import { MEMBERS } from '../data/members'
import { childRoutesOf, hasWork } from '../members'

/**
 * 주소표
 * ------------------------------------------------------------------
 * 갤러리는 두 층이다.
 *
 *   /            표지 — 여섯 사람의 명단
 *   /m/<slug>    한 사람의 결과물. 그 아래는 그 사람이 알아서 쓴다
 *
 * 아랫층은 팀원이 자기 폴더의 routes.js 에 적는다.
 * 여기서는 그걸 자식 경로로 끼워 넣기만 한다. 사람이 늘거나
 * 화면이 늘어도 이 파일은 그대로다.
 *
 * 왜 /m/:slug 하나로 받지 않는가 —
 * 여섯 명의 자식 경로가 한 부모 밑에 섞이면 서로의 주소를 가로챈다.
 * 사람마다 부모를 따로 세우면 각자의 주소 공간이 완전히 나뉜다.
 */
const memberRoutes = MEMBERS.filter((member) => hasWork(member.slug)).map((member) => {
  const children = childRoutesOf(member.slug)

  return {
    path: `/m/${member.slug}`,
    component: MemberView,
    props: { slug: member.slug },

    // routes.js 가 있으면 index.vue 는 껍데기가 되고 자식이 그 안에 들어온다.
    // 없으면 index.vue 하나가 곧 화면이다 — 자식 없이 이름만 준다.
    ...(children.length ? { children } : { name: `${member.slug}.work` }),
  }
})

/** '/m/inwoo/about' → 'inwoo'. 그 주소가 누구의 영역인지 */
const memberOf = (route) => (route.path.startsWith('/m/') ? route.path.split('/')[2] : null)

const routes = [
  { path: '/', name: 'index', component: IndexView },

  ...memberRoutes,

  {
    // 아직 결과물을 안 낸 사람 — MemberView 가 "준비 중"을 대신 보여 준다
    path: '/m/:slug',
    name: 'member',
    component: MemberView,
    props: true,
  },
  {
    // 나머지를 전부 받는다. 반드시 맨 마지막.
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,

  scrollBehavior(to, from, saved) {
    if (saved) return saved // 뒤로가기 — 보던 자리로
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    // 같은 사람 안에서 화면만 바뀔 때는 스크롤을 건드리지 않는다
    if (memberOf(to) && memberOf(to) === memberOf(from)) return false
    return { top: 0 }
  },
})

/**
 * 로그인이 필요한 화면을 지키는 검문소.
 *
 * 갤러리는 누가 로그인했는지 모른다. 사람마다 로그인 방식이 다를 수 있으므로,
 * "로그인했는지 확인하는 방법"은 팀원이 자기 routes.js 의 meta.auth 에 넣는다.
 *
 *   meta: { requiresAuth: true, auth: async () => boolean }
 *
 * 통과하지 못하면 그 사람의 login 화면으로 보낸다 ('<slug>.login').
 */
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const ok = typeof to.meta.auth === 'function' ? await to.meta.auth() : false
  if (ok) return true

  const slug = memberOf(to)
  return slug
    ? { name: `${slug}.login`, query: { redirect: to.fullPath } }
    : { name: 'index' }
})

export default router
