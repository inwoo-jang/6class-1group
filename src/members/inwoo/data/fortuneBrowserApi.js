/**
 * 서버가 없을 때 브라우저가 대신 맡는 API
 * ------------------------------------------------------------------
 * mock-api/server.js 는 내 컴퓨터에서만 도는 Node 서버다.
 * GitHub Pages 는 파일만 내려 주는 곳이라 서버가 붙을 자리가 없다.
 * 그래서 배포본에서는 이 파일이 같은 규칙으로 같은 답을 만든다.
 *
 * 화면도, fortuneApi.js 의 함수들도 이 파일의 존재를 모른다.
 * axios 의 어댑터(요청을 실제로 보내는 부분)만 바꿔 끼웠기 때문이다.
 * 그래서 인터셉터·에러 문구·응답 형태가 서버를 쓸 때와 완전히 같다.
 *
 * 저장은 localStorage 다. 이 브라우저에만 남고 서버로 나가지 않는다.
 */

/** mock-api/data/stores.js 와 같은 계정 */
const USERS = [
  { id: 1, email: 'student@skala.com', password: '1234', name: 'SKALA 수강생', role: 'STUDENT' },
  { id: 2, email: 'admin@skala.com', password: 'admin1234', name: 'SKALA 관리자', role: 'ADMIN' },
]

/** mock-api/server.js 의 validateRecord 와 같은 목록 */
const TYPES = ['오늘의 운세', '솔로연애운', '커플연애운']

const STORAGE_KEY = 'inwoo-fortune-records'

const publicUser = ({ id, email, name, role }) => ({ id, email, name, role })

/* ── 저장소 ─────────────────────────────────────────────────────── */

const readAll = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    // 손상된 값이 들어 있으면 없는 것으로 친다. 여기서 터지면 화면이 통째로 멈춘다.
    return []
  }
}

const writeAll = (records) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // 저장 공간이 꽉 찼거나 사생활 보호 모드다. 이번 화면은 그대로 두고 넘어간다.
  }
}

/* ── 토큰 ───────────────────────────────────────────────────────── */

/**
 * 서버의 토큰과 모양만 맞춘 표식이다.
 *
 * 브라우저 안에서 자기 자신에게 발급하는 것이라 서명에 의미가 없다.
 * 진짜 인증은 서버가 있을 때 서버가 한다 — 이건 화면 흐름을 위한 자리표시다.
 */
const makeToken = (user) => `browser.${user.id}.${Date.now() + 3600 * 1000}`

const userFromToken = (authorization = '') => {
  const [, raw] = String(authorization).split('Bearer ')
  const [tag, id, expiresAt] = String(raw ?? '').split('.')
  if (tag !== 'browser' || Number(expiresAt) < Date.now()) return null
  return USERS.find((user) => user.id === Number(id)) ?? null
}

/* ── axios 가 기대하는 모양 ─────────────────────────────────────── */

const ok = (config, status, data) => ({
  data,
  status,
  statusText: '',
  headers: {},
  config,
})

const fail = (config, status, message) => {
  const error = new Error(message)
  error.isAxiosError = true
  error.config = config
  error.response = { data: { message }, status, statusText: '', headers: {}, config }
  return Promise.reject(error)
}

/* ── 요청 읽기 ──────────────────────────────────────────────────── */

/** 어댑터 단계에서 body 는 이미 문자열로 바뀌어 있다 */
const readBody = (config) => {
  if (!config.data) return {}
  try {
    return typeof config.data === 'string' ? JSON.parse(config.data) : config.data
  } catch {
    return {}
  }
}

/** AxiosHeaders 일 수도, 평범한 객체일 수도 있다 */
const readAuthorization = (config) =>
  config.headers?.get?.('Authorization') ?? config.headers?.Authorization ?? ''

/*
 * mock-api/server.js 의 validateRecord 와 같은 규칙이어야 한다.
 * 여기가 느슨하면 로컬에서는 막히던 값이 배포본에서만 저장되는 일이 생긴다.
 */
const validateRecord = (input) => {
  const kind = input.kind ?? 'tarot'
  if (!['tarot', 'test', 'game'].includes(kind)) return '기록 종류가 올바르지 않습니다.'
  if (typeof input.reading !== 'string' || !input.reading.trim()) return '기록할 내용이 필요합니다.'

  if (kind === 'tarot') {
    if (!TYPES.includes(input.type)) return '운세 종류를 선택해 주세요.'
    if (!Array.isArray(input.cards) || input.cards.length !== 3) return '카드 세 장이 필요합니다.'
    return ''
  }

  if (typeof input.type !== 'string' || !input.type.trim()) return '이름이 필요합니다.'
  if (!input.meta || typeof input.meta !== 'object') return '결과 정보가 필요합니다.'

  if (kind === 'test') {
    if (typeof input.meta.testId !== 'string' || typeof input.meta.resultId !== 'string') {
      return '테스트 결과 정보가 올바르지 않습니다.'
    }
    return ''
  }

  // 게임 — 무슨 게임에서 무엇이 나왔는지만 확인한다
  if (typeof input.meta.gameId !== 'string' || typeof input.meta.result !== 'string') {
    return '게임 결과 정보가 올바르지 않습니다.'
  }
  return ''
}

/* ── 경로 처리 ──────────────────────────────────────────────────── */

const RECORD_PATH = /^\/api\/fortune-records\/(\d+)$/
const ADMIN_RECORD_PATH = /^\/api\/admin\/records\/(\d+)$/

/**
 * mock-api/server.js 와 같은 순서로 같은 판단을 한다.
 * 한쪽만 고치면 로컬과 배포본이 다르게 동작하므로 짝을 맞춰 둔다.
 */
export const handleLocally = (config) => {
  const method = (config.method ?? 'get').toUpperCase()
  const path = String(config.url ?? '').replace(config.baseURL ?? '', '')
  const match = path.match(RECORD_PATH)

  if (method === 'POST' && path === '/api/auth/login') {
    const { email, password } = readBody(config)
    const user = USERS.find((item) => item.email === email && item.password === password)
    if (!user) return fail(config, 401, '이메일 또는 비밀번호가 맞지 않습니다.')
    return Promise.resolve(
      ok(config, 200, { accessToken: makeToken(user), expiresIn: 3600, user: publicUser(user) }),
    )
  }

  if (method === 'GET' && path === '/api/health') {
    // mode 를 함께 알려 준다 — 화면이 "서버 없이 도는 중"임을 밝힐 수 있도록
    return Promise.resolve(ok(config, 200, { status: 'ok', mode: 'browser', recordCount: readAll().length }))
  }

  const user = userFromToken(readAuthorization(config))
  if (
    path.startsWith('/api/fortune-records') ||
    path.startsWith('/api/auth/me') ||
    path.startsWith('/api/admin')
  ) {
    if (!user) return fail(config, 401, '로그인이 필요합니다.')
  }

  /*
   * 관리자 전용 — mock-api/server.js 와 같은 규칙이어야 한다.
   *
   * 화면에서 메뉴를 감추는 것은 안내일 뿐이고, 실제로 막는 곳은 여기다.
   * 서버가 없을 때도 STUDENT 는 여기서 막힌다.
   */
  if (path.startsWith('/api/admin')) {
    if (user.role !== 'ADMIN') return fail(config, 403, '관리자만 볼 수 있습니다.')

    if (method === 'GET' && path === '/api/admin/records') {
      const all = readAll().map((record) => ({
        ...record,
        owner: publicUser(USERS.find((item) => item.id === record.userId) ?? {}),
      }))
      return Promise.resolve(ok(config, 200, [...all].reverse()))
    }

    const adminMatch = path.match(ADMIN_RECORD_PATH)
    if (method === 'DELETE' && adminMatch) {
      const records = readAll()
      const index = records.findIndex((item) => item.id === Number(adminMatch[1]))
      if (index === -1) return fail(config, 404, '기록을 찾을 수 없습니다.')
      const [deleted] = records.splice(index, 1)
      writeAll(records)
      return Promise.resolve(ok(config, 200, deleted))
    }

    if (method === 'POST' && path === '/api/admin/reset') {
      writeAll([])
      return Promise.resolve(ok(config, 200, { message: '모든 기록을 지웠습니다.' }))
    }

    return fail(config, 404, '존재하지 않는 API 경로입니다.')
  }

  if (method === 'GET' && path === '/api/auth/me') {
    return Promise.resolve(ok(config, 200, publicUser(user)))
  }

  if (method === 'GET' && path === '/api/fortune-records') {
    // 필터는 종류(운세/테스트)로만 건다. 세부 이름은 카드 안에서 보여 준다.
    const kind = config.params?.kind
    const owned = readAll().filter(
      (record) => record.userId === user.id && (!kind || (record.kind ?? 'tarot') === kind),
    )
    return Promise.resolve(ok(config, 200, [...owned].reverse()))
  }

  if (method === 'POST' && path === '/api/fortune-records') {
    const input = readBody(config)
    const error = validateRecord(input)
    if (error) return fail(config, 400, error)

    const records = readAll()
    const now = new Date().toISOString()
    const record = {
      id: Math.max(0, ...records.map((item) => item.id)) + 1,
      userId: user.id,
      kind: input.kind ?? 'tarot',
      type: input.type,
      cards: input.cards ?? [],
      reading: input.reading,
      meta: input.meta ?? null,
      createdAt: now,
      updatedAt: now,
    }
    writeAll([...records, record])
    return Promise.resolve(ok(config, 201, record))
  }

  if (method === 'DELETE' && match) {
    const records = readAll()
    const index = records.findIndex(
      (item) => item.id === Number(match[1]) && item.userId === user.id,
    )
    if (index === -1) return fail(config, 404, '기록을 찾을 수 없습니다.')

    const [deleted] = records.splice(index, 1)
    writeAll(records)
    return Promise.resolve(ok(config, 200, deleted))
  }

  return fail(config, 404, '존재하지 않는 API 경로입니다.')
}
