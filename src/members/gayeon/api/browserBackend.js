/**
 * 브라우저 안에서 도는 Mock API.
 * ------------------------------------------------------------------
 * 이 갤러리는 GitHub Pages 에 올라간다. 정적 호스팅이라 서버가 없다.
 * 그래서 Axios 의 adapter 자리를 대신 채운다. adapter 는 "요청을 실제로
 * 내보내는 사람"이다. 여기를 바꾸면 productApi · postApi · 화면 코드는
 * 자기가 진짜 서버와 이야기하는 줄 알고 그대로 돌아간다.
 *
 * 무슨 일이 일어나는지는 여기 적지 않는다 — mockApiCore 가 안다.
 * 이 파일이 맡는 것은 두 가지뿐이다. 어디에 담아 둘 것인가(localStorage),
 * 그리고 Axios 가 알아듣는 모양으로 어떻게 돌려줄 것인가.
 */
import { createInitialData, handleMockRequest, MockApiError } from './mockApiCore.js'

const STORE_KEY = 'weather-diary-mock-api'

const read = () => {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return createInitialData()
    const parsed = JSON.parse(raw)
    // 저장된 모양이 깨졌으면 조용히 처음으로 돌린다
    if (!Array.isArray(parsed?.products) || !Array.isArray(parsed?.posts)) return createInitialData()
    return parsed
  } catch {
    return createInitialData()
  }
}

const write = (db) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(db))
  } catch {
    // 저장 공간이 막혀 있어도 화면은 계속 돌아가야 한다
  }
}

/** 서버가 응답을 주기까지 걸리는 시간. 로딩 표시가 눈에 보여야 실습이 된다 */
const LATENCY_MS = 220

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Axios 가 오류로 알아듣는 모양. http.js 의 인터셉터가 message 를 꺼내 쓴다 */
const asAxiosError = (status, message, config) =>
  Object.assign(new Error(message), {
    isAxiosError: true,
    config,
    response: { status, data: { message }, config, headers: {}, statusText: message },
  })

/**
 * Axios adapter. 요청 하나를 받아 응답 하나를 돌려준다.
 * 진짜 서버가 하던 일을 그대로, 다만 네트워크를 건너뛰고 한다.
 */
export const browserBackend = async (config) => {
  await wait(LATENCY_MS)

  // baseURL 을 뗀 나머지 — '/products/3' 같은 모양이 된다
  const path =
    String(config.url ?? '')
      .replace(/^https?:\/\/[^/]+/, '')
      .replace(/\/+$/, '') || '/'

  let body = config.data
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = undefined
    }
  }

  const db = read()

  let result
  try {
    result = handleMockRequest(db, {
      method: config.method,
      path,
      body,
      params: config.params ?? {},
    })
  } catch (error) {
    const status = error instanceof MockApiError ? error.status : 400
    throw asAxiosError(status, error.message, config)
  }

  write(db)

  return {
    data: result.data,
    status: result.status,
    statusText: 'OK',
    headers: {},
    config,
  }
}
