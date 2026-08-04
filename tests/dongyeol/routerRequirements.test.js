import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

import { memberLink } from '../../src/members/link.js'

const projectRoot = fileURLToPath(new URL('../../', import.meta.url))
const memberRoot = join(projectRoot, 'src/members/dongyeol')
const readProject = (relativePath) => readFileSync(join(projectRoot, relativePath), 'utf8')
const readMember = (relativePath) => readFileSync(join(memberRoot, relativePath), 'utf8')

const walkFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walkFiles(path) : [path]
  })

test('동열 앱은 팀 Router가 읽는 상대 child route와 memberLink를 제공한다', () => {
  const routesPath = join(memberRoot, 'routes.js')
  assert.equal(existsSync(routesPath), true)

  const routeSource = readFileSync(routesPath, 'utf8')
  const signatures = [
    [/path:\s*''[\s\S]*?name:\s*'home'/, 'home'],
    [/path:\s*'dashboard'[\s\S]*?name:\s*'dashboard'/, 'dashboard'],
    [/path:\s*'login'[\s\S]*?name:\s*'login'/, 'login'],
    [/path:\s*'about'[\s\S]*?name:\s*'about'/, 'about'],
    [/path:\s*'weather\/:cityId'[\s\S]*?name:\s*'detail'/, 'detail'],
    [/path:\s*'404'[\s\S]*?name:\s*'not-found'/, 'not-found'],
    [/path:\s*':pathMatch\(\.\*\)\*'[\s\S]*?name:\s*'missing'/, 'missing'],
  ]

  for (const [pattern, label] of signatures) {
    assert.match(routeSource, pattern, `${label} child route가 필요합니다.`)
  }

  assert.match(routeSource, /export const link = memberLink\('dongyeol'\)/)
  const link = memberLink('dongyeol')
  assert.deepEqual(link('detail', { cityId: 'city_01' }), {
    name: 'dongyeol.detail',
    params: { cityId: 'city_01' },
  })
})

test('대시보드 route만 팀 인증 guard 계약을 선언한다', () => {
  const routeSource = readMember('routes.js')
  const dashboardStart = routeSource.indexOf("path: 'dashboard'")
  const loginStart = routeSource.indexOf("path: 'login'")
  const dashboardBlock = routeSource.slice(dashboardStart, loginStart)

  assert.ok(dashboardStart >= 0 && loginStart > dashboardStart)
  assert.match(dashboardBlock, /requiresAuth:\s*true/)
  assert.match(dashboardBlock, /auth:\s*async\s*\(\)\s*=>/)
  assert.equal((routeSource.match(/requiresAuth:\s*true/g) ?? []).length, 1)
})

test('동열 shell은 팀 namespace 링크와 RouterView를 사용한다', () => {
  const shellSource = readMember('index.vue')

  assert.match(shellSource, /RouterLink/)
  assert.match(shellSource, /<nav[\s\S]*?aria-label="주요 메뉴"/)
  assert.match(shellSource, /<RouterView\s*\/>/)
  assert.match(shellSource, /link\('home'\)/)
  assert.match(shellSource, /link\('dashboard'\)/)
  assert.match(shellSource, /link\('login'\)/)
  assert.match(shellSource, /link\('about'\)/)
  assert.match(readMember('routes.js'), /scrollToTop:\s*true/)
  assert.match(readProject('src/router/index.js'), /to\.meta\.scrollToTop/)
  assert.match(readProject('src/data/members.js'), /slug:\s*'dongyeol'[\s\S]*bottomClearance:\s*'76px'/)
  assert.match(readProject('src/views/MemberView.vue'), /--member-bottom-clearance/)
  assert.doesNotMatch(shellSource, /name:\s*'(?:WeatherHome|WeatherDetail|WeatherAbout|Dashboard|Login)'/)
})

test('상세 이동과 돌아가기 링크도 memberLink namespace를 유지한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const detailSource = readMember('views/WeatherDetailView.vue')
  const aboutSource = readMember('views/WeatherAboutView.vue')
  const notFoundSource = readMember('views/NotFoundView.vue')

  assert.match(homeSource, /router\.push\(link\('detail',\s*\{\s*cityId\s*\}/)
  assert.match(detailSource, /link\('not-found'/)
  assert.match(detailSource, /link\('home'/)
  assert.match(aboutSource, /link\('home'/)
  assert.match(notFoundSource, /link\('home'/)

  for (const source of [homeSource, detailSource, aboutSource, notFoundSource]) {
    assert.doesNotMatch(source, /name:\s*'(?:WeatherHome|WeatherDetail|WeatherAbout|NotFound)'/)
  }
})

test('동열 모듈은 독립 Router나 팀 루트 App을 덮어쓰지 않는다', () => {
  const memberSources = walkFiles(memberRoot)
    .filter((file) => /\.(?:js|vue)$/.test(file))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  const rootRouterSource = readProject('src/router/index.js')
  const rootAppSource = readProject('src/App.vue')

  assert.doesNotMatch(memberSources, /createRouter|createWebHashHistory|createWebHistory/)
  assert.doesNotMatch(rootRouterSource, /members\/dongyeol/)
  assert.doesNotMatch(rootAppSource, /members\/dongyeol/)
  assert.equal(existsSync(join(memberRoot, 'main.js')), false)
  assert.equal(existsSync(join(memberRoot, 'router/index.js')), false)
})

test('팀원과 AI 도구가 동열 담당 영역을 임의로 수정하지 않도록 경계를 명시한다', () => {
  const frontendInstructions = readMember('AGENTS.md')
  const apiInstructions = readProject('mock-api/dongyeol/AGENTS.md')
  const memberReadme = readMember('README.md')

  assert.match(frontendInstructions, /Do not modify any file under `src\/members\/dongyeol\/\*\*`/)
  assert.match(apiInstructions, /Do not modify any file under `mock-api\/dongyeol\/\*\*`/)
  assert.match(memberReadme, /AI 코딩 도구/)
})

test('동열 모듈의 @ alias는 자기 폴더 또는 팀 member helper만 가리킨다', () => {
  const importPattern = /from\s+['"](@\/[^'"]+)['"]/g
  const invalidImports = []

  for (const file of walkFiles(memberRoot).filter((path) => /\.(?:js|vue)$/.test(path))) {
    const source = readFileSync(file, 'utf8')
    for (const [, importPath] of source.matchAll(importPattern)) {
      if (!importPath.startsWith('@/members/dongyeol/') && !/^@\/members\/link(?:\.js)?$/.test(importPath)) {
        invalidImports.push(`${file.slice(projectRoot.length)}: ${importPath}`)
      }
    }
  }

  assert.deepEqual(invalidImports, [])
})

test('Pinia store ID와 브라우저 저장소 key는 동열 namespace로 격리한다', () => {
  const authSource = readMember('stores/auth.js')
  const configSource = readMember('stores/configStore.js')
  const weatherSource = readMember('stores/homeWeatherStore.js')
  const httpSource = readMember('api/http.js')
  const currentLocationSource = readMember('composables/useCurrentLocationWeather.js')

  assert.match(authSource, /defineStore\('dongyeol-auth'/)
  assert.match(configSource, /defineStore\('dongyeol-config'/)
  assert.match(weatherSource, /defineStore\('dongyeol-home-weather'/)
  assert.match(httpSource, /dongyeol[^'"]*jwt[^'"]*access-token/)
  assert.match(authSource, /dongyeol[^'"]*jwt[^'"]*user/)
  assert.match(currentLocationSource, /dongyeol[^'"]*weather[^'"]*location[^'"]*prompt/)
})

test('모든 SFC style은 scoped이고 전역 CSS는 dongyeol root 아래에 제한한다', () => {
  const vueFiles = walkFiles(memberRoot).filter((path) => path.endsWith('.vue'))
  const unscopedStyles = []

  for (const file of vueFiles) {
    const source = readFileSync(file, 'utf8')
    for (const styleTag of source.matchAll(/<style\b[^>]*>/g)) {
      if (!/\bscoped\b/.test(styleTag[0])) unscopedStyles.push(file.slice(projectRoot.length))
    }
  }
  assert.deepEqual(unscopedStyles, [])

  const shellSource = readMember('index.vue')
  const cssSource = [readMember('assets/base.css'), readMember('assets/main.css')].join('\n').replaceAll(/\/\*[\s\S]*?\*\//g, '')

  assert.match(shellSource, /class="[^"]*\bdongyeol-app\b[^"]*"/)
  assert.doesNotMatch(cssSource, /^\s*(?::root|html|body|#app|\*)(?=\s*(?:,|\{))/gm)
  assert.match(cssSource, /:deep\(button\)\s*\{\s*color:\s*inherit;/)
  assert.doesNotMatch(cssSource, /\.dongyeol-app\s+:deep\(button\)\s*\{\s*color:\s*inherit;/)
})

test('화면별 동적 문서 제목은 공통 composable로 유지한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const detailSource = readMember('views/WeatherDetailView.vue')
  const titleSource = readMember('composables/useDocumentTitle.js')

  assert.match(homeSource, /useDocumentTitle/)
  assert.match(detailSource, /useDocumentTitle/)
  assert.match(titleSource, /document\.title = pageTitle \? `\$\{pageTitle\} \| Weather` : 'Weather'/)
})

test('이전 컴포넌트 과제의 BaseDashboardCard slot을 세계 날씨 서랍 검색과 목록에 유지한다', () => {
  const baseCardSource = readMember('components/exercise/BaseDashboardCard.vue')
  const drawerSource = readMember('components/weather/WorldWeatherDrawer.vue')
  const searchSource = readMember('components/exercise/SearchBar.vue')
  const weatherCardSource = readMember('components/exercise/WeatherCard.vue')

  assert.match(baseCardSource, /<slot\s*\/>/)
  assert.equal((drawerSource.match(/<BaseDashboardCard/g) ?? []).length, 2)
  assert.match(baseCardSource, /:deep\(\.dashboard-surface\)/)
  assert.match(baseCardSource, /dashboard-surface--search/)
  assert.match(baseCardSource, /dashboard-surface--weather/)
  assert.match(baseCardSource, /dashboard-surface--state/)
  assert.match(searchSource, /class="input-row dashboard-surface dashboard-surface--search"/)
  assert.match(weatherCardSource, /class="weather-card dashboard-surface dashboard-surface--weather"/)
  assert.equal((drawerSource.match(/class="drawer-state dashboard-surface dashboard-surface--state"/g) ?? []).length, 3)
})

test('메인과 도시 카드의 온도 아래에 테두리 없는 선형 상태 표시를 사용한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const cardSource = readMember('components/exercise/WeatherCard.vue')
  const conditionSource = readMember('components/weather/TemperatureConditionLabel.vue')

  assert.match(homeSource, /<TemperatureConditionLabel[^>]*:temperature="heroWeather\.temp"/)
  assert.match(cardSource, /<TemperatureConditionLabel[^>]*:temperature="cityItem\.temp"/)
  assert.match(conditionSource, /condition\.key === 'hot'/)
  assert.match(conditionSource, /\{\{ condition\.label \}\}/)
  assert.match(conditionSource, /\.temperature-condition\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.doesNotMatch(conditionSource, /🔥|❄️/)
})

test('세계 도시 선택 토스트와 지역·검색 필터를 조용한 피드백으로 제공한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const dashboardSource = readMember('composables/useHomeWeatherDashboard.js')
  const drawerSource = readMember('components/weather/WorldWeatherDrawer.vue')
  const mainCssSource = readMember('assets/main.css')

  assert.match(
    homeSource,
    /const showCitySelectionMessage = \(city\) => \{[\s\S]*message: formatKoreanSelectionMessage\(getCityDisplayName\(city\), city\.name\)[\s\S]*duration: 1500[\s\S]*customClass: 'dongyeol-weather-selection-message'/,
  )
  assert.match(dashboardSource, /selectedCityInfo\.value = formatKoreanSelectionMessage\(city\.displayName \|\| city\.name, city\.name\)/)
  assert.match(homeSource, /const handleSelect = async \(city\) => \{[\s\S]*if \(city\.id === selectedCityId\.value\) return[\s\S]*showCitySelectionMessage\(city\)/)
  assert.match(homeSource, /matchesSearchQuery\(\[item\.name, item\.displayName, item\.countryName, item\.countryCode\]/)
  assert.match(drawerSource, /class="region-filters"[\s\S]*aria-pressed="activeRegion === region\.id"/)
  assert.match(mainCssSource, /\.dongyeol-app :deep\(\.el-message\.dongyeol-weather-selection-message\)\s*\{[^}]*border-radius:\s*999px;[^}]*backdrop-filter:\s*blur\(20px\) saturate\(125%\);/s)
})

test('과제용 watch와 watchEffect 콘솔 기록은 개발 모드에서만 실행한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const devBlockStart = homeSource.indexOf('if (import.meta.env.DEV)')
  const devBlock = homeSource.slice(devBlockStart, homeSource.indexOf('</script>'))

  assert.match(homeSource, /import \{[^}]*watchEffect[^}]*\} from 'vue'/)
  assert.ok(devBlockStart >= 0)
  assert.match(devBlock, /watch\(selectedCityInfo,[\s\S]*console\.log\(`\[watch\] 선택 상태 변경:/)
  assert.match(devBlock, /watchEffect\(\(\) => \{[\s\S]*console\.log\(`\[watchEffect\] 검색어 변경: \$\{searchQuery\.value\}`\)/)
})

test('홈의 상세보기는 모달 대신 동적 상세 경로로 Programmatic Navigation한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const cardSource = readMember('components/exercise/WeatherCard.vue')
  const modalPath = join(memberRoot, 'components/weather/WeatherDetailModal.vue')

  assert.match(homeSource, /router\.push\(link\('detail',\s*\{\s*cityId\s*\}/)
  assert.match(cardSource, /emit\('click-detail',\s*props\.cityItem\.id\)/)
  assert.doesNotMatch(homeSource, /WeatherDetailModal|detailModal|aria-haspopup="dialog"/)
  assert.equal(existsSync(modalPath), false)
})

test('서비스 소개 화면은 공통 경로 링크로 메인 날씨에 돌아간다', () => {
  const aboutSource = readMember('views/WeatherAboutView.vue')
  const routeLinkSource = readMember('components/common/WeatherRouteLink.vue')

  assert.match(aboutSource, /<h1>/)
  assert.match(aboutSource, /<WeatherRouteLink[\s\S]*:to="link\('home'\)"/)
  assert.match(aboutSource, />날씨 보기<\/WeatherRouteLink>/)
  assert.match(routeLinkSource, /<RouterLink class="weather-route-link"/)
  assert.match(routeLinkSource, /<slot><\/slot>/)
})

test('Navigation Bar는 하단 고정형이며 활성 RouterLink 표시가 슬라이딩한다', () => {
  const appSource = readMember('index.vue')

  assert.match(appSource, /\.app-navigation\s*\{[^}]*position:\s*fixed;[^}]*bottom:\s*calc\(var\(--floating-nav-offset\) \+ env\(safe-area-inset-bottom\)\);/s)
  assert.match(appSource, /class="navigation-slider"/)
  assert.match(appSource, /transform:\s*translateX\(calc\(var\(--active-route-index\) \* 100%\)\);/)
  assert.match(appSource, /transition:[\s\S]*transform 360ms/)
  assert.match(appSource, /const isThemedScene = computed\(\(\) => route\.meta\.layout === 'weather-scene' \|\| route\.meta\.layout === 'lab-scene'\)/)
  assert.match(appSource, /'app-navigation--immersive-weather': isThemedScene/)
})

test('Navigation Bar는 모든 탭에서 온도 전환을 유지하고 모바일 Lab 화면을 전체 폭으로 표시한다', () => {
  const appSource = readMember('index.vue')

  assert.match(appSource, /<UnitToggler\s*\/>/)
  assert.doesNotMatch(appSource, /UnitToggler v-if|app-navigation--without-unit/)
  assert.match(appSource, /'page-container--scene': isThemedScene/)
  assert.match(appSource, /\.page-container:not\(\.page-container--scene\)/)
})

test('몰입형 날씨 Navigation Bar는 선택 도시 테마를 사용하고 세계 날씨 서랍과 맞닿아 연결한다', () => {
  const appSource = readMember('index.vue')
  const drawerSource = readMember('components/weather/WorldWeatherDrawer.vue')

  assert.match(appSource, /useSharedWeatherTheme/)
  assert.match(appSource, /const \{ weatherTheme: sharedWeatherTheme \} = useSharedWeatherTheme\(\)/)
  assert.match(appSource, /'app-navigation--immersive-weather': isThemedScene/)
  assert.match(appSource, /:style="weatherNavigationStyle"/)
  assert.match(appSource, /--floating-nav-height:\s*62px;/)
  assert.match(appSource, /--world-drawer-gap:\s*0px;/)
  assert.match(appSource, /--world-drawer-height:\s*min\(78svh, 820px\);/)
  assert.match(appSource, /\.app-navigation\s*\{[^}]*height:\s*var\(--floating-nav-height\);/s)
  assert.match(appSource, /\.app-navigation--immersive-weather\.is-world-drawer-open\s*\{[^}]*border-top:\s*0;[^}]*border-radius:\s*0 0 var\(--floating-nav-radius\) var\(--floating-nav-radius\);/s)
  assert.match(drawerSource, /\.world-weather-drawer\s*\{[^}]*border-bottom:\s*0;[^}]*border-radius:\s*27px 27px 0 0;/s)
  assert.match(appSource, /\.app-navigation--immersive-weather\s*\{[^}]*var\(--hero-text\)[^}]*background:\s*color-mix\(in srgb, var\(--hero-start\) 12%, transparent\);/s)
  assert.match(appSource, /backdrop-filter:\s*blur\(30px\) saturate\(120%\)/)
  assert.match(appSource, /\.navigation-slider::after\s*\{[^}]*width:\s*4px;[^}]*border-radius:\s*50%;/s)
  assert.match(appSource, /--drawer-handle-color:\s*var\(--hero-text\);/)
  assert.match(appSource, /\.app-navigation--immersive-weather \.world-drawer-handle,[\s\S]*color:\s*var\(--drawer-handle-color\);/)
  assert.doesNotMatch(appSource, /\.world-drawer-handle\s*\{[^}]*color:\s*#243139;/s)
  assert.doesNotMatch(appSource, /\.is-world-drawer-open \.world-drawer-handle\s*\{[^}]*color:\s*#243139;/s)
  assert.match(drawerSource, /background:\s*color-mix\(in srgb, var\(--hero-start\) 18%, transparent\);/)
  assert.match(drawerSource, /backdrop-filter:\s*blur\(34px\) saturate\(125%\)/)
  assert.doesNotMatch(drawerSource, /--hero-text:\s*#213238|rgba\(248, 251, 250, 0\.97\)/)
})

test('Hero는 배경 중앙에 직접 표시하고 메인 검색을 제거한 채 새로고침을 유지한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const drawerSource = readMember('components/weather/WorldWeatherDrawer.vue')
  const heroStart = homeSource.indexOf('ref="weatherHero"')
  const heroEnd = homeSource.indexOf('</section>', heroStart)
  const refreshButton = homeSource.indexOf('class="refresh-button"', heroStart)

  assert.ok(heroStart >= 0 && refreshButton > heroStart && refreshButton < heroEnd)
  assert.doesNotMatch(homeSource, /hero-search|list-jump-button|<SearchBar/)
  assert.match(drawerSource, /<SearchBar :current-query="currentQuery"/)
  assert.match(homeSource, /\.hero-face,\s*\.hero-placeholder\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s)
})

test('Hero 날씨 묶음은 검색 제거 후 화면 중앙에 배치한다', () => {
  const appSource = readMember('index.vue')
  const homeSource = readMember('views/WeatherHomeView.vue')
  const sceneSource = readMember('components/common/WeatherScene.vue')

  assert.match(homeSource, /class="hero-weather-lockup"/)
  assert.match(homeSource, /\.hero-stage\s*\{[^}]*min-height:\s*100svh;[^}]*place-items:\s*center;[^}]*padding:[^;]*var\(--floating-nav-height/s)
  assert.doesNotMatch(homeSource, /grid-template-rows:\s*minmax\(min-content, 1fr\) auto/)
  assert.match(appSource, /--world-drawer-height:/)
  assert.match(homeSource, /<WeatherScene class="weather-home-scene"/)
  assert.match(sceneSource, /\.weather-scene\s*\{[^}]*overflow:\s*clip;[^}]*linear-gradient\(158deg/s)
  assert.match(appSource, /background:\s*color-mix\(in srgb, var\(--hero-start\) 12%, transparent\);/)
})

test('도시 목록 제목과 개수를 숨기고 구체적인 날씨 설명을 한 번만 표시한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const cardSource = readMember('components/exercise/WeatherCard.vue')
  const currentSummarySource = readMember('components/weather/CurrentWeatherSummary.vue')

  assert.doesNotMatch(homeSource, /city-section-heading|>다른 도시</)
  assert.match(homeSource, /heroWeather\.status \|\| heroTheme\.label/)
  assert.match(cardSource, /cityItem\.status \|\| weatherTheme\.label/)
  assert.match(cardSource, /cityDisplayName = computed\(\(\) => props\.cityItem\.displayName \|\| props\.cityItem\.name\)/)
  assert.match(currentSummarySource, /weather\.status \|\| theme\.label/)
  assert.doesNotMatch(currentSummarySource, /weather\.displayName \|\| weather\.name/)
  assert.match(currentSummarySource, /class="current-condition"/)
  assert.doesNotMatch(currentSummarySource, /<span>\{\{ theme\.label \}\}<\/span>/)
})

test('로딩 중 회전 아이콘을 표시하고 Hero를 도시·국가·날씨 묶음 순서로 표시한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const detailSource = readMember('views/WeatherDetailView.vue')
  const spinnerSource = readMember('components/weather/LoadingSpinner.vue')
  const locationStart = homeSource.indexOf('class="hero-location"')
  const cityName = homeSource.indexOf('id="weather-hero-title"', locationStart)
  const countryName = homeSource.indexOf('class="hero-country-name"', locationStart)
  const locationAction = homeSource.indexOf('class="hero-location-action"', locationStart)
  const weatherLockup = homeSource.indexOf('class="hero-weather-lockup"', locationStart)
  const condition = homeSource.indexOf('class="hero-condition-summary"', weatherLockup)
  const temperature = homeSource.indexOf('class="hero-temperature"', weatherLockup)
  const weatherIcon = homeSource.indexOf('class="hero-icon"', weatherLockup)

  assert.match(homeSource, /<LoadingSpinner v-if="heroState === 'loading'"/)
  assert.match(detailSource, /<LoadingSpinner class="detail-loading-spinner"/)
  assert.match(spinnerSource, /@keyframes loading-spin/)
  assert.match(spinnerSource, /animation:\s*loading-spin 820ms linear infinite/)
  assert.ok(cityName >= 0 && countryName > cityName && locationAction > countryName && weatherLockup > locationAction)
  assert.ok(condition > weatherLockup && temperature > condition && weatherIcon > temperature)
  assert.match(homeSource, /font-size:\s*clamp\(58px, 10\.5vw, 112px\)/)
  assert.match(homeSource, /grid-template-columns:\s*minmax\(0, 1fr\) auto minmax\(0, 1fr\)/)
  assert.match(homeSource, /\.hero-condition-summary\s*\{[^}]*display:\s*grid;[^}]*justify-items:\s*end;/s)
  assert.match(homeSource, /\.hero-icon\s*\{[^}]*width:\s*clamp\(72px, 8vw, 92px\);[^}]*transform:\s*translateY\(6px\);/s)
  assert.match(homeSource, /\.hero-temperature span\s*\{[^}]*position:\s*absolute;[^}]*left:\s*100%;/s)
  assert.doesNotMatch(homeSource, /condition-separator/)
})

test('세계 도시 카드는 검색·지역 필터 결과를 세로 목록에 모두 표시한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const drawerSource = readMember('components/weather/WorldWeatherDrawer.vue')

  assert.match(homeSource, /activeRegion\.value === 'all' \|\| item\.region === activeRegion\.value/)
  assert.match(drawerSource, /v-for="item in items"/)
  assert.match(drawerSource, /\.world-weather-rail\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1fr\);[^}]*overflow-y:\s*auto;/s)
  assert.doesNotMatch(drawerSource, /scroll-snap-type:\s*x mandatory/)
  assert.doesNotMatch(homeSource, /INITIAL_VISIBLE_CITY_COUNT|otherWeatherList|weather-list/)
})

test('검색창은 기본 취소 아이콘을 숨기고 사용자 정의 지우기 버튼만 표시한다', () => {
  const searchSource = readMember('components/exercise/SearchBar.vue')

  assert.match(searchSource, /v-if="currentQuery"[^>]*aria-label="검색어 지우기"/)
  assert.match(searchSource, /input::-webkit-search-cancel-button/)
  assert.match(searchSource, /input::-ms-clear/)
})

test('내비게이션과 서랍은 폭 변수를 공유하고 손잡이는 겹치지 않은 채 열린 영역 맨 위로 이동한다', () => {
  const appSource = readMember('index.vue')
  const drawerSource = readMember('components/weather/WorldWeatherDrawer.vue')
  const dashboardSource = readMember('composables/useHomeWeatherDashboard.js')
  const storeSource = readMember('stores/homeWeatherStore.js')

  assert.match(storeSource, /const isWorldDrawerOpen = ref\(false\)/)
  assert.match(dashboardSource, /const \{ weatherList, selectedCityId, lastUpdated, isWorldDrawerOpen \} = storeToRefs\(homeWeatherStore\)/)
  assert.match(appSource, /class="world-drawer-handle"[\s\S]*aria-controls="world-weather-drawer"[\s\S]*:aria-expanded="isWorldDrawerOpen"/)
  assert.match(appSource, /--floating-nav-width:\s*min\(650px, calc\(100vw - 24px\)\)/)
  assert.match(appSource, /\.app-navigation\s*\{[^}]*width:\s*var\(--floating-nav-width\);/s)
  assert.match(appSource, /\.world-drawer-handle\s*\{[^}]*bottom:\s*calc\(100% - 1px\);[^}]*background:\s*transparent;/s)
  assert.match(appSource, /class="world-drawer-grabber"/)
  assert.match(appSource, /\.world-drawer-grabber\s*\{[^}]*width:\s*28px;[^}]*height:\s*2px;/s)
  assert.doesNotMatch(appSource, /drawer-chevron-small|drawer-chevron-large/)
  assert.match(appSource, /class="world-drawer-handle-label">세계 날씨<\/span>/)
  assert.match(
    appSource,
    /\.app-navigation\.is-world-drawer-open \.world-drawer-handle\s*\{[^}]*transform:\s*translate\(-50%, calc\(-1 \* \(var\(--world-drawer-height\) \+ var\(--world-drawer-gap\)\)\)\);/s,
  )
  assert.match(drawerSource, /id="world-weather-drawer" class="world-weather-drawer"/)
  assert.match(
    drawerSource,
    /\.world-weather-drawer\s*\{[^}]*position:\s*absolute;[^}]*bottom:\s*var\(--world-drawer-bottom\);[^}]*width:\s*var\(--floating-nav-width\);[^}]*height:\s*var\(--world-drawer-height\);/s,
  )
  assert.doesNotMatch(drawerSource, /WORLD WEATHER|세계의 지금|items\.length \}\}개 도시/)
})

test('검색과 지역 필터는 메인이 아니라 세계 날씨 서랍 안에만 배치한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const drawerSource = readMember('components/weather/WorldWeatherDrawer.vue')

  assert.doesNotMatch(homeSource, /<SearchBar|class="region-filters"/)
  assert.match(homeSource, /<WorldWeatherDrawer/)
  assert.match(drawerSource, /<SearchBar/)
  assert.match(drawerSource, /class="region-filters"/)
})

test('히스토리로 홈에 돌아오면 최근 날씨와 세계 서랍 상태를 cache에서 즉시 복원한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const dashboardSource = readMember('composables/useHomeWeatherDashboard.js')
  const locationSource = readMember('composables/useCurrentLocationWeather.js')
  const storeSource = readMember('stores/homeWeatherStore.js')

  assert.match(storeSource, /HOME_WEATHER_CACHE_TTL = 5 \* 60 \* 1000/)
  assert.match(storeSource, /const weatherList = ref\(\[\]\)/)
  assert.match(storeSource, /const selectedCityId = ref\(''\)/)
  assert.match(storeSource, /const isWorldDrawerOpen = ref\(false\)/)
  assert.match(storeSource, /const hasFreshWeather = \(now = Date\.now\(\)\)/)
  assert.match(homeSource, /useHomeWeatherDashboard\(getRouteSelectedCityId\)/)
  assert.match(homeSource, /startLocationExperience\(\)/)
  assert.match(locationSource, /weatherInitialization = Promise\.resolve\(initializeWeather\(\)\)/)
  assert.match(dashboardSource, /const restoreCachedWeather = \(\) => \{/)
  assert.match(dashboardSource, /if \(apiReady && homeWeatherStore\.hasFreshWeather\(\)\) \{[\s\S]*restoreCachedWeather\(\)[\s\S]*return/)
  assert.match(dashboardSource, /homeWeatherStore\.markWeatherLoaded\(\)/)
  assert.match(dashboardSource, /homeWeatherStore\.clearWeatherData\(\)/)
})

test('날씨별 배경 영상은 상태 코드를 세분화한 저용량 로컬 루프로 제공한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const videoSource = readMember('components/weather/WeatherBackgroundVideo.vue')
  const videoMappingSource = readMember('utils/weatherVideo.js')
  const videoFiles = ['clear.mp4', 'night.mp4', 'few-clouds.mp4', 'clouds.mp4', 'drizzle.mp4', 'rain.mp4', 'heavy-rain.mp4', 'thunderstorm.mp4', 'snow.mp4', 'fog.mp4']

  assert.match(homeSource, /<WeatherBackgroundVideo :weather="heroWeather"/)
  assert.match(videoSource, /'few-clouds':\s*'few-clouds\.mp4'/)
  assert.match(videoSource, /drizzle:\s*'drizzle\.mp4'/)
  assert.match(videoSource, /'heavy-rain':\s*'heavy-rain\.mp4'/)
  assert.match(videoSource, /thunderstorm:\s*'thunderstorm\.mp4'/)
  assert.match(videoSource, /fog:\s*'fog\.mp4'/)
  assert.match(videoMappingSource, /conditionId >= 200 && conditionId <= 232/)
  assert.match(videoMappingSource, /conditionId === 801 \|\| conditionId === 802/)
  assert.match(videoMappingSource, /conditionId === 803 \|\| conditionId === 804/)
  assert.match(videoSource, /autoplay[\s\S]*loop[\s\S]*muted[\s\S]*playsinline/)
  assert.match(videoSource, /prefers-reduced-motion: reduce/)
  assert.match(videoSource, /networkConnection\?\.saveData/)
  assert.match(videoSource, /BASE_URL\}dongyeol\/weather-videos\//)

  const totalVideoBytes = videoFiles.reduce((sum, fileName) => {
    const filePath = join(projectRoot, 'public/dongyeol/weather-videos', fileName)
    assert.equal(existsSync(filePath), true)
    return sum + statSync(filePath).size
  }, 0)

  assert.ok(totalVideoBytes < 6 * 1024 * 1024)
})

test('현재 위치 진입 흐름은 장식 없이 한 줄 제목을 쓰는 Hero 인라인 안내로 분리한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const locationSource = readMember('composables/useCurrentLocationWeather.js')
  const panelSource = readMember('components/weather/LocationPermissionPanel.vue')

  assert.match(homeSource, /useCurrentLocationWeather\(\{/)
  assert.match(homeSource, /<LocationPermissionPanel/)
  assert.doesNotMatch(homeSource, /navigator\.geolocation|getCurrentPosition/)
  assert.match(locationSource, /getGeolocationPermissionState/)
  assert.match(locationSource, /requestCurrentCoordinates/)
  assert.match(panelSource, /지금 있는 곳의 날씨부터 볼까요/)
  assert.match(panelSource, /class="location-permission-panel"/)
  assert.match(homeSource, /'is-location-prompt': locationPromptState/)
  assert.match(panelSource, /\.location-permission-panel h1\s*\{[^}]*white-space:\s*nowrap;/s)
  assert.match(panelSource, /\.location-primary\s*\{[^}]*background:\s*var\(--hero-text\);[^}]*color:\s*var\(--hero-start\);/s)
  assert.match(panelSource, /\.location-secondary\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--hero-text\) 7%, transparent\);[^}]*color:\s*var\(--hero-text\);/s)
  assert.doesNotMatch(panelSource, /WeatherConditionIcon|location-consent-icon/)
  assert.doesNotMatch(panelSource, /role="dialog"|aria-modal|location-consent-backdrop|position:\s*fixed/)
})

test('세계 날씨 서랍은 내부 스크롤을 사용하고 열린 동안 배경 스크롤을 잠근다', () => {
  const appSource = readMember('index.vue')
  const homeSource = readMember('views/WeatherHomeView.vue')
  const sceneSource = readMember('components/common/WeatherScene.vue')
  const drawerSource = readMember('components/weather/WorldWeatherDrawer.vue')

  assert.match(homeSource, /<WeatherScene class="weather-home-scene"/)
  assert.match(sceneSource, /\.weather-scene\s*\{[^}]*overflow:\s*clip;/s)
  assert.match(appSource, /\.app-shell\.is-world-drawer-open\s*\{[^}]*overflow:\s*hidden;/s)
  assert.doesNotMatch(drawerSource, /:global\(html\.world-drawer-open body\)/)
  assert.match(drawerSource, /\.world-weather-drawer\s*\{[^}]*overflow:\s*hidden;[^}]*overscroll-behavior:\s*contain;/s)
  assert.match(drawerSource, /\.world-weather-rail\s*\{[^}]*overflow-y:\s*auto;[^}]*overscroll-behavior-y:\s*contain;/s)
})

test('세계 날씨 서랍은 sticky 검색 뒤로 목록이 흐르며 하단을 투명 블러로 마감한다', () => {
  const drawerSource = readMember('components/weather/WorldWeatherDrawer.vue')

  assert.match(drawerSource, /\.world-weather-content\s*\{[^}]*flex:\s*1 1 0;/s)
  assert.match(drawerSource, /\.world-weather-rail\s*\{[^}]*scrollbar-width:\s*none;/s)
  assert.match(drawerSource, /\.world-weather-rail::-webkit-scrollbar\s*\{[^}]*display:\s*none;[^}]*width:\s*0;/s)
  assert.match(drawerSource, /class="world-drawer-toolbar" :class="\{ 'is-scrolled': isWeatherRailScrolled \}"/)
  assert.match(drawerSource, /\.world-drawer-toolbar\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;/s)
  assert.match(drawerSource, /\.world-drawer-toolbar::before\s*\{[^}]*backdrop-filter:\s*blur\(24px\) saturate\(120%\);[^}]*mask-image:/s)
  assert.match(drawerSource, /const isWeatherRailScrolled = ref\(false\)/)
  assert.match(drawerSource, /const hasMoreWeatherBelow = ref\(false\)/)
  assert.match(drawerSource, /rail\.scrollTop > 0/)
  assert.match(drawerSource, /rail\.scrollTop \+ rail\.clientHeight < rail\.scrollHeight - WEATHER_RAIL_EDGE_THRESHOLD/)
  assert.doesNotMatch(drawerSource, /world-weather-top-fade/)
  assert.match(drawerSource, /world-weather-bottom-fade/)
  assert.match(drawerSource, /\.world-weather-edge-fade\s*\{[^}]*pointer-events:\s*none;/s)
  assert.match(drawerSource, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.world-drawer-toolbar::before\s*\{\s*transition:\s*none;/)
})

test('세계 날씨 항목은 개별 유리 카드 대신 구분선 기반의 평면 목록으로 표시한다', () => {
  const drawerSource = readMember('components/weather/WorldWeatherDrawer.vue')
  const cardSource = readMember('components/exercise/WeatherCard.vue')

  assert.match(drawerSource, /\.world-weather-rail\s*\{[^}]*gap:\s*0;/s)
  assert.match(
    drawerSource,
    /\.world-weather-rail :deep\(\.weather-card\.dashboard-surface--weather\)\s*\{[^}]*border-bottom:\s*1px solid[^}]*border-radius:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s,
  )
  assert.match(drawerSource, /\.world-weather-rail :deep\(\.weather-card-hover-zone:last-child \.weather-card\)/)
  assert.match(drawerSource, /\.world-weather-rail :deep\(\.weather-card-hover-zone:hover \.weather-card:not\(\.is-promoting\)\)\s*\{[^}]*box-shadow:\s*none;[^}]*transform:\s*none;/s)
  assert.match(drawerSource, /\.world-weather-rail :deep\(\.temperature-condition--hot\)\s*\{[^}]*color:\s*#a64b2a;/s)
  assert.match(drawerSource, /\.world-weather-rail :deep\(\.temperature-condition--cool\)\s*\{[^}]*color:\s*#2b6f84;/s)
  assert.match(drawerSource, /\.world-weather-rail :deep\(\.temperature-condition > svg\),[\s\S]*color:\s*inherit;/)
  assert.match(cardSource, /\.detail-button\s*\{[^}]*width:\s*44px;/s)
  assert.match(cardSource, /\.card-select:focus-visible,\s*\.detail-button:focus-visible/)
})

test('리스트 카드와 Hero 액션을 경계가 옅은 compact·quiet 스타일로 표시한다', () => {
  const appSource = readMember('index.vue')
  const homeSource = readMember('views/WeatherHomeView.vue')
  const cardSource = readMember('components/exercise/WeatherCard.vue')

  assert.match(appSource, /--floating-nav-clearance:\s*calc\(/)
  assert.match(homeSource, /\.refresh-button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(homeSource, /\.hero-detail-button\s*\{[^}]*min-height:\s*44px;[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(cardSource, /\.weather-card\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 44px;/s)
  assert.match(cardSource, /\.card-select\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 38px auto;/s)
  assert.match(cardSource, /\.city-copy > span\s*\{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s)
  assert.match(cardSource, /getCountryFlagEmoji/)
  assert.match(cardSource, /class="country-flag" aria-hidden="true"/)
  assert.match(cardSource, /\.country-flag\s*\{[^}]*width:\s*18px;[^}]*height:\s*18px;[^}]*overflow:\s*hidden;[^}]*border-radius:\s*50%;/s)
  assert.match(cardSource, /\.country-flag-glyph\s*\{[^}]*transform:\s*scale\(1\.38\);/s)
  assert.match(cardSource, /class="city-meta">\{\{ cityItem\.name \}\} · 현지/)
  assert.doesNotMatch(cardSource, /\{\{ cityItem\.countryCode \}\} · 현지/)
  assert.match(cardSource, /\.weather-mark\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(cardSource, /transform:\s*translateY\(-4px\) scale\(1\.006\)/)
  assert.doesNotMatch(cardSource, /promote-cue|>상세 정보</)
})

test('Hero 지표는 세로선으로 구분하고 날씨 아이콘의 포인터 플로팅 모션은 제거한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const cardSource = readMember('components/exercise/WeatherCard.vue')
  const detailSource = readMember('views/WeatherDetailView.vue')
  const detailsListSource = readMember('components/weather/WeatherDetailsList.vue')
  const hourlySource = readMember('components/weather/HourlyForecastStrip.vue')
  const dailySource = readMember('components/weather/DailyForecastList.vue')

  assert.match(homeSource, /\.hero-metrics > div\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(homeSource, /\.hero-metrics > div \+ div::before/)
  assert.match(homeSource, /\.hero-metrics > div:nth-child\(even\)::before/)
  assert.match(cardSource, /\.weather-card-hover-zone:hover \.weather-card:not\(\.is-promoting\)/)
  assert.match(cardSource, /\.weather-card-hover-zone:hover \.weather-card:not\(\.is-promoting\) \.weather-mark/)
  assert.doesNotMatch(detailsListSource, /\.detail-row:hover \.detail-icon/)
  assert.match(cardSource, /prefers-reduced-motion:\s*no-preference/)
  assert.doesNotMatch(homeSource, /\.weather-hero:not\(\.is-promoting\):hover \.hero-icon/)
  assert.match(homeSource, /\.refresh-button svg\.is-spinning\s*\{[^}]*animation:\s*refresh-spin 900ms linear infinite;/s)
  assert.doesNotMatch(detailSource, /\.current-panel:hover :deep\(\.current-visual\)/)
  assert.doesNotMatch(hourlySource, /hover[\s\S]*\.forecast-icon|\.forecast-icon[\s\S]*transition:\s*transform/)
  assert.doesNotMatch(dailySource, /hover[\s\S]*\.forecast-icon|\.forecast-icon[\s\S]*transition:\s*transform/)
})

test('상세 화면은 compact 현재 요약과 단일 행 목록형 상세 패널을 사용한다', () => {
  const detailSource = readMember('views/WeatherDetailView.vue')
  const currentSummarySource = readMember('components/weather/CurrentWeatherSummary.vue')
  const detailsListSource = readMember('components/weather/WeatherDetailsList.vue')
  const forecastSectionSource = readMember('components/weather/ForecastListSection.vue')
  const routerSource = readMember('routes.js')
  const currentSummary = detailSource.indexOf('<CurrentWeatherSummary')
  const detailsSection = detailSource.indexOf('<WeatherDetailsList')
  const hourlyForecast = detailSource.indexOf('<HourlyForecastStrip')
  const dailyForecast = detailSource.indexOf('<DailyForecastList')

  assert.ok(currentSummary >= 0 && detailsSection > currentSummary && hourlyForecast > detailsSection && dailyForecast > hourlyForecast)
  assert.match(routerSource, /title:\s*'도시 날씨'[\s\S]*layout:\s*'weather-scene'/)
  assert.match(detailSource, /\.detail-topbar\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(detailSource, /\.back-button,\s*\.detail-refresh-button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(detailSource, /\.current-panel\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s)
  assert.match(detailSource, /<WeatherScene :theme="weatherTheme">/)
  assert.match(detailSource, /<WeatherBackgroundVideo :weather="cityData"/)
  assert.match(currentSummarySource, /\.current-content\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto 74px;/s)
  assert.match(currentSummarySource, /\.current-visual\s*\{[^}]*width:\s*74px;[^}]*height:\s*74px;/s)
  assert.match(currentSummarySource, /<span>관측 \{\{ observedAt \}\}<\/span>/)
  assert.match(detailsListSource, /<strong>\{\{ sunriseTime \}\}<\/strong>/)
  assert.match(detailsListSource, /<strong>\{\{ sunsetTime \}\}<\/strong>/)
  assert.equal((detailsListSource.match(/class="detail-row"/g) ?? []).length, 6)
  assert.match(detailsListSource, /<dl class="details-list">/)
  assert.match(detailSource, /<h2 id="forecast-overview-title" class="sr-only">날씨 예보<\/h2>/)
  assert.match(
    detailsListSource,
    /\.details-list\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\) minmax\(190px, 1\.45fr\);[^}]*border-top:\s*1px solid color-mix[^}]*border-bottom:\s*1px solid color-mix/s,
  )
  assert.match(detailsListSource, /\.detail-row \+ \.detail-row\s*\{[^}]*border-left:/s)
  assert.match(detailsListSource, /@media \(max-width: 840px\)[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/s)
  assert.match(detailsListSource, /@media \(max-width: 560px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s)
  assert.match(currentSummarySource, /@media \(max-width: 560px\)[\s\S]*\.current-content\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto 56px;/s)
  assert.match(forecastSectionSource, /class="forecast-list-heading"/)
  assert.match(forecastSectionSource, /class="forecast-list-surface"/)
  assert.match(forecastSectionSource, /border-top:\s*1px solid color-mix/)
  assert.doesNotMatch(detailsListSource, /detail-row--solar|backdrop-filter|border-radius:\s*24px/)
  assert.doesNotMatch(detailSource, /<MetricCard|class="metric-grid"/)
  assert.equal(existsSync(join(memberRoot, 'components/weather/MetricCard.vue')), false)

  for (const label of ['체감 온도', '습도', '풍속', '기압', '시정거리', '일출 · 일몰']) {
    assert.match(detailsListSource, new RegExp(label))
  }
})

test('상세 화면은 현재 날씨와 분리된 3시간·5일 예보 상태와 전용 목록을 제공한다', () => {
  const detailSource = readMember('views/WeatherDetailView.vue')
  const hourlySource = readMember('components/weather/HourlyForecastStrip.vue')
  const dailySource = readMember('components/weather/DailyForecastList.vue')
  const detailWeatherSource = readMember('composables/useCityWeatherDetail.js')
  const serviceSource = readMember('services/weatherApi.js')

  assert.match(serviceSource, /data\/2\.5\/forecast/)
  assert.match(serviceSource, /export const mapForecastResponse/)
  assert.match(serviceSource, /hourly:\s*forecastEntries\.slice\(0, FORECAST_ITEM_LIMIT\)/)
  assert.match(serviceSource, /daily:\s*timezoneOffset === null \? \[\] : mapDailyForecast/)
  assert.match(detailSource, /useCityWeatherDetail\(cityId, redirectUnknownCity\)/)
  assert.match(detailWeatherSource, /const isForecastLoading = ref/)
  assert.match(detailWeatherSource, /const forecastErrorMessage = ref/)
  assert.match(detailWeatherSource, /fetchCityWeather\(city\)/)
  assert.match(detailWeatherSource, /fetchCityForecast\(city\)/)
  assert.match(detailWeatherSource, /Promise\.allSettled\(\[currentWeatherRequest, forecastRequest\]\)/)
  assert.match(detailSource, /<section v-if="cityConfig && apiReady" class="forecast-section"/)
  assert.doesNotMatch(detailSource, /<section v-if="cityData" class="forecast-section"/)
  assert.match(detailSource, /<HourlyForecastStrip[^>]*:items="forecastData\.hourly"/)
  assert.match(detailSource, /<DailyForecastList[^>]*:items="forecastData\.daily"/)
  assert.match(hourlySource, /시간대별 날씨/)
  assert.match(hourlySource, /role="region"[^>]*tabindex="0"/)
  assert.match(dailySource, /5일 예보/)
  assert.match(dailySource, /<ol class="daily-list">/)
})

test('상세 화면 우상단에서 현재 날씨와 예보를 함께 새로고침한다', () => {
  const detailSource = readMember('views/WeatherDetailView.vue')
  const detailWeatherSource = readMember('composables/useCityWeatherDetail.js')
  const titleStart = detailSource.indexOf('class="topbar-title"')
  const refreshButton = detailSource.indexOf('class="detail-refresh-button"')

  assert.ok(titleStart >= 0 && refreshButton > titleStart)
  assert.match(detailSource, /const isRefreshing = computed\(\(\) => isLoading\.value \|\| isForecastLoading\.value\)/)
  assert.match(detailSource, /class="detail-refresh-button"[\s\S]*?:disabled="!cityConfig \|\| !apiReady \|\| isRefreshing"[\s\S]*?@click="refreshDetail"/)
  assert.match(detailSource, /\.detail-topbar\s*\{[^}]*grid-template-columns:\s*auto minmax\(0, 1fr\) auto;/s)
  assert.match(detailSource, /\.detail-refresh-button svg\.is-spinning\s*\{[^}]*animation:\s*detail-refresh-spin 900ms linear infinite;/s)
  assert.match(detailWeatherSource, /const refreshDetail = \(\) => loadDetail\(cityConfig\.value\)/)
  assert.match(detailWeatherSource, /isLoading,\s*refreshDetail,\s*weatherTheme/)
})

test('소개 화면은 실제 도시 수와 핵심 예보 범위만 제품형 목록으로 안내한다', () => {
  const routerSource = readMember('routes.js')
  const aboutSource = readMember('views/WeatherAboutView.vue')
  const sceneSource = readMember('components/common/WeatherScene.vue')
  const routeLinkSource = readMember('components/common/WeatherRouteLink.vue')

  assert.match(routerSource, /title:\s*'서비스 소개'[\s\S]*layout:\s*'weather-scene'/)
  assert.match(aboutSource, /useSharedWeatherTheme\(\)/)
  assert.match(aboutSource, /<WeatherScene :theme="aboutTheme">/)
  assert.match(sceneSource, /linear-gradient\(158deg, var\(--hero-start\)/)
  assert.match(aboutSource, /<ul class="feature-list">[\s\S]*v-for="feature in forecastFeatures"[\s\S]*class="feature-row"/)
  assert.match(aboutSource, /\.feature-list\s*\{[^}]*border-top:\s*1px solid color-mix[^}]*border-bottom:\s*1px solid color-mix/s)
  assert.match(aboutSource, /\.feature-row\s*\{[^}]*min-height:\s*76px;/s)
  assert.match(aboutSource, /\.feature-row \+ \.feature-row\s*\{[^}]*border-top:/s)
  assert.doesNotMatch(aboutSource, /feature-grid|feature-card|features\.slice/)
  assert.match(aboutSource, /`\$\{CITY_CONFIG\.length\}개`/)
  assert.match(aboutSource, /title:\s*'현재 관측'/)
  assert.match(aboutSource, /title:\s*'시간별 예보'/)
  assert.match(aboutSource, /title:\s*'5일 예보'/)
  assert.match(aboutSource, /OpenWeather/)
  assert.doesNotMatch(aboutSource, /technologyStack|Vue Router|상태 보존과 경로 이동|서로 다른 요청 상태/)
  assert.match(aboutSource, /\.service-facts\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/s)
  assert.match(aboutSource, /<WeatherRouteLink class="home-link"[\s\S]*:to="link\('home'\)"/)
  assert.match(routeLinkSource, /min-height:\s*44px/)
})

test('404 화면도 공통 날씨 장면과 경로 링크를 사용한다', () => {
  const notFoundSource = readMember('views/NotFoundView.vue')
  const routerSource = readMember('routes.js')

  assert.match(notFoundSource, /<WeatherScene>/)
  assert.match(notFoundSource, /class="not-found-shell"/)
  assert.match(notFoundSource, /<WeatherRouteLink[\s\S]*:to="link\('home'\)"/)
  assert.doesNotMatch(notFoundSource, /useRoute|useRouter|route\.query|<el-button/)
  assert.match(routerSource, /name:\s*'not-found'[\s\S]*layout:\s*'weather-scene'/)
  assert.match(routerSource, /name:\s*'missing'[\s\S]*layout:\s*'weather-scene'/)
})
