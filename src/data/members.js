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
 * bottomClearance  화면 하단에 고정 UI가 있는 경우 footer 아래에 남길 공간 (선택)
 * previewPath      표지 카드에 띄울 화면 (선택). '/m/<slug>' 뒤에 붙는다.
 *                  첫 화면이 위치 권한이나 로그인을 기다리는 사람만 적으면 된다 —
 *                  카드는 축소된 그림이라 아무도 그 안에서 버튼을 누를 수 없다.
 *
 * "결과물이 들어왔는지"는 여기 적지 않는다.
 * src/members/<slug>/ 폴더가 있으면 있는 것이고, 없으면 없는 것이다.
 * 명단과 실물이 어긋날 일을 아예 만들지 않는다.
 */
export const MEMBERS = [
  {
    slug: 'inwoo',
    name: '장인우',
    title: 'Weather & Fortune',
    role: '전국 날씨와 오늘의 운세를, 로그인하면 기록까지',
    stack: ['Vue Router', 'Pinia', 'Axios', 'Element Plus'],
    accent: '#1f6f4a',
    live: 'https://inwoo-jang.github.io/inwoo-vue/',
  },
  {
    slug: 'gayeon',
    name: '가연',
    title: 'Weather Diary',
    role: '전국 날씨와 지역 축제를, Mock API 실습실까지 함께',
    stack: ['Vue Router', 'Pinia', 'Axios', 'Element Plus'],
    accent: '#2f5d8a',
    live: '',
  },
  {
    slug: 'jaeheung',
    name: '재흥',
    title: 'WeatherCast Kkachi',
    role: '도시 검색·추가와 지도가 있는 실시간 날씨 대시보드',
    stack: ['Vue Router', 'Axios', 'OpenWeatherMap', 'Leaflet'],
    accent: '#7a4a86',
    live: '',
  },
  {
    slug: 'youngwoo',
    name: '영우',
    title: 'Weather Dashboard',
    role: '국내·해외 도시 날씨를 지도·온도계·날씨 이펙트로 한눈에',
    stack: ['Vue Router', 'Pinia', 'Axios', 'Leaflet'],
    accent: '#96602c',
    live: '',
  },
  {
    slug: 'dongyeol',
    name: '동열',
    title: 'Weather & API Lab',
    role: '실시간 날씨·예보와 JWT 기반 상품·게시글 CRUD',
    stack: ['Vue Router', 'Pinia', 'Axios', 'Element Plus'],
    accent: '#3f6665',
    bottomClearance: '76px',
    // 첫 화면이 위치 권한을 기다린다 — 카드에서는 눌러 줄 사람이 없으므로 서울로 띄운다
    previewPath: '/weather/city_01',
    live: '',
  },
  {
    slug: 'jiyoung',
    name: '지영',
    title: '',
    role: '아직 소개가 없습니다',
    stack: [],
    accent: '#3a6b6b',
    live: '',
  },
]

export const findMember = (slug) => MEMBERS.find((m) => m.slug === slug) ?? null
