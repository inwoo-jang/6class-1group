import { readJson, sendJson } from '../utils/http.js'
import {
  createInitialData,
  handleMockRequest,
  MockApiError,
} from '../../src/members/gayeon/api/mockApiCore.js'

/**
 * 가연의 Mock API — `npm run api` 로 띄우는 진짜 서버 쪽.
 * ------------------------------------------------------------------
 * /api/gayeon 아래에만 산다. 이름표를 붙이는 이유는 /health · /reset 처럼
 * 흔한 이름이 인우의 운세 API 와 그대로 겹치기 때문이다.
 *
 * 무슨 일이 일어나는지는 브라우저 쪽과 같은 파일(mockApiCore)이 정한다.
 * 로컬에서 본 동작과 배포본에서 본 동작이 어긋날 자리를 아예 만들지 않는다.
 * 다른 점은 담아 두는 곳뿐이다 — 여기서는 서버가 살아 있는 동안 메모리에 둔다.
 */
const prefix = '/api/gayeon'

let db = createInitialData()

/** 테스트가 서로의 결과에 업히지 않도록 처음 상태로 돌린다 */
export const resetGayeonStore = () => {
  db = createInitialData()
  return db
}

export async function handleGayeonRoutes(request, response, url) {
  if (url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`)) return false

  const path = url.pathname.slice(prefix.length) || '/'
  const params = Object.fromEntries(url.searchParams)

  try {
    const body = ['POST', 'PATCH', 'PUT'].includes(request.method)
      ? await readJson(request)
      : undefined

    const result = handleMockRequest(db, { method: request.method, path, body, params })
    sendJson(response, result.status, result.data)
  } catch (error) {
    const status = error instanceof MockApiError ? error.status : 400
    sendJson(response, status, { message: error.message || '요청을 처리하지 못했습니다.' })
  }

  return true
}
