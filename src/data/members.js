/**
 * 팀원 명단.
 * ------------------------------------------------------------------
 * 여기 한 줄을 고치면 목록 · 상세 · 주소가 전부 따라 바뀐다.
 * 여기 적힌 순서가 곧 표지에 걸리는 순서다.
 *
 * slug     주소에 쓰인다 (/m/inwoo). 영문 소문자만.
 * name     이름
 * title    결과물 이름 — 표지 카드에 제목으로 걸린다
 * role     한 줄 소개 — 무엇을 만들었는지
 * stack    쓴 기술
 * accent   카드 포스터에 쓰는 색 하나
 * live     따로 배포한 주소가 있으면 적는다. 없으면 비워 둔다
 *
 * "결과물이 들어왔는지"는 여기 적지 않는다.
 * src/members/<slug>/ 폴더가 있으면 있는 것이고, 없으면 없는 것이다.
 * 명단과 실물이 어긋날 일을 아예 만들지 않는다.
 */
export const MEMBERS = [
  {
    slug: 'inwoo',
    name: '장인우',
    title: 'Weather Dashboard',
    role: '전국 도시의 실시간 날씨를 한 화면에서',
    stack: ['Vue Router', 'Open-Meteo', 'Composition API'],
    accent: '#1f6f4a',
    live: 'https://inwoo-jang.github.io/inwoo-vue/',
  },
  {
    slug: 'gayeon',
    name: '가연',
    title: '',
    role: '아직 소개가 없습니다',
    stack: [],
    accent: '#2f5d8a',
    live: '',
  },
  {
    slug: 'jaeheung',
    name: '재흥',
    title: '',
    role: '아직 소개가 없습니다',
    stack: [],
    accent: '#7a4a86',
    live: '',
  },
  {
    slug: 'yeongwoo',
    name: '영우',
    title: '',
    role: '아직 소개가 없습니다',
    stack: [],
    accent: '#96602c',
    live: '',
  },
  {
    slug: 'dongyeol',
    name: '동열',
    title: '',
    role: '아직 소개가 없습니다',
    stack: [],
    accent: '#8a2f3f',
    live: '',
  },
  {
    // 여섯 번째 자리 — 이름이 정해지면 slug 와 name 만 바꾸면 된다
    slug: 'member6',
    name: '팀원 6',
    title: '',
    role: '아직 소개가 없습니다',
    stack: [],
    accent: '#3a6b6b',
    live: '',
  },
]

export const findMember = (slug) => MEMBERS.find((m) => m.slug === slug) ?? null
