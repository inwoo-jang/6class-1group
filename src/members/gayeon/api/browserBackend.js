/**
 * 브라우저 안에서 도는 Mock API.
 * ------------------------------------------------------------------
 * 이 갤러리는 GitHub Pages 에 올라간다. 정적 호스팅이라 서버가 없다.
 * localhost:3001 로 나가는 요청은 배포본에서 갈 곳이 없다.
 *
 * 그래서 Axios 의 adapter 자리를 대신 채운다. adapter 는 "요청을 실제로
 * 내보내는 사람"이다. 여기를 바꾸면 productApi · postApi · 화면 코드는
 * 자기가 진짜 서버와 이야기하는 줄 알고 그대로 돌아간다 — 한 줄도 고칠 게 없다.
 *
 * 데이터는 localStorage 에 남는다. 새로고침해도 방금 등록한 상품이 그대로 있고,
 * '초기화' 를 누르면 처음 상태로 돌아온다.
 *
 * 이건 배포본에서만 끼워진다. localhost 에서는 `npm run api` 로 띄운
 * 진짜 서버로 나간다 — 실습에서 봐야 할 네트워크 탭이 사라지면 안 되므로.
 */

const STORE_KEY = 'weather-diary-mock-api'

/** 실습용 초기 데이터. '초기화' 는 언제나 이 모습으로 되돌린다 */
const seed = () => ({
  products: [
    {
      id: 1,
      name: '노트북 거치대',
      category: '장비',
      price: 32000,
      stock: 12,
      description: '높이를 6단계로 조절할 수 있는 알루미늄 거치대입니다.',
    },
    {
      id: 2,
      name: '기계식 키보드',
      category: '장비',
      price: 89000,
      stock: 0,
      description: '적축 스위치, 무선 연결을 지원합니다.',
    },
    {
      id: 3,
      name: 'Vue.js 완벽 가이드',
      category: '도서',
      price: 28000,
      stock: 7,
      description: 'Composition API 를 중심으로 다시 쓴 개정판입니다.',
    },
    {
      id: 4,
      name: '프런트엔드 실전 강의',
      category: '강의',
      price: 145000,
      stock: 30,
      description: '8주 과정, 매주 과제 피드백이 있습니다.',
    },
    {
      id: 5,
      name: '텀블러',
      category: '기타',
      price: 18000,
      stock: 3,
      description: '보온 6시간, 식기세척기 사용이 가능합니다.',
    },
  ],
  posts: [
    {
      id: 1,
      title: 'Axios 인터셉터는 언제 쓰나요?',
      author: '가연',
      content:
        '요청마다 토큰을 붙이거나, 오류 메시지를 한 곳에서 다듬을 때 씁니다. 화면마다 같은 코드를 쓰지 않아도 됩니다.',
      createdAt: '2026-07-28T09:12:00.000Z',
      updatedAt: '2026-07-28T09:12:00.000Z',
    },
    {
      id: 2,
      title: 'reactive 와 ref, 무엇을 쓸까',
      author: '익명',
      content:
        '폼처럼 여러 값이 한 덩어리면 reactive, 하나짜리 값이면 ref 가 읽기 편합니다. 정답은 없고 팀 규칙을 따르면 됩니다.',
      createdAt: '2026-07-30T02:40:00.000Z',
      updatedAt: '2026-07-30T02:40:00.000Z',
    },
    {
      id: 3,
      title: '오늘 배운 것 — CRUD 한 바퀴',
      author: '가연',
      content: '등록하고, 목록에서 찾고, 고치고, 지웠습니다. 네 가지가 전부였습니다.',
      createdAt: '2026-08-01T11:05:00.000Z',
      updatedAt: '2026-08-01T11:05:00.000Z',
    },
  ],
})

const read = () => {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw)
    // 저장된 모양이 깨졌으면 조용히 처음으로 돌린다
    if (!Array.isArray(parsed?.products) || !Array.isArray(parsed?.posts)) return seed()
    return parsed
  } catch {
    return seed()
  }
}

const write = (db) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(db))
  } catch {
    // 저장 공간이 막혀 있어도 화면은 계속 돌아가야 한다
  }
}

const nextId = (rows) => rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1

const has = (text, needle) => String(text ?? '').toLowerCase().includes(needle)

/** 서버가 응답을 주기까지 걸리는 시간. 로딩 표시가 눈에 보여야 실습이 된다 */
const LATENCY_MS = 220

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Axios 가 오류로 알아듣는 모양. http.js 의 인터셉터가 message 를 꺼내 쓴다 */
const httpError = (status, message, config) =>
  Object.assign(new Error(message), {
    isAxiosError: true,
    config,
    response: { status, data: { message }, config, headers: {}, statusText: message },
  })

const ok = (data, config, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config,
})

/* ── 상품 ────────────────────────────────────────────────────────── */

const listProducts = (db, params = {}) => {
  const q = String(params.q ?? '').trim().toLowerCase()
  const category = params.category
  const availableOnly = Boolean(params.available)

  return db.products
    .filter((product) => (q ? has(product.name, q) || has(product.description, q) : true))
    .filter((product) => (category && category !== '전체' ? product.category === category : true))
    .filter((product) => (availableOnly ? product.stock > 0 : true))
    .sort((a, b) => a.id - b.id)
}

const createProduct = (db, body) => {
  const product = {
    id: nextId(db.products),
    name: String(body?.name ?? '').trim(),
    category: body?.category ?? '기타',
    price: Number(body?.price) || 0,
    stock: Number(body?.stock) || 0,
    description: String(body?.description ?? '').trim(),
  }

  if (!product.name) throw new Error('상품명은 반드시 입력해야 합니다.')

  db.products.push(product)
  return product
}

/* ── 게시글 ──────────────────────────────────────────────────────── */

const listPosts = (db, params = {}) => {
  const q = String(params.q ?? '').trim().toLowerCase()

  return db.posts
    .filter((post) =>
      q ? has(post.title, q) || has(post.content, q) || has(post.author, q) : true,
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

const createPost = (db, body) => {
  const now = new Date().toISOString()
  const post = {
    id: nextId(db.posts),
    title: String(body?.title ?? '').trim(),
    author: String(body?.author ?? '').trim() || '익명',
    content: String(body?.content ?? '').trim(),
    createdAt: now,
    updatedAt: now,
  }

  if (!post.title) throw new Error('제목은 반드시 입력해야 합니다.')

  db.posts.push(post)
  return post
}

/* ── 주소를 보고 갈래를 나눈다 ──────────────────────────────────── */

const handle = (db, method, path, body, params) => {
  const [, collection, rawId] = path.split('/')
  const id = rawId ? Number(rawId) : null

  if (collection === 'health' && method === 'get') {
    return ok({
      status: 'ok',
      mode: 'browser',
      productCount: db.products.length,
      postCount: db.posts.length,
    })
  }

  if (collection === 'reset' && method === 'post') {
    const fresh = seed()
    db.products = fresh.products
    db.posts = fresh.posts
    return ok({ message: '상품과 게시글을 처음 상태로 되돌렸습니다.' })
  }

  if (collection !== 'products' && collection !== 'posts') {
    return httpError(404, `${path} 는 없는 주소입니다.`)
  }

  const rows = db[collection]
  const label = collection === 'products' ? '상품' : '게시글'

  if (id === null) {
    if (method === 'get') {
      return ok(collection === 'products' ? listProducts(db, params) : listPosts(db, params))
    }
    if (method === 'post') {
      const created = collection === 'products' ? createProduct(db, body) : createPost(db, body)
      return ok(created, undefined, 201)
    }
    return httpError(405, `${method.toUpperCase()} 는 이 주소에서 쓸 수 없습니다.`)
  }

  const index = rows.findIndex((row) => row.id === id)
  if (index === -1) return httpError(404, `${id}번 ${label}을(를) 찾을 수 없습니다.`)

  if (method === 'get') return ok(rows[index])

  if (method === 'patch' || method === 'put') {
    const patch = { ...(body ?? {}) }
    delete patch.id
    delete patch.createdAt

    if (collection === 'products') {
      if ('price' in patch) patch.price = Number(patch.price) || 0
      if ('stock' in patch) patch.stock = Number(patch.stock) || 0
      if ('name' in patch && !String(patch.name).trim()) {
        return httpError(400, '상품명은 반드시 입력해야 합니다.')
      }
    } else {
      if ('title' in patch && !String(patch.title).trim()) {
        return httpError(400, '제목은 반드시 입력해야 합니다.')
      }
      if ('author' in patch) patch.author = String(patch.author).trim() || '익명'
      patch.updatedAt = new Date().toISOString()
    }

    rows[index] = { ...rows[index], ...patch }
    return ok(rows[index])
  }

  if (method === 'delete') {
    const [removed] = rows.splice(index, 1)
    return ok({ message: `${label} '${removed.name ?? removed.title}' 을(를) 삭제했습니다.`, id })
  }

  return httpError(405, `${method.toUpperCase()} 는 이 주소에서 쓸 수 없습니다.`)
}

/**
 * Axios adapter. 요청 하나를 받아 응답 하나를 돌려준다.
 * 진짜 서버가 하던 일을 그대로, 다만 네트워크를 건너뛰고 한다.
 */
export const browserBackend = async (config) => {
  await wait(LATENCY_MS)

  const method = String(config.method ?? 'get').toLowerCase()
  // baseURL 을 뗀 나머지 — '/products/3' 같은 모양이 된다
  const path = String(config.url ?? '').replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '') || '/'

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
    result = handle(db, method, path, body, config.params ?? {})
  } catch (error) {
    // createProduct · createPost 가 던진 입력값 문제
    throw httpError(400, error.message, config)
  }

  if (result instanceof Error) {
    throw Object.assign(result, { config })
  }

  write(db)
  return { ...result, config }
}
