import assert from 'node:assert/strict'
import test from 'node:test'

/*
 * 브라우저 안에서 도는 Mock API 를 확인한다.
 *
 * 화면을 띄우지 않고 http 창구를 그대로 쓴다. 컴포넌트가 부르는 길과
 * 똑같은 길로 들어가야, 배포본에서 실제로 도는지를 확인한 것이 된다.
 * localStorage 는 Node 에 없으므로 같은 모양의 물건을 하나 놓아 준다.
 */
const store = new Map()
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
}

const { http } = await import('../../src/members/gayeon/api/http.js')
const { productApi } = await import('../../src/members/gayeon/api/productApi.js')
const { postApi } = await import('../../src/members/gayeon/api/postApi.js')
const { systemApi } = await import('../../src/members/gayeon/api/systemApi.js')

test.beforeEach(() => {
  store.clear()
})

test('가연 Mock API 는 서버 없이도 처음 상태를 내려준다', async () => {
  const health = await systemApi.getHealth()

  assert.equal(health.productCount, 5)
  assert.equal(health.postCount, 3)
  assert.equal((await productApi.getAll()).length, 5)
  assert.equal((await postApi.getAll()).length, 3)
})

test('상품 목록이 검색어 · 카테고리 · 재고 조건을 가려서 준다', async () => {
  assert.deepEqual(
    (await productApi.getAll({ q: '거치대' })).map((row) => row.name),
    ['노트북 거치대'],
  )
  assert.equal((await productApi.getAll({ category: '장비' })).length, 2)
  assert.equal((await productApi.getAll({ category: '전체' })).length, 5)

  // 품절인 기계식 키보드 한 개가 빠진다
  assert.equal((await productApi.getAll({ available: true })).length, 4)
})

test('상품을 등록하고 고치고 지우면 목록이 그만큼 따라 움직인다', async () => {
  const created = await productApi.create({
    name: '모니터 암',
    category: '장비',
    price: 76000,
    stock: 2,
    description: '',
  })

  assert.equal(created.id, 6)
  assert.equal((await productApi.getAll()).length, 6)

  const patched = await productApi.update(created.id, { stock: 9 })
  assert.equal(patched.stock, 9)
  assert.equal(patched.name, '모니터 암', '고치지 않은 값은 그대로 남는다')

  await productApi.remove(created.id)
  assert.equal((await productApi.getAll()).length, 5)
})

test('게시글은 새로 쓴 것이 위로 오고, 작성자를 비우면 익명이 된다', async () => {
  const created = await postApi.create({ title: '오늘의 기록', author: '  ', content: '' })

  assert.equal(created.author, '익명')

  const posts = await postApi.getAll()
  assert.equal(posts[0].id, created.id, '가장 최근 글이 맨 앞')
  assert.equal(posts.length, 4)

  assert.deepEqual(
    (await postApi.getAll({ q: '인터셉터' })).map((row) => row.id),
    [1],
    '제목·내용·작성자를 함께 훑는다',
  )
})

test('등록한 것이 새로고침 뒤에도 남고, 초기화하면 처음으로 돌아간다', async () => {
  await productApi.create({ name: '스탠드', category: '기타', price: 1000, stock: 1 })
  assert.equal((await systemApi.getHealth()).productCount, 6)

  // 페이지를 새로 연 셈 — 저장소는 그대로 두고 다시 읽는다
  assert.equal((await productApi.getAll()).length, 6)

  const result = await systemApi.reset()
  assert.match(result.message, /처음 상태/)
  assert.equal((await systemApi.getHealth()).productCount, 5)
})

test('없는 것을 찾거나 이름 없이 등록하면 화면이 읽을 수 있는 말로 실패한다', async () => {
  await assert.rejects(() => productApi.getById(999), /999번 상품/)
  await assert.rejects(() => productApi.create({ name: '   ' }), /상품명은 반드시/)
  await assert.rejects(() => postApi.create({ title: '' }), /제목은 반드시/)

  // 실패해도 저장소가 더럽혀지지 않는다
  assert.equal((await productApi.getAll()).length, 5)
})

test('창구는 자기 이름표 아래로만 나간다', () => {
  // /api 로 그냥 나가면 /health · /reset 이 인우의 운세 API 와 겹친다
  assert.equal(http.defaults.baseURL, '/api/gayeon')
  assert.equal(typeof http.defaults.adapter, 'function')
})
