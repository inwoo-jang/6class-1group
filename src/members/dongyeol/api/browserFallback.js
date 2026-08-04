const stateStorageKey = 'dongyeol-skala-vue-browser-api-state-v1'
let memoryState = null
let storageWriteFailed = false

const initialProducts = [
  { id: 1, name: 'Vue 3 실전 가이드', category: '도서', price: 32000, stock: 8, description: 'Composition API와 컴포넌트 설계를 다루는 실습서' },
  { id: 2, name: '무선 키보드', category: '장비', price: 49000, stock: 5, description: '프런트엔드 개발자를 위한 저소음 무선 키보드' },
  { id: 3, name: '버티컬 마우스', category: '장비', price: 39000, stock: 0, description: '손목 부담을 줄이는 인체공학 마우스' },
  { id: 4, name: 'USB-C 허브', category: '장비', price: 59000, stock: 4, description: 'HDMI와 USB 포트를 지원하는 7-in-1 허브' },
  { id: 5, name: '웹 접근성 체크리스트', category: '도서', price: 18000, stock: 12, description: '실무 UI 접근성 점검 항목을 정리한 핸드북' },
]

const initialPosts = [
  {
    id: 1,
    title: 'Vue 학습을 시작합니다',
    content: 'Composition API부터 차근차근 실습해 봅시다.',
    author: '관리자',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 2,
    title: 'Mock API 활용 방법',
    content: 'Axios로 목록 조회, 등록, 수정, 삭제 요청을 연습합니다.',
    author: 'Vue 강사',
    createdAt: '2026-08-02T10:30:00.000Z',
    updatedAt: '2026-08-02T10:30:00.000Z',
  },
  {
    id: 3,
    title: 'npm run api 안내',
    content: 'Vite 개발 서버와 Node Mock API 서버를 각각 실행해 실습합니다.',
    author: '실습 도우미',
    createdAt: '2026-08-03T13:20:00.000Z',
    updatedAt: '2026-08-03T13:20:00.000Z',
  },
]

const mockUsers = [
  { id: 1, email: 'student@skala.com', password: '1234', name: 'SKALA 수강생', role: 'STUDENT', department: 'Frontend Class' },
  { id: 2, email: 'admin@skala.com', password: 'admin1234', name: '실습 관리자', role: 'ADMIN', department: 'Training Center' },
]

const clone = (value) => JSON.parse(JSON.stringify(value))
const publicUser = ({ password: _password, ...user }) => user

function initialState() {
  return {
    products: clone(initialProducts),
    posts: clone(initialPosts),
    nextProductId: Math.max(...initialProducts.map(({ id }) => id)) + 1,
    nextPostId: Math.max(...initialPosts.map(({ id }) => id)) + 1,
  }
}

function readState() {
  if (storageWriteFailed && memoryState) return clone(memoryState)

  try {
    const stored = JSON.parse(localStorage.getItem(stateStorageKey))
    if (Array.isArray(stored?.products) && Array.isArray(stored?.posts)) return stored
  } catch {}

  if (memoryState) return clone(memoryState)

  const state = initialState()
  writeState(state)
  return state
}

function writeState(state) {
  memoryState = clone(state)
  try {
    localStorage.setItem(stateStorageKey, JSON.stringify(state))
    storageWriteFailed = false
  } catch {
    // 저장소 접근이 차단된 브라우저에서는 현재 탭의 메모리 상태를 사용합니다.
    storageWriteFailed = true
  }
}

function createApiError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function encodeJson(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function createBrowserToken(user) {
  const now = Math.floor(Date.now() / 1000)
  const header = encodeJson({ alg: 'none', typ: 'JWT' })
  const payload = encodeJson({ sub: String(user.id), email: user.email, name: user.name, role: user.role, iat: now, exp: now + 60 * 60, iss: 'dongyeol-browser-fallback' })
  return `${header}.${payload}.browser-fallback`
}

function decodeBrowserToken(accessToken) {
  try {
    const encodedPayload = accessToken?.split('.')[1]
    const base64 = encodedPayload.replaceAll('-', '+').replaceAll('_', '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
    const payload = JSON.parse(new TextDecoder().decode(bytes))
    if (payload.iss !== 'dongyeol-browser-fallback' || payload.exp <= Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

function authenticatedUser(accessToken) {
  const payload = decodeBrowserToken(accessToken)
  const user = payload ? mockUsers.find(({ id }) => String(id) === payload.sub) : null
  if (!user) throw createApiError(401, '로그인이 필요합니다.')
  return publicUser(user)
}

function normalizeProduct(input, partial = false) {
  const normalized = {}
  const allowedFields = ['name', 'category', 'price', 'stock', 'description']

  for (const field of allowedFields) {
    if (!Object.hasOwn(input, field)) continue
    normalized[field] = field === 'price' || field === 'stock' ? Number(input[field]) : field === 'name' ? input[field].trim() : input[field]
  }

  if (!partial) {
    normalized.category = normalized.category?.trim() || '기타'
    normalized.description = normalized.description ?? ''
  }
  return normalized
}

function validateProduct(input, partial = false) {
  if ((!partial || Object.hasOwn(input, 'name')) && (typeof input.name !== 'string' || !input.name.trim())) throw createApiError(400, '상품명은 필수입니다.')
  if ((!partial || Object.hasOwn(input, 'price')) && (input.price === '' || !Number.isFinite(Number(input.price)) || Number(input.price) < 0)) throw createApiError(400, '가격은 0 이상의 숫자여야 합니다.')
  if ((!partial || Object.hasOwn(input, 'stock')) && (input.stock === '' || !Number.isInteger(Number(input.stock)) || Number(input.stock) < 0)) throw createApiError(400, '재고는 0 이상의 정수여야 합니다.')
  if (Object.hasOwn(input, 'category') && typeof input.category !== 'string') throw createApiError(400, '카테고리는 문자열이어야 합니다.')
  if (Object.hasOwn(input, 'description') && typeof input.description !== 'string') throw createApiError(400, '상품 설명은 문자열이어야 합니다.')
}

function normalizePost(input, partial = false) {
  const normalized = {}
  for (const field of ['title', 'content', 'author']) {
    if (Object.hasOwn(input, field)) normalized[field] = input[field].trim()
  }
  if (!partial) {
    normalized.content = normalized.content ?? ''
    normalized.author = normalized.author || '익명'
  }
  return normalized
}

function validatePost(input, partial = false) {
  if ((!partial || Object.hasOwn(input, 'title')) && (typeof input.title !== 'string' || !input.title.trim())) throw createApiError(400, '게시글 제목은 필수입니다.')
  for (const field of ['content', 'author']) {
    if (Object.hasOwn(input, field) && typeof input[field] !== 'string') throw createApiError(400, `${field === 'content' ? '내용' : '작성자'}은 문자열이어야 합니다.`)
  }
}

export const browserFallback = {
  login({ email, password }) {
    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedEmail || !password) throw createApiError(400, '이메일과 비밀번호를 입력해주세요.')
    const user = mockUsers.find((item) => item.email === normalizedEmail && item.password === password)
    if (!user) throw createApiError(401, '이메일 또는 비밀번호가 올바르지 않습니다.')
    return {
      message: '로그인에 성공했습니다.',
      tokenType: 'Bearer',
      accessToken: createBrowserToken(user),
      expiresIn: 3600,
      user: publicUser(user),
    }
  },

  getMyProfile(accessToken) {
    return authenticatedUser(accessToken)
  },

  getProtectedMessage(accessToken) {
    const user = authenticatedUser(accessToken)
    return { message: `${user.name}님, 브라우저 Mock 인증 호출에 성공했습니다.`, role: user.role, requestedAt: new Date().toISOString() }
  },

  getHealth() {
    const state = readState()
    return { status: 'ok', service: 'Dongyeol Browser Mock API', productCount: state.products.length, postCount: state.posts.length, authentication: 'ready', transport: 'browser' }
  },

  reset() {
    const state = initialState()
    writeState(state)
    return { message: '상품과 게시글 Mock 데이터가 초기화되었습니다.', productCount: state.products.length, postCount: state.posts.length }
  },

  getProducts(params = {}) {
    const state = readState()
    const query = (params.q ?? '').trim().toLowerCase()
    const category = params.category ?? '전체'
    const onlyAvailable = params.available === true || params.available === 'true'
    return clone(
      state.products.filter((product) => {
        const matchesQuery = !query || product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query)
        return matchesQuery && (category === '전체' || product.category === category) && (!onlyAvailable || product.stock > 0)
      }),
    )
  },

  getProduct(productId) {
    const product = readState().products.find(({ id }) => id === Number(productId))
    if (!product) throw createApiError(404, '상품을 찾을 수 없습니다.')
    return clone(product)
  },

  createProduct(input) {
    validateProduct(input)
    const state = readState()
    const product = { id: state.nextProductId++, ...normalizeProduct(input) }
    state.products.push(product)
    writeState(state)
    return clone(product)
  },

  updateProduct(productId, input) {
    const state = readState()
    const product = state.products.find(({ id }) => id === Number(productId))
    if (!product) throw createApiError(404, '수정할 상품을 찾을 수 없습니다.')
    validateProduct(input, true)
    Object.assign(product, normalizeProduct(input, true))
    writeState(state)
    return clone(product)
  },

  deleteProduct(productId) {
    const state = readState()
    const index = state.products.findIndex(({ id }) => id === Number(productId))
    if (index === -1) throw createApiError(404, '삭제할 상품을 찾을 수 없습니다.')
    const [product] = state.products.splice(index, 1)
    writeState(state)
    return clone(product)
  },

  getPosts(params = {}) {
    const query = (params.q ?? '').trim().toLowerCase()
    return clone(
      readState()
        .posts.filter((post) => !query || post.title.toLowerCase().includes(query) || post.content.toLowerCase().includes(query) || post.author.toLowerCase().includes(query))
        .toSorted((first, second) => second.id - first.id),
    )
  },

  getPost(postId) {
    const post = readState().posts.find(({ id }) => id === Number(postId))
    if (!post) throw createApiError(404, '게시글을 찾을 수 없습니다.')
    return clone(post)
  },

  createPost(input) {
    validatePost(input)
    const state = readState()
    const now = new Date().toISOString()
    const post = { id: state.nextPostId++, ...normalizePost(input), createdAt: now, updatedAt: now }
    state.posts.push(post)
    writeState(state)
    return clone(post)
  },

  updatePost(postId, input) {
    const state = readState()
    const post = state.posts.find(({ id }) => id === Number(postId))
    if (!post) throw createApiError(404, '수정할 게시글을 찾을 수 없습니다.')
    validatePost(input, true)
    Object.assign(post, normalizePost(input, true), { updatedAt: new Date().toISOString() })
    writeState(state)
    return clone(post)
  },

  deletePost(postId) {
    const state = readState()
    const index = state.posts.findIndex(({ id }) => id === Number(postId))
    if (index === -1) throw createApiError(404, '삭제할 게시글을 찾을 수 없습니다.')
    const [post] = state.posts.splice(index, 1)
    writeState(state)
    return clone(post)
  },
}
