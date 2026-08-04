/**
 * 팀원 결과물 자동 등록소
 * ------------------------------------------------------------------
 * src/members/<slug>/index.vue 를 두면 자동으로 등록된다.
 * 파일을 넣는 것 말고는 아무 것도 손대지 않아도 된다.
 *
 * 필요할 때만 불러오도록 eager 를 쓰지 않는다.
 * 6명 것을 한꺼번에 받으면 첫 화면이 그만큼 느려진다.
 */
const modules = import.meta.glob('./*/index.vue')

const slugOf = (path) => path.split('/')[1]

/** { inwoo: () => import(...), ... } */
export const memberModules = Object.fromEntries(
  Object.entries(modules).map(([path, load]) => [slugOf(path), load]),
)

/** 그 팀원의 결과물이 실제로 들어와 있는지 */
export const hasWork = (slug) => Boolean(memberModules[slug])

/** 없는 slug 면 null */
export const loadWork = (slug) => memberModules[slug] ?? null
