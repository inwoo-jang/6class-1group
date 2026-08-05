import axios from 'axios'
import { handleLocally } from './fortuneBrowserApi'

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
 * 서버가 없으면 브라우저가 대신 답한다.
 *
 * mock-api 는 내 컴퓨터에서만 도는 Node 서버라, GitHub Pages 처럼 파일만
 * 내려 주는 곳에서는 붙을 자리가 없다. 그렇다고 로그인 화면에서 "서버를
 * 켜세요"라고 막아서면, 링크만 열어 본 사람에게는 기능이 없는 것과 같다.
 *
 * 그래서 바꾸는 것은 어댑터 하나뿐이다 — axios 가 요청을 실제로 내보내는
 * 부분. 위아래(인터셉터·응답 형태·에러 문구)는 그대로라서 아래 함수들도,
 * 화면도 서버를 쓰는지 브라우저가 대신하는지 알지 못한다.
 *
 * 서버가 답을 준 경우에는 그 답이 옳다. 400·401 같은 거절은 그대로 전한다.
 * 대신 나서는 것은 서버가 "거기 없을 때"다 — 닿지 못했거나, 정적 호스팅이
 * API 경로에 404 페이지를 돌려줬거나.
 */
const sendOverHttp = axios.getAdapter(axios.defaults.adapter)

/**
 * "여긴 API 서버가 아니다"를 가려낸다.
 *
 * 정적 호스팅은 요청이 닿긴 하므로 응답이 없는 게 아니라 404 페이지가 온다.
 * 우리 서버는 실패할 때 반드시 { message } 를 담으므로, 그게 없는 404·405 는
 * API 가 그 자리에 없다는 뜻으로 읽는다. "기록을 찾을 수 없습니다" 같은
 * 진짜 404 는 message 가 있어 여기 걸리지 않는다.
 */
const looksLikeNoApi = (error) => {
  if (!error.response) return true // 닿지도 못했다
  // 404·405 는 "그런 경로 없음", 50x 계열은 중간 게이트웨이가 대신 답한 것이다
  if (![404, 405, 501, 502, 503, 504].includes(error.response.status)) return false
  const body = error.response.data
  return !(body && typeof body === 'object' && typeof body.message === 'string')
}

/** 한 번 확인했으면 매 요청마다 다시 헛걸음할 이유가 없다 */
let serverMissing = false

api.defaults.adapter = async (config) => {
  if (!serverMissing) {
    try {
      return await sendOverHttp(config)
    } catch (error) {
      if (!looksLikeNoApi(error)) throw error // 서버가 답했다 — 그 답이 맞다
      serverMissing = true
    }
  }
  return handleLocally(config)
}

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

/** 내 기록 목록. kind('tarot' | 'test') 를 주면 그 종류만 받는다 (최근 것이 앞) */
export const fetchRecords = async (kind = '') => {
  const { data } = await api.get('/api/fortune-records', {
    params: kind ? { kind } : undefined,
  })
  return data
}

/** 기록 남기기 → 만들어진 기록 한 건 */
export const createRecord = async (payload) => {
  const { data } = await api.post('/api/fortune-records', payload)
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

/* ── 관리자 전용 ────────────────────────────────────────────────
 *
 * 아래 셋은 토큰의 role 이 ADMIN 일 때만 통한다.
 * 화면에서 메뉴를 감추는 것과 별개로, 막는 일은 서버(와 브라우저 폴백)가 한다.
 */

/** 모든 사용자의 기록 — 각 건에 owner 가 함께 담겨 온다 */
export const fetchAllRecords = async () => {
  const { data } = await api.get('/api/admin/records')
  return data
}

/** 누구 것이든 지운다 */
export const removeAnyRecord = async (id) => {
  const { data } = await api.delete(`/api/admin/records/${id}`)
  return data
}

/** 기록을 전부 비운다 (Mock 데이터 초기화) */
export const resetAllRecords = async () => {
  const { data } = await api.post('/api/admin/reset')
  return data
}
