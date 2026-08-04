import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
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

  assert.match(authSource, /defineStore\('dongyeol-auth'/)
  assert.match(configSource, /defineStore\('dongyeol-config'/)
  assert.match(weatherSource, /defineStore\('dongyeol-home-weather'/)
  assert.match(httpSource, /dongyeol[^'"]*jwt[^'"]*access-token/)
  assert.match(authSource, /dongyeol[^'"]*jwt[^'"]*user/)
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
  const cssSource = [readMember('assets/base.css'), readMember('assets/main.css')]
    .join('\n')
    .replaceAll(/\/\*[\s\S]*?\*\//g, '')

  assert.match(shellSource, /class="[^"]*\bdongyeol-app\b[^"]*"/)
  assert.doesNotMatch(cssSource, /^\s*(?::root|html|body|#app|\*)(?=\s*(?:,|\{))/gm)
})

test('화면별 동적 문서 제목은 공통 composable로 유지한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const detailSource = readMember('views/WeatherDetailView.vue')
  const titleSource = readMember('composables/useDocumentTitle.js')

  assert.match(homeSource, /useDocumentTitle/)
  assert.match(detailSource, /useDocumentTitle/)
  assert.match(titleSource, /document\.title = pageTitle \? `\$\{pageTitle\} \| Weather` : 'Weather'/)
})

test('검색·목록·상세 예보와 cache 복원 기능을 보존한다', () => {
  const homeSource = readMember('views/WeatherHomeView.vue')
  const searchSource = readMember('components/exercise/SearchBar.vue')
  const detailSource = readMember('views/WeatherDetailView.vue')
  const dashboardSource = readMember('composables/useHomeWeatherDashboard.js')
  const storeSource = readMember('stores/homeWeatherStore.js')

  assert.match(homeSource, /matchesSearchQuery\(item\.name, query\)/)
  assert.match(homeSource, /v-for="item in otherWeatherList"/)
  assert.match(searchSource, /aria-label="검색어 지우기"/)
  assert.match(detailSource, /<HourlyForecastStrip/)
  assert.match(detailSource, /<DailyForecastList/)
  assert.match(storeSource, /HOME_WEATHER_CACHE_TTL = 5 \* 60 \* 1000/)
  assert.match(dashboardSource, /homeWeatherStore\.hasFreshWeather\(\)/)
  assert.match(dashboardSource, /homeWeatherStore\.markWeatherLoaded\(\)/)
})

test('날씨 상세 화면은 현재 관측과 3시간·5일 예보를 각각 제공한다', () => {
  const detailSource = readMember('views/WeatherDetailView.vue')
  const hourlySource = readMember('components/weather/HourlyForecastStrip.vue')
  const dailySource = readMember('components/weather/DailyForecastList.vue')
  const detailWeatherSource = readMember('composables/useCityWeatherDetail.js')
  const weatherServiceSource = readMember('services/weatherApi.js')

  assert.match(weatherServiceSource, /data\/2\.5\/forecast/)
  assert.match(weatherServiceSource, /export const mapForecastResponse/)
  assert.match(detailWeatherSource, /Promise\.allSettled\(\[currentWeatherRequest, forecastRequest\]\)/)
  assert.match(detailSource, /:items="forecastData\.hourly"/)
  assert.match(detailSource, /:items="forecastData\.daily"/)
  assert.match(hourlySource, /시간대별 날씨/)
  assert.match(dailySource, /5일 예보/)
})
