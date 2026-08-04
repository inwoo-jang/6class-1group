import axios from 'axios'

/**
 * 운세 기록 API 창구
 * ------------------------------------------------------------------
 * 서버는 mock-api/server.js — 로그인하면 토큰을 주고, 그 토큰을 들고 와야
 * 자기 기록만 읽고 쓸 수 있다.
 *
 * 화면은 이 파일만 부른다. axios 를 화면에서 직접 쓰면 주소 · 토큰 · 에러
 * 문구가 부르는 곳마다 흩어지기 때문이다 (weatherApi.js 와 같은 방식).
 *
 * 주소는 .env.local 의 VITE_API_BASE 에서 온다.
 * 비어 있으면 같은 출처의 /api 로 나가므로, 배포본에 localhost 가 박히지 않는다.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '',
  timeout: 8000,
})

/*
 * 토큰은 이 모듈이 들고 있는다.
 *
 * localStorage 를 인터셉터에서 매번 읽지 않는 이유 —
 * "지금 로그인 상태"의 주인은 authStore 하나여야 한다. 두 곳이 각자 읽으면
 * 로그아웃했는데 요청에는 옛 토큰이 실려 나가는 일이 생긴다.
 * 그래서 authStore 가 값을 바꿀 때마다 아래 setAccessToken() 으로 알려 준다.
 */
let accessToken = ''

/** authStore 전용 — 로그인·로그아웃·복원 때 불린다 */
export const setAccessToken = (token) => {
  accessToken = token || ''
}

/**
 * 토큰이 만료되었거나 서버가 거절했을 때(401) 실행할 일.
 * authStore 가 자기 logout() 을 여기 걸어 둔다.
 *
 * 이 파일이 authStore 를 직접 import 하지 않는 이유는 서로가 서로를 부르는
 * 순환 참조를 만들지 않기 위해서다.
 */
let handleUnauthorized = null

export const onAuthExpired = (handler) => {
  handleUnauthorized = handler
}

/** 요청 인터셉터 — 토큰이 있으면 모든 요청에 자동으로 붙인다 */
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

/**
 * 응답 인터셉터 (실패) — 화면이 그대로 띄울 수 있는 문장으로 바꾼다.
 *
 * 서버는 실패할 때 { message } 를 준다. 그 문장이 가장 정확하므로 우선 쓰고,
 * 서버까지 닿지도 못한 경우에만 우리가 문장을 만든다.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) handleUnauthorized?.()

    const message =
      error.response?.data?.message ??
      (error.code === 'ECONNABORTED'
        ? '서버가 제때 답하지 않았습니다. 잠시 뒤 다시 시도해 주세요.'
        : error.response
          ? '요청을 처리하지 못했습니다.'
          : 'API 서버에 닿지 못했습니다. 터미널에서 npm run api 가 떠 있는지 확인해 주세요.')

    return Promise.reject(new Error(message))
  },
)

/* ── 인증 ───────────────────────────────────────────────────────── */

/** 로그인 → { accessToken, expiresIn, user } */
export const login = async (email, password) => {
  const { data } = await api.post('/api/auth/login', { email, password })
  return data
}

/** 토큰이 아직 살아 있는지 확인하고 내 정보를 받는다 */
export const fetchMe = async () => {
  const { data } = await api.get('/api/auth/me')
  return data
}

/* ── 운세 기록 ──────────────────────────────────────────────────── */

/** 내 기록 목록. type 을 주면 그 종류만 받는다 (최근 것이 앞) */
export const fetchRecords = async (type = '') => {
  const { data } = await api.get('/api/fortune-records', {
    params: type ? { type } : undefined,
  })
  return data
}

/** 기록 남기기 → 만들어진 기록 한 건 */
export const createRecord = async (payload) => {
  const { data } = await api.post('/api/fortune-records', payload)
  return data
}

/** 메모만 고친다 (PATCH — 보낸 필드만 바뀐다) */
export const updateMemo = async (id, memo) => {
  const { data } = await api.patch(`/api/fortune-records/${id}`, { memo })
  return data
}

/** 기록 지우기 → 지워진 기록을 돌려준다 */
export const removeRecord = async (id) => {
  const { data } = await api.delete(`/api/fortune-records/${id}`)
  return data
}

/** 서버가 떠 있는지 — 로그인 화면에서 안내를 띄우는 데 쓴다 */
export const checkHealth = async () => {
  const { data } = await api.get('/api/health')
  return data
}
