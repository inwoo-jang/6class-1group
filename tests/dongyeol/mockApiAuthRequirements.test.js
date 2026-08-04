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

test('인증 화면에서 제거한 보호 메시지 client 상태와 서버·브라우저 fallback 계약을 구분한다', () => {
  const authApiSource = readSource('../../src/members/dongyeol/api/authApi.js')
  const authStoreSource = readSource('../../src/members/dongyeol/stores/auth.js')
  const browserFallbackSource = readSource('../../src/members/dongyeol/api/browserFallback.js')
  const authRouteSource = readSource('../../mock-api/dongyeol/routes/authRoutes.js')

  assert.doesNotMatch(authApiSource, /getProtectedMessage/)
  assert.doesNotMatch(authStoreSource, /protectedMessage|authorizationHeader|tokenPayload|fetchProtectedMessage|decodeJwtPayload/)
  assert.match(browserFallbackSource, /getProtectedMessage\(accessToken\)/)
  assert.match(authRouteSource, /auth\/protected-message/)
})

test('대시보드는 팀 인증 보호 경로이며 로그인 후 상품·게시글 탭을 제공한다', () => {
  const routeSource = readSource('../../src/members/dongyeol/routes.js')
  const dashboardSource = readSource('../../src/members/dongyeol/views/DashboardView.vue')

  assert.match(routeSource, /path:\s*'dashboard'[\s\S]*requiresAuth:\s*true/)
  assert.match(routeSource, /path:\s*'login'[\s\S]*LoginView\.vue/)
  assert.match(routeSource, /auth:\s*(?:async\s*)?\(/)
  assert.match(dashboardSource, /<ProductManager/)
  assert.match(dashboardSource, /<PostManager/)
  assert.match(dashboardSource, /상품 API/)
  assert.match(dashboardSource, /게시글 API/)
  assert.match(dashboardSource, /user\?\.email/)
  assert.match(dashboardSource, /user\?\.role/)
  assert.match(dashboardSource, /@click="logout"/)
  assert.doesNotMatch(dashboardSource, /Decoded payload|Raw access token|Authorization header|보호 API 확인/)
})

test('하단 내비게이션은 인증 상태에 따라 로그인과 대시보드를 한 자리에서 전환한다', () => {
  const shellSource = readSource('../../src/members/dongyeol/index.vue')

  assert.match(shellSource, /const \{ isLoggedIn \} = storeToRefs\(authStore\)/)
  assert.match(shellSource, /const accountNavigation = computed/)
  assert.match(shellSource, /label:\s*'대시보드'/)
  assert.match(shellSource, /label:\s*'로그인'/)
  assert.equal((shellSource.match(/<RouterLink/g) ?? []).length, 3)
  assert.match(shellSource, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(shellSource, /width:\s*calc\(\(100% - 6px\) \/ 3\)/)
})

test('내비게이션 화면은 선택한 날씨의 동적 테마와 장면 규칙을 공유한다', () => {
  const loginSource = readSource('../../src/members/dongyeol/views/LoginView.vue')
  const dashboardSource = readSource('../../src/members/dongyeol/views/DashboardView.vue')
  const aboutSource = readSource('../../src/members/dongyeol/views/WeatherAboutView.vue')
  const sceneSource = readSource('../../src/members/dongyeol/components/common/WeatherScene.vue')
  const sharedThemeSource = readSource('../../src/members/dongyeol/composables/useSharedWeatherTheme.js')

  for (const source of [loginSource, dashboardSource, aboutSource]) {
    assert.match(source, /import WeatherScene/)
    assert.match(source, /<WeatherScene/)
    assert.match(source, /letter-spacing:\s*-0\.0(?:5|6)/)
    assert.match(source, /backdrop-filter:\s*blur\(/)
    assert.doesNotMatch(source, /#102f2b|#1b7765|#11322c|#1a5548/)
  }

  assert.match(sceneSource, /useSharedWeatherTheme/)
  assert.match(sceneSource, /:style="activeTheme\.cssVariables"/)
  assert.match(sceneSource, /:data-theme="activeTheme\.name"/)
  assert.match(sceneSource, /linear-gradient\(158deg, var\(--hero-start\)/)
  assert.match(sceneSource, /backdrop-filter|filter:\s*blur\(/)
  assert.match(sharedThemeSource, /weatherList\.value\.find/)
  assert.match(sharedThemeSource, /weather\.id === selectedCityId\.value/)
  assert.match(sharedThemeSource, /activeSceneTheme\.value \?\? getWeatherTheme\(selectedWeather\.value\)/)
  assert.match(sharedThemeSource, /setActiveSceneWeatherTheme/)

  for (const state of ['clouds', 'rain', 'thunderstorm', 'snow', 'mist']) {
    assert.match(sceneSource, new RegExp(`data-theme='${state}'`))
  }
})

test('로그인과 대시보드는 설명용 랜딩 없이 실제 조작 화면을 바로 제공한다', () => {
  const loginSource = readSource('../../src/members/dongyeol/views/LoginView.vue')
  const dashboardSource = readSource('../../src/members/dongyeol/views/DashboardView.vue')

  assert.match(loginSource, /return null/)
  assert.match(loginSource, /name="email"/)
  assert.match(loginSource, /name="password"/)
  assert.match(loginSource, /:aria-busy="authStore\.isLoading"/)
  assert.match(loginSource, /<span>콘텐츠 운영<\/span>\s*<h1 id="login-title">로그인<\/h1>/)
  assert.doesNotMatch(loginSource, /FlowSteps|JWT 로그인 처리 흐름|실습을 시작합니다|login-mark|관리 계정으로 계속하세요/)

  assert.match(dashboardSource, /const healthState = ref\('checking'\)/)
  assert.match(dashboardSource, /'API 연결됨'/)
  assert.match(dashboardSource, /'API 연결 실패'/)
  assert.match(dashboardSource, /<section class="api-section"/)
  assert.doesNotMatch(dashboardSource, /labEntry|moveToLab|API 실습을 시작해 볼까요/)
})

test('상품과 게시글 탭은 같은 collection 화면과 맞춤형 select를 사용한다', () => {
  const productSource = readSource('../../src/members/dongyeol/components/mock/ProductManager.vue')
  const postSource = readSource('../../src/members/dongyeol/components/mock/PostManager.vue')
  const collectionStyles = readSource('../../src/members/dongyeol/assets/collection-manager.css')

  for (const source of [productSource, postSource]) {
    assert.match(source, /workspace-intro/)
    assert.match(source, /workspace-layout/)
    assert.match(source, /editor-panel/)
    assert.match(source, /collection-panel/)
    assert.match(source, /var\(--hero-muted\)/)
    assert.doesNotMatch(source, /method-badge|panel--form|panel--content/)
  }

  assert.match(collectionStyles, /\.filter-strip select,\s*\.editor-form select\s*\{[^}]*appearance:\s*none;[^}]*background-image:/s)
  assert.match(collectionStyles, /background-position:[^;]*calc\(100% - 16px\)[^;]*calc\(100% - 11px\)/s)
})

test('삭제와 전체 초기화는 기본 confirm 대신 접근 가능한 공통 확인창과 보이는 danger 상태를 사용한다', () => {
  const dashboardSource = readSource('../../src/members/dongyeol/views/DashboardView.vue')
  const productSource = readSource('../../src/members/dongyeol/components/mock/ProductManager.vue')
  const postSource = readSource('../../src/members/dongyeol/components/mock/PostManager.vue')
  const dialogSource = readSource('../../src/members/dongyeol/components/common/ConfirmDialog.vue')
  const collectionStyles = readSource('../../src/members/dongyeol/assets/collection-manager.css')

  for (const source of [dashboardSource, productSource, postSource]) {
    assert.match(source, /<ConfirmDialog/)
    assert.doesNotMatch(source, /window\.confirm/)
  }

  assert.match(dialogSource, /useSharedWeatherTheme/)
  assert.match(dialogSource, /role="alertdialog"/)
  assert.match(dialogSource, /aria-modal="true"/)
  assert.match(dialogSource, /event\.key === 'Escape'/)
  assert.match(dialogSource, /previouslyFocusedElement/)
  assert.match(dashboardSource, /\.reset-button\s*\{[^}]*border:[^;]*#98524b[^;]*;[^}]*background:[^;]*#98524b[^;]*;[^}]*color:/s)
  assert.match(collectionStyles, /\.row-actions button:last-child\s*\{[^}]*border-color:[^;]*#a96861[^;]*;[^}]*background:[^;]*#a96861[^;]*;[^}]*color:/s)
})
