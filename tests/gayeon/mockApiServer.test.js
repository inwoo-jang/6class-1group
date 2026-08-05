import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Readable } from 'node:stream'
import test from 'node:test'

import { handleGayeonRoutes, resetGayeonStore } from '../../mock-api/gayeon/index.js'

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

/** 응답을 받아 적기만 하는 가짜 response — 서버를 띄우지 않고 라우터만 본다 */
const fakeResponse = () => {
  const captured = { status: null, body: null }
  return {
    captured,
    writeHead(status) {
      captured.status = status
      return this
    },
    setHeader() {
      return this
    },
    end(payload) {
      captured.body = payload ? JSON.parse(payload) : null
    },
  }
}

const call = async (method, path, body) => {
  const url = new URL(path, 'http://localhost:3001')
  const response = fakeResponse()
  // readJson 은 요청을 스트림으로 읽는다 — 진짜와 같은 모양을 준다
  const request = Readable.from(body === undefined ? [] : [JSON.stringify(body)])
  request.method = method
  request.headers = { 'content-type': 'application/json' }

  const handled = await handleGayeonRoutes(request, response, url)
  return { handled, ...response.captured }
}

test.beforeEach(() => {
  resetGayeonStore()
})

test('가연 API 는 자기 이름표 밖의 주소를 넘기지 않는다', async () => {
  // 인우의 운세 API 와 동열의 API 가 그대로 흐를 수 있어야 한다
  const passed = await call('GET', '/api/health')
  assert.equal(passed.handled, false)
  assert.equal(passed.status, null)

  assert.equal((await call('GET', '/api/dongyeol/health')).handled, false)
  assert.equal((await call('GET', '/api/gayeon/health')).handled, true)
})

test('서버가 브라우저 백엔드와 같은 데이터를 내려준다', async () => {
  const health = await call('GET', '/api/gayeon/health')

  assert.equal(health.status, 200)
  assert.equal(health.body.productCount, 5)
  assert.equal(health.body.postCount, 3)

  const products = await call('GET', '/api/gayeon/products')
  assert.equal(products.body.length, 5)
  assert.equal(products.body[0].name, '노트북 거치대')
})

test('서버에서도 CRUD 한 바퀴가 돈다', async () => {
  const created = await call('POST', '/api/gayeon/products', {
    name: '모니터 암',
    category: '장비',
    price: 76000,
    stock: 2,
  })
  assert.equal(created.status, 201)
  assert.equal(created.body.id, 6)

  const patched = await call('PATCH', `/api/gayeon/products/${created.body.id}`, { stock: 9 })
  assert.equal(patched.body.stock, 9)

  assert.equal((await call('DELETE', `/api/gayeon/products/${created.body.id}`)).status, 200)
  assert.equal((await call('GET', '/api/gayeon/products')).body.length, 5)
})

test('검색어와 조건이 주소창을 타고 그대로 전해진다', async () => {
  const searched = await call('GET', '/api/gayeon/products?q=거치대')
  assert.deepEqual(
    searched.body.map((row) => row.name),
    ['노트북 거치대'],
  )

  // 주소창의 값은 늘 글자다 — 'true' 를 참으로 읽어야 품절이 빠진다
  assert.equal((await call('GET', '/api/gayeon/products?available=true')).body.length, 4)
  assert.equal((await call('GET', '/api/gayeon/products?category=장비')).body.length, 2)
})

test('없는 주소와 잘못된 입력은 읽을 수 있는 말로 실패한다', async () => {
  const missing = await call('GET', '/api/gayeon/products/999')
  assert.equal(missing.status, 404)
  assert.match(missing.body.message, /999번 상품/)

  const invalid = await call('POST', '/api/gayeon/posts', { title: '   ' })
  assert.equal(invalid.status, 400)
  assert.match(invalid.body.message, /제목은 반드시/)
})

test('팀 Mock 서버가 가연 API 도 함께 연결한다', () => {
  const serverSource = readSource('../../mock-api/server.js')

  assert.match(serverSource, /handleGayeonRoutes/)
  assert.match(serverSource, /handleDongyeolRoutes/)
})

test('가연 API endpoint 는 모두 /api/gayeon 아래에 있다', () => {
  const routerSource = readSource('../../mock-api/gayeon/index.js')
  const httpSource = readSource('../../src/members/gayeon/api/http.js')

  assert.match(routerSource, /const prefix = ['"]\/api\/gayeon['"]/)
  assert.match(httpSource, /['"]\/api\/gayeon['"]/)
})
