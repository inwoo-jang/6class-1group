import axios from 'axios'

import { browserBackend } from './browserBackend.js'

/*
 * 어디로 보낼 것인가.
 * ------------------------------------------------------------------
 * .env 의 VITE_API_BASE_URL 이 있으면 그 주소를 쓰고, 없으면 팀 Mock 서버의
 * /api/gayeon 으로 간다. 이름표를 붙이는 이유는 /health · /reset 같은 흔한
 * 이름이 인우의 운세 API 와 그대로 겹치기 때문이다 — 이름표가 없으면
 * 상품을 물었는데 운세 기록 개수가 돌아온다.
 */
const configuredBaseURL = import.meta.env?.VITE_API_BASE_URL?.trim() ?? ''
const baseURL = configuredBaseURL || '/api/gayeon'

/*
 * 서버가 없으면 어떻게 할 것인가.
 * ------------------------------------------------------------------
 * 갤러리는 GitHub Pages 에 올라간다. 정적 호스팅이라 붙을 서버가 아예 없다.
 * 그럴 때는 처음부터 브라우저 안에서 도는 Mock API 로 간다 — 갈 곳 없는
 * 요청을 내보내고 실패를 기다릴 이유가 없다.
 *
 * localhost 에서는 먼저 진짜 서버로 나간다. `npm run api` 를 띄워 두었다면
 * 네트워크 탭에 요청이 찍히는 걸 볼 수 있어야 실습이 되기 때문이다.
 * 서버가 안 떠 있으면 그때 브라우저 백엔드가 대신 받는다 — 화면은 멈추지 않는다.
 */
const isBrowser = typeof location !== 'undefined'
const hasLocalServer =
  isBrowser && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
const alwaysBrowserBackend = !configuredBaseURL && !hasLocalServer

/** 진짜로 네트워크에 나가는 사람 */
const networkAdapter = axios.getAdapter(axios.defaults.adapter)

/** 서버에 닿지도 못한 실패인가 — 404 처럼 서버가 준 대답과는 구분해야 한다 */
const cannotReachServer = (error) =>
  !error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED'

const adapter = async (config) => {
  if (alwaysBrowserBackend) return browserBackend(config)

  try {
    return await networkAdapter(config)
  } catch (error) {
    if (!cannotReachServer(error)) throw error
    return browserBackend(config)
  }
}

export const http = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'X-Lab-Client': 'vue-mock-api-sample',
  },
  adapter,
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
