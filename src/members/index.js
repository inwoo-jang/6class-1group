/**
 * 팀원 결과물 자동 등록소
 * ------------------------------------------------------------------
 * src/members/<slug>/ 폴더 하나가 그 사람의 프로젝트 전부다.
 * 폴더를 두면 등록되고, 지우면 사라진다. 다른 파일은 건드리지 않는다.
 *
 *   src/members/inwoo/
 *   ├── index.vue      ← 진입점. 이것만 있으면 등록된다
 *   ├── routes.js      ← (선택) 하위 화면이 여러 개일 때만
 *   ├── views/         ← 페이지
 *   ├── components/    ← 재사용 부품
 *   ├── data/          ← 상수 · API · 공유 상태
 *   └── assets/        ← 이미지
 *
 * routes.js 가 없으면 index.vue 하나가 곧 결과물이다.
 * routes.js 가 있으면 index.vue 는 껍데기가 되고, 그 안의
 * <RouterView /> 자리에 하위 화면이 들어온다.
 */

/** 진입점 — 필요할 때 불러온다. 6명 것을 한꺼번에 받으면 첫 화면이 그만큼 느려진다 */
const shells = import.meta.glob('./*/index.vue')

/** 주소표는 가벼우므로 미리 읽어 둔다. 라우터를 만들 때 당장 필요하다 */
const routeModules = import.meta.glob('./*/routes.js', { eager: true })

const slugOf = (path) => path.split('/')[1]

const bySlug = (entries) => Object.fromEntries(entries.map(([path, value]) => [slugOf(path), value]))

/** { inwoo: () => import('./inwoo/index.vue'), ... } */
const memberShells = bySlug(Object.entries(shells))

/** { inwoo: [ { path: '', name: 'home', ... }, ... ] } */
const memberChildren = bySlug(Object.entries(routeModules).map(([p, m]) => [p, m.default ?? []]))

/** 그 팀원의 결과물이 실제로 들어와 있는지 */
export const hasWork = (slug) => Boolean(memberShells[slug])

/** 진입점 로더. 없는 slug 면 null */
export const loadWork = (slug) => memberShells[slug] ?? null

/**
 * 이름 충돌을 막는다.
 * 팀원이 붙인 'home' 은 라우터 안에서 'inwoo.home' 이 된다.
 * 그래서 여섯 명이 전부 'home' 이라고 지어도 부딪히지 않는다.
 */
const namespace = (slug, routes) =>
  routes.map((route) => ({
    ...route,
    ...(route.name ? { name: `${slug}.${route.name}` } : {}),
    ...(route.children ? { children: namespace(slug, route.children) } : {}),
  }))

/** 그 팀원이 스스로 정의한 하위 경로 (이름은 이미 slug 가 붙은 상태) */
export const childRoutesOf = (slug) => namespace(slug, memberChildren[slug] ?? [])

/** 팀원이 자기 화면에서 쓰는 링크 도우미 — 실제 구현은 link.js 에 있다 */
export { memberLink } from './link'
