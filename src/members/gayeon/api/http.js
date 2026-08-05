import axios from 'axios'

import { browserBackend } from './browserBackend.js'

// .env의 VITE_API_BASE_URL이 있으면 사용하고,
// 없으면 로컬 Mock API의 기본 주소를 사용합니다.
const configuredBaseURL = import.meta.env?.VITE_API_BASE_URL?.trim() ?? ''
const baseURL = configuredBaseURL || 'http://localhost:3001/api'

/*
 * 갤러리는 GitHub Pages 에 올라간다 — 정적 호스팅이라 붙을 서버가 없다.
 * 그럴 때만 브라우저 안에서 도는 Mock API 로 갈아 끼운다.
 *
 * 갈아 끼우지 않는 경우가 둘 있다.
 *   · VITE_API_BASE_URL 을 적어 뒀다면, 진짜 그 주소로 가야 한다
 *   · localhost 라면 `npm run api` 로 띄운 서버가 있다 —
 *     네트워크 탭에 요청이 찍히는 걸 봐야 실습이 되므로 건드리지 않는다
 */
const isLocalhost =
  typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
const usesBrowserBackend = !configuredBaseURL && !isLocalhost

export const http = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'X-Lab-Client': 'vue-mock-api-sample',
  },
  ...(usesBrowserBackend ? { adapter: browserBackend } : {}),
})

// 모든 API 오류를 화면에서 사용하기 쉬운 Error 객체로 통일합니다.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'API 응답 시간이 초과되었습니다.'
        : 'API 서버에 연결할 수 없습니다. npm run dev:all 실행 여부를 확인하세요.')

    return Promise.reject(new Error(message))
  },
)

