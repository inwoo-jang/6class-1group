/**
 * 가연 Mock API 의 속.
 * ------------------------------------------------------------------
 * 상품과 게시글에 무슨 일이 일어나는지를 여기 한 곳에만 적는다.
 * 이 파일은 브라우저도 서버도 아니다 — 요청 하나를 받아 응답 하나를 계산할 뿐,
 * 저장은 부르는 쪽이 알아서 한다.
 *
 *   browserBackend.js      배포본. localStorage 에 담아 두고 이 속을 부른다
 *   mock-api/gayeon/       `npm run api` 로 띄우는 진짜 서버. 메모리에 담는다
 *
 * 두 곳이 같은 속을 쓰므로, 로컬에서 본 동작과 배포본에서 본 동작이 어긋나지 않는다.
 */

/** 실습용 초기 데이터. '초기화' 는 언제나 이 모습으로 되돌린다 */
export const createInitialData = () => ({
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

/** 화면이 그대로 읽어 보여 줄 수 있는 실패. status 는 HTTP 응답 코드가 된다 */
export class MockApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'MockApiError'
    this.status = status
  }
}

const nextId = (rows) => rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1

const has = (text, needle) => String(text ?? '').toLowerCase().includes(needle)

/* ── 상품 ────────────────────────────────────────────────────────── */

const listProducts = (db, params) => {
  const q = String(params.q ?? '').trim().toLowerCase()
  const category = params.category
  const availableOnly = params.available === true || params.available === 'true'

  return db.products
    .filter((product) => (q ? has(product.name, q) || has(product.description, q) : true))
    .filter((product) => (category && category !== '전체' ? product.category === category : true))
    .filter((product) => (availableOnly ? product.stock > 0 : true))
    .sort((a, b) => a.id - b.id)
}

const createProduct = (db, body) => {
  const name = String(body?.name ?? '').trim()
  if (!name) throw new MockApiError(400, '상품명은 반드시 입력해야 합니다.')

  const product = {
    id: nextId(db.products),
    name,
    category: body?.category ?? '기타',
    price: Number(body?.price) || 0,
    stock: Number(body?.stock) || 0,
    description: String(body?.description ?? '').trim(),
  }

  db.products.push(product)
  return product
}

/* ── 게시글 ──────────────────────────────────────────────────────── */

const listPosts = (db, params) => {
  const q = String(params.q ?? '').trim().toLowerCase()

  return db.posts
    .filter((post) =>
      q ? has(post.title, q) || has(post.content, q) || has(post.author, q) : true,
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

const createPost = (db, body) => {
  const title = String(body?.title ?? '').trim()
  if (!title) throw new MockApiError(400, '제목은 반드시 입력해야 합니다.')

  const now = new Date().toISOString()
  const post = {
    id: nextId(db.posts),
    title,
    author: String(body?.author ?? '').trim() || '익명',
    content: String(body?.content ?? '').trim(),
    createdAt: now,
    updatedAt: now,
  }

  db.posts.push(post)
  return post
}

/* ── 주소를 보고 갈래를 나눈다 ──────────────────────────────────── */

/**
 * @param db      { products, posts } — 이 자리에서 직접 고쳐진다
 * @param request { method, path, body, params }
 *                path 는 '/products' · '/posts/3' 처럼 이름표를 뗀 나머지
 * @returns { status, data }
 * @throws  MockApiError
 */
export const handleMockRequest = (db, { method, path, body, params = {} }) => {
  const verb = String(method ?? 'get').toLowerCase()
  const [, collection, rawId] = String(path ?? '').split('/')
  const id = rawId ? Number(rawId) : null

  if (collection === 'health' && verb === 'get') {
    return {
      status: 200,
      data: {
        status: 'ok',
        service: 'Gayeon Mock API',
        productCount: db.products.length,
        postCount: db.posts.length,
      },
    }
  }

  if (collection === 'reset' && verb === 'post') {
    const fresh = createInitialData()
    db.products = fresh.products
    db.posts = fresh.posts
    return { status: 200, data: { message: '상품과 게시글을 처음 상태로 되돌렸습니다.' } }
  }

  if (collection !== 'products' && collection !== 'posts') {
    throw new MockApiError(404, `${path} 는 없는 주소입니다.`)
  }

  const rows = db[collection]
  const label = collection === 'products' ? '상품' : '게시글'

  if (id === null) {
    if (verb === 'get') {
      return {
        status: 200,
        data: collection === 'products' ? listProducts(db, params) : listPosts(db, params),
      }
    }
    if (verb === 'post') {
      return {
        status: 201,
        data: collection === 'products' ? createProduct(db, body) : createPost(db, body),
      }
    }
    throw new MockApiError(405, `${verb.toUpperCase()} 는 이 주소에서 쓸 수 없습니다.`)
  }

  const index = rows.findIndex((row) => row.id === id)
  if (index === -1) throw new MockApiError(404, `${id}번 ${label}을(를) 찾을 수 없습니다.`)

  if (verb === 'get') return { status: 200, data: rows[index] }

  if (verb === 'patch' || verb === 'put') {
    const patch = { ...(body ?? {}) }
    delete patch.id
    delete patch.createdAt

    if (collection === 'products') {
      if ('price' in patch) patch.price = Number(patch.price) || 0
      if ('stock' in patch) patch.stock = Number(patch.stock) || 0
      if ('name' in patch && !String(patch.name).trim()) {
        throw new MockApiError(400, '상품명은 반드시 입력해야 합니다.')
      }
    } else {
      if ('title' in patch && !String(patch.title).trim()) {
        throw new MockApiError(400, '제목은 반드시 입력해야 합니다.')
      }
      if ('author' in patch) patch.author = String(patch.author).trim() || '익명'
      patch.updatedAt = new Date().toISOString()
    }

    rows[index] = { ...rows[index], ...patch }
    return { status: 200, data: rows[index] }
  }

  if (verb === 'delete') {
    const [removed] = rows.splice(index, 1)
    return {
      status: 200,
      data: { message: `${label} '${removed.name ?? removed.title}' 을(를) 삭제했습니다.`, id },
    }
  }

  throw new MockApiError(405, `${verb.toUpperCase()} 는 이 주소에서 쓸 수 없습니다.`)
}
