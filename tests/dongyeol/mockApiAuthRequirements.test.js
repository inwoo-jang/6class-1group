import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { createProduct, deleteProduct, listProducts, resetProducts, updateProduct } from '../../mock-api/dongyeol/data/productStore.js'
import { createPost, deletePost, listPosts, resetPosts, updatePost } from '../../mock-api/dongyeol/data/postStore.js'
import { browserFallback } from '../../src/members/dongyeol/api/browserFallback.js'

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('동열 상품과 게시글 저장소가 CRUD 후 초기 상태로 복원된다', () => {
  resetProducts()
  const product = createProduct({
    name: '테스트 상품',
    category: '기타',
    price: 1000,
    stock: 1,
    description: '',
  })

  assert.equal(listProducts().length, 6)
  assert.equal(updateProduct(product.id, { stock: 3 }).stock, 3)
  assert.equal(deleteProduct(product.id).name, '테스트 상품')
  assert.equal(resetProducts().length, 5)

  resetPosts()
  const post = createPost({
    title: '테스트 게시글',
    content: 'CRUD 확인',
    author: '테스터',
  })

  assert.equal(listPosts().length, 4)
  assert.equal(updatePost(post.id, { title: '수정된 게시글' }).title, '수정된 게시글')
  assert.equal(deletePost(post.id).author, '테스터')
  assert.equal(resetPosts().length, 3)
})

test('정적 배포용 브라우저 Mock도 인증·CRUD·초기화 계약을 유지한다', () => {
  const login = browserFallback.login({ email: 'student@skala.com', password: '1234' })
  assert.equal(login.user.email, 'student@skala.com')
  assert.equal(browserFallback.getMyProfile(login.accessToken).role, 'STUDENT')

  browserFallback.reset()
  const product = browserFallback.createProduct({
    name: '브라우저 상품',
    category: '기타',
    price: 1200,
    stock: 2,
    description: 'fallback 검증',
  })
  assert.equal(browserFallback.getProducts({ q: '브라우저' })[0].id, product.id)
  assert.equal(browserFallback.updateProduct(product.id, { stock: 4 }).stock, 4)
  assert.equal(browserFallback.deleteProduct(product.id).id, product.id)

  const post = browserFallback.createPost({ title: '브라우저 게시글', content: 'fallback', author: '테스터' })
  assert.equal(browserFallback.getPost(post.id).title, '브라우저 게시글')
  assert.equal(browserFallback.deletePost(post.id).id, post.id)

  const reset = browserFallback.reset()
  assert.deepEqual({ productCount: reset.productCount, postCount: reset.postCount }, { productCount: 5, postCount: 3 })
})

test('localStorage가 읽기 전용으로 바뀌 뒤에도 현재 탭의 Mock 상태를 잃지 않는다', () => {
  const originalStorage = globalThis.localStorage
  let storedValue = null

  try {
    globalThis.localStorage = {
      getItem: () => storedValue,
      setItem: (_key, value) => {
        storedValue = value
      },
    }
    browserFallback.reset()

    globalThis.localStorage = {
      getItem: () => storedValue,
      setItem: () => {
        throw new Error('저장소 읽기 전용')
      },
    }
    browserFallback.createProduct({ name: '메모리 유지', category: '기타', price: 1, stock: 1, description: '' })
    assert.equal(browserFallback.getProducts().length, 6)
  } finally {
    if (typeof originalStorage === 'undefined') delete globalThis.localStorage
    else globalThis.localStorage = originalStorage
  }
})

test('팀 Mock 서버가 기존 운세 API와 동열 API를 함께 연결한다', () => {
  const serverSource = readSource('../../mock-api/server.js')
  const dongyeolRouterSource = readSource('../../mock-api/dongyeol/index.js')

  assert.match(serverSource, /handleDongyeolRoutes/)
  assert.match(serverSource, /fortune-records/)
  assert.match(dongyeolRouterSource, /handleAuthRoutes/)
  assert.match(dongyeolRouterSource, /handleProductRoutes/)
  assert.match(dongyeolRouterSource, /handlePostRoutes/)
  assert.match(dongyeolRouterSource, /handleSystemRoutes/)
})

test('동열 Mock API endpoint는 모두 /api/dongyeol namespace에 있다', () => {
  const authSource = readSource('../../mock-api/dongyeol/routes/authRoutes.js')
  const productSource = readSource('../../mock-api/dongyeol/routes/productRoutes.js')
  const postSource = readSource('../../mock-api/dongyeol/routes/postRoutes.js')
  const systemSource = readSource('../../mock-api/dongyeol/routes/systemRoutes.js')
  const routeSources = [authSource, productSource, postSource, systemSource].join('\n')

  assert.match(authSource, /const prefix = ['"]\/api\/dongyeol['"]/)
  assert.match(authSource, /\$\{prefix\}\/auth\/login/)
  assert.match(authSource, /\$\{prefix\}\/auth\/me/)
  assert.match(authSource, /\$\{prefix\}\/auth\/protected-message/)
  assert.match(productSource, /const collectionPath = ['"]\/api\/dongyeol\/products['"]/)
  assert.match(postSource, /const collectionPath = ['"]\/api\/dongyeol\/posts['"]/)
  assert.match(systemSource, /const prefix = ['"]\/api\/dongyeol['"]/)
  assert.match(systemSource, /\$\{prefix\}\/health/)
  assert.match(systemSource, /\$\{prefix\}\/reset/)

  assert.doesNotMatch(routeSources, /['"]\/api\/(?!dongyeol(?:\/|['"]))/)
})

test('동열 Axios client는 전용 base URL과 저장된 JWT Bearer 헤더를 사용한다', () => {
  const httpSource = readSource('../../src/members/dongyeol/api/http.js')

  assert.match(httpSource, /VITE_DONGYEOL_API_BASE_URL/)
  assert.match(httpSource, /['"]\/api\/dongyeol['"]/)
  assert.match(httpSource, /http\.interceptors\.request\.use/)
  assert.match(httpSource, /config\.headers\.Authorization = `Bearer \$\{accessToken\}`/)
  assert.match(httpSource, /dongyeol[^'"]*jwt[^'"]*access-token/)
  assert.doesNotMatch(httpSource, /VITE_API_BASE_URL/)
})

test('대시보드 route는 팀 Router의 meta.auth 계약으로 보호된다', () => {
  const routeSource = readSource('../../src/members/dongyeol/routes.js')
  const dashboardSource = readSource('../../src/members/dongyeol/views/DashboardView.vue')

  assert.match(routeSource, /path:\s*'dashboard'[\s\S]*name:\s*'dashboard'[\s\S]*requiresAuth:\s*true/)
  assert.match(routeSource, /auth:\s*(?:async\s*)?\(/)
  assert.match(dashboardSource, /<ProductManager/)
  assert.match(dashboardSource, /<PostManager/)
  assert.match(dashboardSource, /상품 API/)
  assert.match(dashboardSource, /게시글 API/)
  assert.match(dashboardSource, /user\?\.email/)
  assert.match(dashboardSource, /user\?\.role/)
  assert.match(dashboardSource, /@click="logout"/)
})

test('하단 내비게이션은 날씨·대시보드·로그인·소개 순서다', () => {
  const shellSource = readSource('../../src/members/dongyeol/index.vue')
  const labels = ['<span>날씨</span>', '<span>대시보드</span>', '<span>로그인</span>', '<span>소개</span>']
  const indexes = labels.map((label) => shellSource.indexOf(label))

  assert.ok(indexes.every((index) => index >= 0))
  assert.deepEqual(
    indexes,
    [...indexes].sort((first, second) => first - second),
  )
})

test('내비게이션 화면은 선택한 날씨의 동적 테마를 공유한다', () => {
  const loginSource = readSource('../../src/members/dongyeol/views/LoginView.vue')
  const dashboardSource = readSource('../../src/members/dongyeol/views/DashboardView.vue')
  const aboutSource = readSource('../../src/members/dongyeol/views/WeatherAboutView.vue')
  const sharedThemeSource = readSource('../../src/members/dongyeol/composables/useSharedWeatherTheme.js')

  for (const source of [loginSource, dashboardSource, aboutSource]) {
    assert.match(source, /useSharedWeatherTheme/)
    assert.match(source, /:data-theme="\w+Theme\.name"/)
    assert.match(source, /var\(--hero-start\)/)
    assert.match(source, /var\(--hero-end\)/)
    assert.match(source, /var\(--weather-accent\)/)
  }

  assert.match(sharedThemeSource, /weatherList\.value\.find/)
  assert.match(sharedThemeSource, /weather\.id === selectedCityId\.value/)
  assert.match(sharedThemeSource, /getWeatherTheme\(selectedWeather\.value\)/)
})

test('삭제와 전체 초기화는 접근 가능한 공통 확인창을 사용한다', () => {
  const dashboardSource = readSource('../../src/members/dongyeol/views/DashboardView.vue')
  const productSource = readSource('../../src/members/dongyeol/components/mock/ProductManager.vue')
  const postSource = readSource('../../src/members/dongyeol/components/mock/PostManager.vue')
  const dialogSource = readSource('../../src/members/dongyeol/components/common/ConfirmDialog.vue')

  for (const source of [dashboardSource, productSource, postSource]) {
    assert.match(source, /<ConfirmDialog/)
    assert.doesNotMatch(source, /window\.confirm/)
  }

  assert.match(dialogSource, /role="alertdialog"/)
  assert.match(dialogSource, /aria-modal="true"/)
  assert.match(dialogSource, /event\.key === 'Escape'/)
  assert.match(dialogSource, /previouslyFocusedElement/)
})
