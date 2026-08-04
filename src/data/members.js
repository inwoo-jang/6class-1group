/**
 * 팀원 명단.
 * ------------------------------------------------------------------
 * 여기 한 줄을 고치면 목록 · 상세 · 주소가 전부 따라 바뀐다.
 *
 * slug     주소에 쓰인다 (/m/inwoo). 영문 소문자만.
 * name     이름
 * role     한 줄 소개 — 무엇을 만들었는지
 * stack    쓴 기술. 목록에서 작게 표시된다
 * accent   미리보기 배경에 쓰는 색 하나. 사이트 전체는 무채색이라 여기서만 색을 쓴다
 * live     따로 배포한 주소가 있으면 적는다. 없으면 비워 둔다
 * ready    컴포넌트를 넣었으면 true. false면 "준비 중"으로 표시된다
 */
export const MEMBERS = [
  {
    slug: 'inwoo',
    name: '장인우',
    role: 'Vue Learning Lab · 실시간 날씨 대시보드',
    stack: ['Vue Router', 'Open-Meteo', 'Composition API'],
    accent: '#1f6f4a',
    live: 'https://inwoo-jang.github.io/inwoo-vue/',
    ready: true,
  },
  {
    slug: 'member2',
    name: '팀원 2',
    role: '아직 소개가 없습니다',
    stack: [],
    accent: '#2f5d8a',
    live: '',
    ready: false,
  },
  {
    slug: 'member3',
    name: '팀원 3',
    role: '아직 소개가 없습니다',
    stack: [],
    accent: '#7a4a86',
    live: '',
    ready: false,
  },
  {
    slug: 'member4',
    name: '팀원 4',
    role: '아직 소개가 없습니다',
    stack: [],
    accent: '#96602c',
    live: '',
    ready: false,
  },
  {
    slug: 'member5',
    name: '팀원 5',
    role: '아직 소개가 없습니다',
    stack: [],
    accent: '#8a2f3f',
    live: '',
    ready: false,
  },
  {
    slug: 'member6',
    name: '팀원 6',
    role: '아직 소개가 없습니다',
    stack: [],
    accent: '#3a6b6b',
    live: '',
    ready: false,
  },
]

export const findMember = (slug) => MEMBERS.find((m) => m.slug === slug) ?? null
