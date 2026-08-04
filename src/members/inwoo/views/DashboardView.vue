<script setup>
/**
 * 대시보드 — /m/inwoo
 * ------------------------------------------------------------------
 * 전국 도시의 실시간 날씨를 한 화면에서 본다. 모든 반응형 데이터는
 * 이 파일이 들고, 아래 부품들은 props 로 받아 그리고 emits 로 되돌려 준다.
 *
 *   DashboardView.vue            ← 모든 반응형 데이터 보유 (이 파일)
 *   ├── BaseDashboardCard.vue      공통 껍데기 + <slot>
 *   ├── SearchBar.vue              props: current-query / emits: update-query
 *   ├── RegionTabs.vue             props: regions·current / emits: select-region
 *   ├── WeatherCard.vue            props: city-item·favorite·here / emits: 3종
 *   │   └── WeatherIcon.vue        props: status
 *   └── WeatherByStatus.vue        같은 목록을 날씨 기준으로 묶어 보여준다
 *
 * 날씨는 Open-Meteo 에서 받아온다 (data/weatherApi.js).
 * 배경은 껍데기(index.vue)가 그리므로, 여기서는 어떤 날씨를 보여 줄지만
 * 공유 상태(data/backdropState.js)에 적어 둔다.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
// 1. 컴포넌트 파일명 국룰 표기법(PascalCase) 매칭 수입
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import SearchBar from '../components/SearchBar.vue'
import RegionTabs from '../components/RegionTabs.vue'
import WeatherCard from '../components/WeatherCard.vue'
import WeatherByStatus from '../components/WeatherByStatus.vue'
import UiIcon from '../components/UiIcon.vue'
import { fetchWeather, nearestCity, REGIONS, DEMO_ROWS } from '../data/weatherApi'
import { backdropStatus } from '../data/backdropState'
import { link } from '../routes'

const router = useRouter()

const FAVORITES_KEY = 'inwoo-weather-favorites'

// ── 서버에서 받아 오는 데이터 ──
const weatherList = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const isStale = ref(false)
const updatedAt = ref('')

// ── 사용자가 만지는 상태 ──
const searchQuery = ref('')
const selectedRegion = ref('전체')
const viewMode = ref('region') // 'region' | 'status'
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')
const selectedCityId = ref('')

// ── 목록은 5곳씩 끊어서 보여 준다 ──
const PAGE_SIZE = 5
const page = ref(1)

/** 선택을 풀면 배경이 다시 현재 위치를 따른다 */
const clearSelection = () => {
  selectedCityId.value = ''
  selectedCityInfo.value = '카드를 클릭하거나 검색해 보세요.'
}

/** 카드를 고르면 상태 바 문구도 부모가 만든다 (자식은 id만 올려 준다) */
const selectCity = (cityId) => {
  // 같은 카드를 다시 누르면 선택을 푼다 (배경은 현재 위치로 돌아간다)
  if (selectedCityId.value === cityId) {
    clearSelection()
    return
  }
  selectedCityId.value = cityId
  const city = weatherList.value.find((item) => item.id === cityId)
  selectedCityInfo.value = city
    ? `${city.name} · ${city.status} · ${city.temp}°C · 습도 ${city.humidity}%`
    : '카드를 클릭하거나 검색해 보세요.'
}

// ── 즐겨찾기 — 새로고침해도 남도록 localStorage에 담는다 ──
const favorites = ref(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]'))

const toggleFavorite = (cityId) => {
  favorites.value = favorites.value.includes(cityId)
    ? favorites.value.filter((id) => id !== cityId)
    : [...favorites.value, cityId]
}

watch(favorites, (list) => localStorage.setItem(FAVORITES_KEY, JSON.stringify(list)), {
  deep: true,
})

// ── 현재 위치 ──
const hereId = ref('')
const locationState = ref('idle') // idle | asking | done | denied

/** 브라우저 위치 → 가장 가까운 도시 하나를 맨 앞에 올린다 */
const findMyLocation = () => {
  if (!navigator.geolocation) {
    locationState.value = 'denied'
    return
  }
  locationState.value = 'asking'
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const near = nearestCity(coords.latitude, coords.longitude)
      hereId.value = near?.id ?? ''
      locationState.value = 'done'
    },
    () => {
      // 거부하거나 실패해도 화면은 그대로 동작한다
      locationState.value = 'denied'
    },
    { timeout: 8000 },
  )
}

/** 실제 API 호출 — 실패해도 화면이 죽지 않도록 에러를 상태로 받는다 */
const load = async (force = false) => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { rows, at, stale } = await fetchWeather(undefined, force)
    // 데모는 배경 확인용이라 맨 뒤에 붙인다
    weatherList.value = [...rows, ...DEMO_ROWS]
    isStale.value = stale

    // 저장해 둔 값을 먼저 보여 줬다면, 뒤에서 조용히 새 값을 받아 바꿔 끼운다
    if (stale) setTimeout(() => load(true), 0)
    lastLoadedAt = at
    updatedAt.value = new Date(at).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (error) {
    errorMessage.value = '날씨를 불러오지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.'
    isStale.value = false
    console.error('[weather] 불러오기 실패', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * 10분마다 조용히 새로 받는다.
 * 다만 보고 있지 않은 탭에서까지 부르면 서버에 실례이므로,
 * 화면이 보일 때만 돌리고 다시 돌아왔을 때 한 번 맞춰 준다.
 */
const REFRESH_MS = 10 * 60 * 1000
let timer = null
let lastLoadedAt = 0

const startAutoRefresh = () => {
  stopAutoRefresh()
  timer = setInterval(() => {
    if (document.visibilityState === 'visible') load(true)
  }, REFRESH_MS)
}

const stopAutoRefresh = () => {
  if (timer) clearInterval(timer)
  timer = null
}

/** 탭으로 돌아왔는데 값이 오래됐으면 바로 맞춘다 */
const onVisible = () => {
  if (document.visibilityState !== 'visible') return
  if (Date.now() - lastLoadedAt > REFRESH_MS) load(true)
}

onBeforeUnmount(() => {
  stopAutoRefresh()
  document.removeEventListener('visibilitychange', onVisible)
})

onMounted(async () => {
  load()
  startAutoRefresh()
  document.addEventListener('visibilitychange', onVisible)
  // 이미 허용해 둔 사용자에게만 조용히 위치를 쓴다. 처음이면 버튼을 누를 때 묻는다.
  const status = await navigator.permissions?.query({ name: 'geolocation' }).catch(() => null)
  if (status?.state === 'granted') findMyLocation()
})

// 기존 핵심 비즈니스 로직(computed, watch)의 소유권은 안전하게 부모 콘텍스트가 격리 유지
const matched = computed(() => {
  const query = searchQuery.value.trim()
  return weatherList.value.filter((item) => !query || item.name.includes(query))
})

/** 지역 필터까지 적용하고, 현재 위치 → 즐겨찾기 → 나머지 순으로 세운다 */
const filteredWeatherList = computed(() => {
  const list = matched.value.filter(
    (item) => selectedRegion.value === '전체' || item.group === selectedRegion.value,
  )
  const rank = (item) => (item.id === hereId.value ? 0 : favorites.value.includes(item.id) ? 1 : 2)
  return [...list].sort((a, b) => rank(a) - rank(b))
})

/** 탭에 붙일 지역별 개수 — 검색어까지 반영해 실제로 보이는 수를 센다 */
const regionCounts = computed(() =>
  matched.value.reduce(
    (acc, item) => {
      acc[item.group] = (acc[item.group] ?? 0) + 1
      return acc
    },
    { 전체: matched.value.length },
  ),
)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredWeatherList.value.length / PAGE_SIZE)),
)

/** 지금 페이지에 보일 5곳 */
const pagedList = computed(() =>
  filteredWeatherList.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)

/** 검색어·지역·보기를 바꾸면 1페이지로 되돌린다 */
watch([searchQuery, selectedRegion, viewMode], () => (page.value = 1))

/** 목록이 줄어 지금 페이지가 사라지면 마지막 페이지로 당긴다 */
watch(totalPages, (total) => {
  if (page.value > total) page.value = total
})

/**
 * 배경이 따라갈 날씨.
 *   ① 사용자가 고른 도시 → ② 현재 위치 도시 → ③ 둘 다 없으면 기본 배경
 */
/** 지금 고른 도시 (없으면 null) */
const selectedCity = computed(
  () => weatherList.value.find((item) => item.id === selectedCityId.value) ?? null,
)

const backdropCity = computed(
  () =>
    weatherList.value.find((item) => item.id === selectedCityId.value) ??
    weatherList.value.find((item) => item.id === hereId.value) ??
    null,
)

/** 껍데기가 그리는 배경에 "지금 어떤 날씨를 보여 줄지"만 적어 둔다 */
watch(backdropCity, (city) => (backdropStatus.value = city?.status ?? ''), { immediate: true })

const favoriteCount = computed(
  () => matched.value.filter((item) => favorites.value.includes(item.id)).length,
)

watch(selectedCityInfo, (newInfo) => {
  console.log(`👁️‍🗨️ [watch 감지] 상태 바 문구가 업데이트되었습니다 -> "${newInfo}"`)
})

/**
 * 상세보기 — 시간별 예보는 별도 주소를 가진 화면이다.
 * 카드 안에서 펼치는 대신 주소를 옮기면, 그 도시 화면만 링크로 보낼 수 있다.
 */
const showDetail = (cityName) => {
  const city = weatherList.value.find((item) => item.name === cityName)
  if (!city) return
  router.push(link('detail', { cityId: city.id }, { from: 'dashboard' }))
}
</script>

<template>
  <div class="dashboard-wrapper">
    <BaseDashboardCard>
      <SearchBar :current-query="searchQuery" @update-query="(val) => (searchQuery = val)" />
    </BaseDashboardCard>

    <BaseDashboardCard>
      <!-- 보기 방식 — 같은 데이터를 지역 기준으로 볼지, 날씨 기준으로 볼지 -->
      <div class="view-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="viewMode === 'region'"
          :class="{ active: viewMode === 'region' }"
          @click="viewMode = 'region'"
        >
          <UiIcon name="city" :size="16" /> 지역별 날씨 현황
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="viewMode === 'status'"
          :class="{ active: viewMode === 'status' }"
          @click="viewMode = 'status'"
        >
          <UiIcon name="droplet" :size="16" /> 날씨별 지역 현황
        </button>
      </div>

      <div class="tool-row">
        <p class="summary">
          <b>{{ matched.length }}</b>곳
          <span v-if="favoriteCount" class="fav-count">
            <UiIcon name="star" :size="12" :filled="true" /> {{ favoriteCount }}
          </span>
        </p>

        <button
          class="tool"
          type="button"
          :disabled="locationState === 'asking'"
          @click="findMyLocation"
        >
          <UiIcon name="location" :size="14" />
          {{ locationState === 'asking' ? '찾는 중…' : '내 위치' }}
        </button>
        <button class="tool" type="button" :disabled="isLoading" @click="load(true)">
          {{ isLoading ? '불러오는 중…' : '새로고침' }}
        </button>
      </div>

      <p v-if="isStale" class="hint stale">
        지금 서버 응답을 받지 못해 <b>{{ updatedAt }}에 받아 둔 값</b>을 보여 주고 있습니다.
        잠시 뒤 새로고침을 눌러 보세요.
      </p>

      <p v-if="locationState === 'denied'" class="hint">
        위치 권한이 없어 현재 위치를 표시하지 못했습니다. 나머지 기능은 그대로 쓸 수 있습니다.
      </p>

      <!-- 지역 탭은 지역별 보기에서만 의미가 있다 -->
      <RegionTabs
        v-if="viewMode === 'region'"
        :regions="[...REGIONS, '데모']"
        :current="selectedRegion"
        :counts="regionCounts"
        @select-region="(region) => (selectedRegion = region)"
      />

      <!-- 불러오기 실패 -->
      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
        <button type="button" @click="load(true)">다시 시도</button>
      </p>

      <!-- 첫 로딩 — 빈 화면 대신 카드 모양을 먼저 깔아 둔다 -->
      <div v-else-if="isLoading && !weatherList.length" class="skeleton">
        <div v-for="n in 5" :key="n" class="skeleton-card">
          <span class="sk-tile" />
          <span class="sk-lines">
            <i class="sk-line wide" />
            <i class="sk-line" />
          </span>
          <span class="sk-metrics">
            <i class="sk-pill" />
            <i class="sk-pill" />
          </span>
        </div>
      </div>

      <!-- ① 지역별 -->
      <template v-else-if="viewMode === 'region'">
        <!-- 상세보기를 누르면 그 도시의 주소(/m/inwoo/weather/:cityId)로 옮겨 간다 -->
        <WeatherCard
          v-for="item in pagedList"
          :key="item.id"
          :city-item="item"
          :favorite="favorites.includes(item.id)"
          :here="item.id === hereId"
          :selected="item.id === selectedCityId"
          @select-card="selectCity"
          @click-detail="showDetail"
          @toggle-favorite="toggleFavorite"
        />

        <p v-if="filteredWeatherList.length === 0" class="empty-message">
          <UiIcon name="empty" :size="22" />
          검색 결과와 일치하는 도시가 없습니다.
        </p>

        <!-- 5곳이 넘으면 페이지로 나눠 본다 -->
        <nav v-if="totalPages > 1" class="pager" aria-label="목록 페이지">
          <button type="button" :disabled="page === 1" aria-label="이전" @click="page--">‹</button>
          <button
            v-for="n in totalPages"
            :key="n"
            type="button"
            :class="{ active: n === page }"
            :aria-current="n === page ? 'page' : undefined"
            @click="page = n"
          >
            {{ n }}
          </button>
          <button
            type="button"
            :disabled="page === totalPages"
            aria-label="다음"
            @click="page++"
          >
            ›
          </button>
        </nav>
      </template>

      <!-- ② 날씨별 -->
      <template v-else>
        <!-- 고른 곳은 맨 위에 카드로 올려 바로 상세로 갈 수 있게 한다 -->
        <WeatherCard
          v-if="selectedCity"
          :city-item="selectedCity"
          :favorite="favorites.includes(selectedCity.id)"
          :here="selectedCity.id === hereId"
          :selected="true"
          @select-card="selectCity"
          @click-detail="showDetail"
          @toggle-favorite="toggleFavorite"
        />

        <WeatherByStatus
          :list="matched"
          :favorites="favorites"
          :here-id="hereId"
          :selected-id="selectedCityId"
          @select-card="selectCity"
          @toggle-favorite="toggleFavorite"
        />
      </template>
    </BaseDashboardCard>

    <div class="status-bar">
      <span>{{ selectedCityInfo }}</span>
      <small v-if="updatedAt" class="stamp">{{ updatedAt }} 기준 · Open-Meteo</small>
    </div>
  </div>
</template>

<style scoped>
/* 판의 너비는 껍데기(index.vue)가 잡는다 — 홈 · 소개 · 상세가 전부 같은 폭이다 */
.dashboard-wrapper {
  display: grid;
  gap: 12px;
}

/* ── 보기 방식 탭 ── */
.view-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 14px;
  padding: 4px;
  border-radius: 999px;
  background: var(--paper);
}

.view-tabs button {
  display: inline-flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border: 0;
  border-radius: 999px;
  color: var(--muted);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.view-tabs button:hover {
  color: var(--accent);
}

.view-tabs button.active {
  color: var(--accent);
  background: var(--surface);
  box-shadow: 0 1px 4px rgb(15 23 42 / 8%);
}

/* ── 도구 줄 ── */
.tool-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
  margin-bottom: 12px;
}

.summary {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0 auto 0 2px;
  color: var(--muted);
  font-size: 12.5px;
}

.summary b {
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 14px;
}

.fav-count {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  color: #b8862a;
  font-family: var(--font-mono);
  font-weight: 700;
}

.tool {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  background: var(--surface);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  transition:
    border-color 0.15s ease,
    color 0.15s ease;
}

.tool:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.tool:disabled {
  cursor: progress;
  opacity: 0.6;
}

.hint {
  margin: 0 0 12px;
  padding: 9px 13px;
  border-radius: 9px;
  background: var(--paper);
  color: var(--faint);
  font-size: 12px;
}

.hint.stale {
  border: 1px solid var(--signal);
  background: var(--signal-tint);
  color: var(--signal);
}

.empty-message {
  display: flex;
  gap: 9px;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: var(--faint);
  font-size: 13.5px;
}

.error-message {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 24px 16px;
  border: 1px dashed var(--signal);
  border-radius: 12px;
  color: var(--signal);
  font-size: 13px;
  text-align: center;
}

.error-message button {
  padding: 5px 12px;
  border: 1px solid var(--signal);
  border-radius: 999px;
  color: var(--signal);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}

/* ── 첫 로딩 스켈레톤 ── */
.skeleton {
  display: grid;
  gap: 9px;
}

.skeleton-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
}

.sk-tile {
  width: 50px;
  height: 50px;
  border-radius: 16px;
}

.sk-lines {
  display: grid;
  gap: 7px;
}

.sk-line {
  width: 90px;
  height: 11px;
  border-radius: 999px;
}

.sk-line.wide {
  width: 130px;
  height: 14px;
}

.sk-metrics {
  display: grid;
  gap: 5px;
}

.sk-pill {
  width: 120px;
  height: 22px;
  border-radius: 999px;
}

/* 은은하게 흐르는 빛 — 멈춰 있지 않다는 신호 */
.sk-tile,
.sk-line,
.sk-pill {
  background: linear-gradient(
    90deg,
    var(--paper) 25%,
    color-mix(in srgb, var(--line) 60%, transparent) 37%,
    var(--paper) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

@keyframes shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}

/* ── 페이지 버튼 ── */
.pager {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
  margin-top: 14px;
}

.pager button {
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  background: var(--surface);
  cursor: pointer;
  font: inherit;
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 700;
}

.pager button:hover:not(:disabled):not(.active) {
  border-color: var(--accent);
  color: var(--accent);
}

.pager button.active {
  border-color: var(--accent);
  color: var(--on-accent);
  background: var(--accent);
}

.pager button:disabled {
  cursor: default;
  opacity: 0.35;
}

/* 상태바 — 화면 맨 아래에서 결과를 알려주는 줄 */
.status-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  color: var(--ink-soft);
  font-size: 13.5px;
}

.status-bar::before {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--accent);
  content: '';
}

.stamp {
  margin-left: auto;
  color: var(--faint);
  font-size: 11.5px;
}
</style>

<!-- 배경은 이 대시보드가 아니라 "실행 프레임 전체"를 덮어야 한다.
     그래서 배경을 담을 기준점을 바깥 컨테이너에 준다. scoped 밖에 두는 이유다. -->
<style>
.stage-body:has(.dashboard-wrapper),
.result-stage:has(.dashboard-wrapper) {
  position: relative;
}
</style>
