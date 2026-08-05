import http from 'node:http'
import { createRecord, records, resetRecords, users } from './data/stores.js'
import { readJson, sendJson } from './utils/http.js'
import { createToken, verifyToken } from './utils/token.js'

const port = 3001
const recordPath = /^\/api\/fortune-records\/(\d+)$/

const publicUser = ({ id, email, name, role }) => ({ id, email, name, role })
const authorizedUser = (request) => {
  const token = verifyToken(request.headers.authorization)
  return token ? users.find((user) => user.id === token.sub) : null
}

/*
 * 기록은 두 종류다.
 *   kind: 'tarot'  타로 세 장 — 종류가 정해져 있고 카드가 반드시 3장
 *   kind: 'test'   심리테스트 — 테스트 이름은 화면이 정하고 카드가 없다
 *
 * 종류를 안 적어 보내면 'tarot' 로 본다. 먼저 만든 타로 기록과
 * 예전 화면이 그대로 동작해야 하기 때문이다.
 */
const validateRecord = (input) => {
  const kind = input.kind ?? 'tarot'
  if (!['tarot', 'test'].includes(kind)) return '기록 종류가 올바르지 않습니다.'
  if (typeof input.reading !== 'string' || !input.reading.trim()) return '기록할 내용이 필요합니다.'
  if (typeof input.memo !== 'undefined' && typeof input.memo !== 'string') return '메모 형식이 올바르지 않습니다.'

  if (kind === 'tarot') {
    // 화면의 탭과 같은 목록 (src/final/data/tarotReading.js 의 READING_TYPES)
    const types = ['오늘의 운세', '솔로연애운', '커플연애운']
    if (!types.includes(input.type)) return '운세 종류를 선택해 주세요.'
    if (!Array.isArray(input.cards) || input.cards.length !== 3) return '카드 세 장이 필요합니다.'
    return ''
  }

  // 테스트는 종류가 늘어날 수 있어 이름만 확인한다
  if (typeof input.type !== 'string' || !input.type.trim()) return '테스트 이름이 필요합니다.'
  if (!input.meta || typeof input.meta !== 'object') return '테스트 결과 정보가 필요합니다.'
  if (typeof input.meta.testId !== 'string' || typeof input.meta.resultId !== 'string') {
    return '테스트 결과 정보가 올바르지 않습니다.'
  }
  return ''
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return sendJson(response, 204, {})
  const url = new URL(request.url, `http://${request.headers.host}`)
  const match = url.pathname.match(recordPath)

  try {
    if (request.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(response, 200, { status: 'ok', recordCount: records.length })
    }
    if (request.method === 'POST' && url.pathname === '/api/reset') {
      resetRecords()
      return sendJson(response, 200, { message: '운세 기록이 초기화되었습니다.' })
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      const { email, password } = await readJson(request)
      const user = users.find((item) => item.email === email && item.password === password)
      if (!user) return sendJson(response, 401, { message: '이메일 또는 비밀번호가 맞지 않습니다.' })
      return sendJson(response, 200, { accessToken: createToken(user), expiresIn: 3600, user: publicUser(user) })
    }

    const user = authorizedUser(request)
    if (url.pathname.startsWith('/api/fortune-records') || url.pathname.startsWith('/api/auth/me')) {
      if (!user) return sendJson(response, 401, { message: '로그인이 필요합니다.' })
    }
    if (request.method === 'GET' && url.pathname === '/api/auth/me') return sendJson(response, 200, publicUser(user))

    if (request.method === 'GET' && url.pathname === '/api/fortune-records') {
      // 필터는 종류(운세/테스트)로만 건다. 세부 이름은 카드 안에서 보여 준다.
      const kind = url.searchParams.get('kind')
      const owned = records.filter(
        (record) => record.userId === user.id && (!kind || (record.kind ?? 'tarot') === kind),
      )
      return sendJson(response, 200, [...owned].reverse())
    }
    if (request.method === 'POST' && url.pathname === '/api/fortune-records') {
      const input = await readJson(request)
      const error = validateRecord(input)
      if (error) return sendJson(response, 400, { message: error })
      return sendJson(response, 201, createRecord(input, user.id))
    }
    if (request.method === 'PATCH' && match) {
      const record = records.find((item) => item.id === Number(match[1]) && item.userId === user.id)
      if (!record) return sendJson(response, 404, { message: '기록을 찾을 수 없습니다.' })
      const { memo } = await readJson(request)
      if (typeof memo !== 'string') return sendJson(response, 400, { message: '메모를 입력해 주세요.' })
      record.memo = memo
      record.updatedAt = new Date().toISOString()
      return sendJson(response, 200, record)
    }
    if (request.method === 'DELETE' && match) {
      const index = records.findIndex((item) => item.id === Number(match[1]) && item.userId === user.id)
      if (index === -1) return sendJson(response, 404, { message: '기록을 찾을 수 없습니다.' })
      const [deleted] = records.splice(index, 1)
      return sendJson(response, 200, deleted)
    }
    return sendJson(response, 404, { message: '존재하지 않는 API 경로입니다.' })
  } catch (error) {
    return sendJson(response, 400, { message: error.message || '요청을 처리하지 못했습니다.' })
  }
})

server.listen(port, () => console.log(`Fortune Mock API: http://localhost:${port}/api`))
