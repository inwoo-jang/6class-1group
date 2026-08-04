<script setup>
/**
 * 대시보드 — /m/inwoo
 * ------------------------------------------------------------------
 * 전국 도시의 오늘 날씨를 한 화면에서 본다. 모든 반응형 데이터는
 * 이 파일이 들고, 아래 부품들은 props 로 받아 그리고 emits 로 되돌려 준다.
 *
 *   DashboardView.vue            ← 모든 반응형 데이터 보유 (이 파일)
 *   ├── BaseDashboardCard.vue      공통 껍데기 + <slot>
 *   ├── el-input                   검색창 (Element Plus · 교안 8장)
 *   ├── RegionTabs.vue             props: regions·current / emits: select-region
 *   ├── WeatherCard.vue            props: city-item·favorite·here / emits: 3종
 *   │   └── WeatherIcon.vue        props: status
 *   └── WeatherByStatus.vue        같은 목록을 날씨 기준으로 묶어 보여준다
 *
 * 날씨는 weatherApi.js 가 받아온다 (OpenWeather → Open-Meteo → MET Norway 순).
 * 배경은 껍데기(index.vue)가 그리므로, 여기서는 어떤 날씨를 보여 줄지만
 * 공유 상태(data/backdropState.js)에 적어 둔다.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
// 1. 컴포넌트 파일명 국룰 표기법(PascalCase) 매칭 수입
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import RegionTabs from '../components/RegionTabs.vue'
import WeatherCard from '../components/WeatherCard.vue'
import WeatherByStatus from '../components/WeatherByStatus.vue'
import UiIcon from '../components/UiIcon.vue'
import UnitSwitch from '../components/UnitSwitch.vue'
import { fetchWeather, nearestCity, REGIONS, DEMO_ROWS } from '../data/weatherApi'
import { backdropStatus } from '../data/backdropState'
import { link } from '../routes'
import { storeToRefs } from 'pinia'
import { useConfigStore } from '../stores/configStore'
import { ElMessage } from 'element-plus'

/**
 * 온도 단위 — 도구 줄의 ℃ · ℉ 스위치가 바꾸고, 이 화면과 상세 화면이 함께 본다.
 * 화면끼리 값을 주고받지 않고 각자 Store 를 본다 (교안 6장 Pinia).
 */
const { unitSymbol, toUnit } = storeToRefs(useConfigStore())

const router = useRouter()

const FAVORITES_KEY = 'inwoo-weather-favorites'

/** el-segmented 에 넘길 보기 방식 두 가지 */
const VIEW_OPTIONS = [
  { value: 'region', label: '지역별 날씨 현황', icon: 'city' },
  { value: 'status', label: '날씨별 지역 현황', icon: 'droplet' },
]

// ── 서버에서 받아 오는 데이터 ──
const weatherList = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const isStale = ref(false)
const updatedAt = ref('')

/** 이번 값이 어느 제공자에서 왔는지 — 상태 바에 그대로 적는다 */
const SOURCE_LABEL = {
  openweather: 'OpenWeather',
  'open-meteo': 'Open-Meteo',
  'met.no': 'MET Norway',
  cache: '저장해 둔 값',
}
const sourceLabel = ref('')

// ── 사용자가 만지는 상태 ──
const searchQuery = ref('')
const selectedRegion = ref('전체')
const viewMode = ref('region') // 'region' | 'status'
const selectedCityId = ref('')

/**
 * 상태 바 문구.
 * ref 에 문자열을 넣어 두면 단위를 바꿔도 그때 만든 문장이 그대로 남는다.
 * 고른 도시와 단위에서 "계산되는" 값이므로 computed 로 둔다.
 */
const selectedCityInfo = computed(() => {
  const city = weatherList.value.find((item) => item.id === selectedCityId.value)
  if (!city) return '카드를 클릭하거나 검색해 보세요.'
  return `${city.name} · ${city.status} · ${toUnit.value(city.temp)}${unitSymbol.value} · 습도 ${city.humidity}%`
})

// ── 목록은 5곳씩 끊어서 보여 준다 ──
const PAGE_SIZE = 5
const page = ref(1)

/** 선택을 풀면 배경이 다시 현재 위치를 따른다 */
const clearSelection = () => {
  selectedCityId.value = ''
}

/** 카드를 고르면 부모가 기억한다 (자식은 id만 올려 준다) */
const selectCity = (cityId) => {
  // 같은 카드를 다시 누르면 선택을 푼다 (배경은 현재 위치로 돌아간다)
  if (selectedCityId.value === cityId) {
    clearSelection()
    return
  }
  selectedCityId.value = cityId
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
      ElMessage.warning('위치 권한이 없어 현재 위치를 표시하지 못했습니다.')
    },
    { timeout: 8000 },
  )
}

/** 실제 API 호출 — 실패해도 화면이 죽지 않도록 에러를 상태로 받는다 */
const load = async (force = false) => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { rows, at, stale, source } = await fetchWeather(undefined, force)
    sourceLabel.value = SOURCE_LABEL[source] ?? SOURCE_LABEL['open-meteo']
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
    // 사용자가 직접 새로고침을 눌렀을 때만 알린다. 10분마다 도는 자동 갱신까지
    // 알리면 가만히 있어도 토스트가 떠서 성가시다.
    if (force && !stale) ElMessage.success({ message: '날씨를 새로 받았습니다.', duration: 1800 })
  } catch (error) {
    errorMessage.value = '날씨를 불러오지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.'
    isStale.value = false
    if (force) ElMessage.error('날씨를 불러오지 못했습니다.')
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
  /*
   * 홈에서 가장 먼저 보고 싶은 것은 "지금 내가 있는 곳"의 날씨다.
   * 한 번 거절한 사용자를 계속 귀찮게 하지는 않고, 그 밖에는 바로 물어본다.
   * 거절해도 목록은 그대로 보이므로 화면이 막히지 않는다.
   */
  const status = await navigator.permissions?.query({ name: 'geolocation' }).catch(() => null)
  if (status?.state !== 'denied') findMyLocation()
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
      <!-- 교안 8장 — 직접 만든 SearchBar 대신 Element Plus 의 입력 컴포넌트를 쓴다.
           clearable 한 줄로 'X 눌러 지우기'가 붙는 것이 라이브러리를 쓰는 이유다. -->
      <h3 class="card-title">도시 검색</h3>
      <el-input
        v-model="searchQuery"
        size="large"
        clearable
        placeholder="검색할 도시 이름 입력"
        aria-label="도시 검색"
      >
        <template #prefix>
          <UiIcon name="search" :size="16" />
        </template>
      </el-input>
      <p v-if="searchQuery" class="search-echo">
        검색 중인 도시: <strong>{{ searchQuery }}</strong>
      </p>
    </BaseDashboardCard>

    <BaseDashboardCard>
      <!-- 보기 방식 — el-segmented. 두 값 중 하나를 고르는 자리에 딱 맞는다 -->
      <el-segmented v-model="viewMode" :options="VIEW_OPTIONS" class="view-segmented">
        <template #default="{ item }">
          <span class="seg-item">
            <UiIcon :name="item.icon" :size="15" /> {{ item.label }}
          </span>
        </template>
      </el-segmented>

      <div class="tool-row">
        <p class="summary">
          <b>{{ matched.length }}</b>곳
          <span v-if="favoriteCount" class="fav-count">
            <UiIcon name="star" :size="12" :filled="true" /> {{ favoriteCount }}
          </span>
        </p>

        <el-button
          round
          size="small"
          :loading="locationState === 'asking'"
          @click="findMyLocation"
        >
          <UiIcon v-if="locationState !== 'asking'" name="location" :size="14" />
          <span class="btn-label">{{ locationState === 'asking' ? '찾는 중…' : '내 위치' }}</span>
        </el-button>

        <!-- 새로고침은 아이콘만 — loading 이면 el-button 이 알아서 회전 표시를 낸다 -->
        <el-button
          circle
          size="small"
          :loading="isLoading"
          title="새로고침"
          aria-label="새로고침"
          @click="load(true)"
        >
          <UiIcon name="refresh" :size="15" />
        </el-button>

        <!-- 새로고침 옆 — 온도 단위 -->
        <UnitSwitch />
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

      <!-- 첫 로딩 — 빈 화면 대신 카드 모양을 먼저 깔아 둔다.
           반짝이는 애니메이션은 el-skeleton 이 맡고, 조각의 배치만 우리가 정한다. -->
      <el-skeleton v-else-if="isLoading && !weatherList.length" animated class="skeleton">
        <template #template>
          <div v-for="n in 5" :key="n" class="skeleton-card">
            <el-skeleton-item variant="image" class="sk-tile" />
            <span class="sk-lines">
              <el-skeleton-item variant="text" class="sk-line wide" />
              <el-skeleton-item variant="text" class="sk-line" />
            </span>
            <span class="sk-metrics">
              <el-skeleton-item variant="button" class="sk-pill" />
              <el-skeleton-item variant="button" class="sk-pill" />
            </span>
          </div>
        </template>
      </el-skeleton>

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
          :temp-value="toUnit(item.temp)"
          :temp-unit="unitSymbol"
          @select-card="selectCity"
          @click-detail="showDetail"
          @toggle-favorite="toggleFavorite"
          @dblclick="showDetail(item.name)"
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
          :temp-value="toUnit(selectedCity.temp)"
          :temp-unit="unitSymbol"
          @select-card="selectCity"
          @click-detail="showDetail"
          @toggle-favorite="toggleFavorite"
          @dblclick="showDetail(selectedCity.name)"
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
      <small v-if="updatedAt" class="stamp">{{ updatedAt }} 기준 · {{ sourceLabel }}</small>
    </div>
  </div>
</template>

<style scoped>
/* 판의 너비는 껍데기(index.vue)가 잡는다 — 홈 · 소개 · 상세가 전부 같은 폭이다 */
.dashboard-wrapper {
  display: grid;
  gap: 12px;
}

.card-title {
  margin: 0 0 14px;
  color: var(--ink);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.search-echo {
  margin: 10px 2px 0;
  color: var(--muted);
  font-size: 12.5px;
}

.search-echo strong {
  color: var(--accent);
}

/* ──────────────────────────────────────────────────────────────
 * Element Plus 부품 맞춤 (교안 8장)
 * 라이브러리 기본값은 파란 계열이라 이 사이트의 토큰으로 덮는다.
 * :deep() 를 써야 scoped 상태에서도 라이브러리 내부 요소에 닿는다.
 * ────────────────────────────────────────────────────────────── */
.dashboard-wrapper :deep(.el-input__wrapper) {
  padding: 4px 16px;
  border-radius: 999px;
  background: var(--paper);
  box-shadow: none;
}

.dashboard-wrapper :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--accent) inset;
}

.dashboard-wrapper :deep(.el-input__inner) {
  color: var(--ink);
  font-family: inherit;
}

.dashboard-wrapper :deep(.el-input__prefix) {
  color: var(--faint);
}

/* 보기 방식 — 알약 두 칸 */
.view-segmented {
  width: 100%;
  margin-bottom: 14px;
  padding: 4px;
  border-radius: 999px;
  background: var(--paper);
}

/*
 * el-segmented 는 "선택 표시"를 항목 뒤에서 미끄러지는 별도 요소로 그린다.
 * 그래서 색을 바꿀 곳은 항목이 아니라 그 표시(.el-segmented__item-selected)다.
 * 항목 배경을 칠하면 표시가 글자를 덮어 버린다.
 */
.view-segmented :deep(.el-segmented__item-selected) {
  border-radius: 999px;
  background: var(--surface);
  box-shadow: 0 1px 4px rgb(15 23 42 / 8%);
}

.view-segmented :deep(.el-segmented__item) {
  color: var(--muted);
}

.view-segmented :deep(.el-segmented__item:hover:not(.is-selected)) {
  color: var(--accent);
  background: transparent;
}

.view-segmented :deep(.el-segmented__item.is-selected) {
  color: var(--accent);
  background: transparent;
}

.view-segmented :deep(.el-segmented__item) {
  padding: 9px 14px;
}

/* 항목 안의 내용이 칸 가운데 오도록 폭을 채운다 */
.seg-item {
  display: flex;
  gap: 7px;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 13px;
  font-weight: 700;
}

/* 도구 버튼 — 테두리만 있는 담백한 형태 */
.tool-row :deep(.el-button) {
  --el-button-bg-color: var(--surface);
  --el-button-border-color: var(--line);
  --el-button-text-color: var(--muted);
  --el-button-hover-bg-color: var(--accent-tint);
  --el-button-hover-border-color: var(--accent);
  --el-button-hover-text-color: var(--accent);

  gap: 5px;
  font-weight: 600;
}

.btn-label {
  font-size: 12px;
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
