import axios from 'axios'

export const accessTokenKey = 'dongyeol-skala-vue-jwt-access-token'

const configuredBaseURL = import.meta.env.VITE_DONGYEOL_API_BASE_URL?.trim() ?? ''
const baseURL = configuredBaseURL || '/api/dongyeol'

export const http = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'X-Dongyeol-Lab-Client': 'skala-vue',
  },
})

http.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem(accessTokenKey)

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const hasApiMessage = typeof error.response?.data?.message === 'string'
    const message = error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'API 응답 시간이 초과되었습니다.' : 'Mock API에 연결할 수 없습니다. npm run api 실행 여부를 확인하세요.')

    const normalizedError = new Error(message)
    normalizedError.status = error.response?.status
    normalizedError.code = error.code
    normalizedError.hasApiMessage = hasApiMessage

    return Promise.reject(normalizedError)
  },
)

const shouldUseBrowserOnly =
  import.meta.env.VITE_DONGYEOL_BROWSER_FALLBACK === 'true' ||
  (!configuredBaseURL && typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io'))

let serverUnavailable = false

/**
 * 개발 서버에서는 Node Mock API를 먼저 사용합니다. 서버가 없거나 GitHub
 * Pages처럼 API를 실행할 수 없는 정적 호스트라면 같은 계약의 브라우저 저장소로
 * 전환해 공개 배포본에서도 인증 및 CRUD 실습이 끊기지 않게 합니다.
 */
export async function withBrowserFallback(serverRequest, browserRequest) {
  if (shouldUseBrowserOnly || serverUnavailable) return browserRequest()

  try {
    return await serverRequest()
  } catch (error) {
    const hasNoResponse = typeof error.status === 'undefined'
    const sameOriginApiIsUnavailable = !configuredBaseURL && !error.hasApiMessage && [404, 405, 501, 502, 503, 504].includes(error.status)

    if (!hasNoResponse && !sameOriginApiIsUnavailable) throw error
    serverUnavailable = true
    return browserRequest()
  }
}
