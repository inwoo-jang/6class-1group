<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { link } from '../routes'
import { fetchFestivalsByArea } from '@/members/gayeon/components/exercise/festivalService'
import { fetchForecast } from '../../openMeteo.js'
import axios from 'axios'
import BaseDashboardCard from '@/members/gayeon/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/members/gayeon/components/exercise/SearchBar.vue'
import FilterBar from '@/members/gayeon/components/exercise/FilterBar.vue'
import RegionFilter from '@/members/gayeon/components/exercise/RegionFilter.vue'
import SortSelect from '@/members/gayeon/components/exercise/SortSelect.vue'
import WeatherCard from '@/members/gayeon/components/exercise/WeatherCard.vue'
import UnitToggler from '@/members/gayeon/components/exercise/UnitToggler.vue'

const router = useRouter()

/* ─────────────────────────────────────────────
   1. 반응형 상태 관리
   ───────────────────────────────────────────── */
const cities = ref([
  {
    id: 'city_01',
    name: '서울',
    region: '서울/경기',
    lat: 37.5665,
    lon: 126.978,
    tourAreaCode: '1',
  },
  {
    id: 'city_02',
    name: '수원',
    region: '서울/경기',
    lat: 37.2636,
    lon: 127.0286,
    tourAreaCode: '31',
  },
  {
    id: 'city_03',
    name: '인천',
    region: '서울/경기',
    lat: 37.4563,
    lon: 126.7052,
    tourAreaCode: '2',
  },
  { id: 'city_04', name: '춘천', region: '강원', lat: 37.8813, lon: 127.7298, tourAreaCode: '32' },
  { id: 'city_05', name: '강릉', region: '강원', lat: 37.7519, lon: 128.8761, tourAreaCode: '32' },
  { id: 'city_06', name: '천안', region: '충청', lat: 36.8151, lon: 127.1139, tourAreaCode: '34' },
  { id: 'city_07', name: '대전', region: '충청', lat: 36.3504, lon: 127.3845, tourAreaCode: '3' },
  { id: 'city_08', name: '청주', region: '충청', lat: 36.6424, lon: 127.489, tourAreaCode: '33' },
  { id: 'city_09', name: '전주', region: '전라', lat: 35.8242, lon: 127.148, tourAreaCode: '37' },
  { id: 'city_10', name: '광주', region: '전라', lat: 35.1595, lon: 126.8526, tourAreaCode: '5' },
  { id: 'city_11', name: '여수', region: '전라', lat: 34.7604, lon: 127.6622, tourAreaCode: '38' },
  { id: 'city_12', name: '대구', region: '경상', lat: 35.8714, lon: 128.6014, tourAreaCode: '4' },
  { id: 'city_13', name: '부산', region: '경상', lat: 35.1796, lon: 129.0756, tourAreaCode: '6' },
  { id: 'city_14', name: '포항', region: '경상', lat: 36.019, lon: 129.3435, tourAreaCode: '35' },
  { id: 'city_15', name: '제주', region: '제주', lat: 33.4996, lon: 126.5312, tourAreaCode: '39' },
])

const weatherList = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const myLocationState = ref('idle')

const searchQuery = ref('')
const selectedStatus = ref('전체')
const selectedRegion = ref('전체')
const selectedSort = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')
const selectedId = ref(null)
const selectedMoodStatus = ref(null)

/* ─────────────────────────────────────────────
   2. 즐겨찾기 (localStorage)
   ───────────────────────────────────────────── */
const FAVORITES_KEY = 'weather-diary-favorites'
const loadFavorites = () => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
const favoriteIds = ref(loadFavorites())
watch(favoriteIds, (val) => localStorage.setItem(FAVORITES_KEY, JSON.stringify(val)), {
  deep: true,
})

const toggleFavorite = (city) => {
  const idx = favoriteIds.value.indexOf(city.id)
  if (idx === -1) favoriteIds.value.push(city.id)
  else favoriteIds.value.splice(idx, 1)
}

/* ─────────────────────────────────────────────
   축제 배지 (C-1) - 실패해도 날씨 카드엔 영향 없음
   ───────────────────────────────────────────── */
const festivalBadges = ref({}) // cityId -> { label, color } | null

const computeBadge = (festivals) => {
  const ongoing = festivals.filter((f) => f.status.key === 'ongoing')
  if (ongoing.length > 0) return { label: `🎉 축제 ${ongoing.length}`, color: '#43a047' }
  const soon = festivals.filter((f) => f.status.key === 'soon')
  if (soon.length > 0) {
    const nearest = Math.min(...soon.map((f) => f.status.dday))
    return { label: `🔜 D-${nearest}`, color: '#fb8c00' }
  }
  return null
}

const loadFestivalBadges = () => {
  const uniqueCodes = [...new Set(cities.value.map((c) => c.tourAreaCode))]
  uniqueCodes.forEach((code) => {
    fetchFestivalsByArea(code)
      .then((festivals) => {
        cities.value
          .filter((c) => c.tourAreaCode === code)
          .forEach((c) => {
            festivalBadges.value[c.id] = computeBadge(festivals)
          })
      })
      .catch((err) => console.warn('축제 정보 조회 실패', code, err))
  })
}

/* ─────────────────────────────────────────────
   3. API 연동
   ───────────────────────────────────────────── */
// OpenWeatherMap 날씨 상태 코드(weather[0].id) → 우리 앱의 상태값
const mapWeatherId = (id) => {
  if (id === 800 || id === 801) return '맑음'
  if (id >= 802 && id <= 804) return '구름'
  if (id >= 700 && id < 800) return '구름' // 안개, 연무 등
  return '비' // 2xx 뇌우, 3xx 이슬비, 5xx 비, 6xx 눈
}

const OWM_BASE = 'https://api.openweathermap.org/data/2.5'
const OWM_KEY = import.meta.env.VITE_OPENWEATHER_KEY

/*
 * 키가 없을 때 — 공개 배포본에는 OpenWeather 키를 넣지 않는다.
 * 키가 필요 없는 팀 공용 창구(Open-Meteo · met.no)에서 같은 모양으로 받아 온다.
 * WMO 코드를 이 화면이 쓰는 세 가지(맑음 · 구름 · 비)로 옮긴다.
 */
const mapWmoCode = (code) => {
  if (code === 0 || code === 1) return '맑음'
  if (code === 2 || code === 3 || code === 45 || code === 48) return '구름'
  return '비'
}

/*
 * 시간별 예보는 따로 묻는다.
 * 지금 날씨는 Open-Meteo 가 막혀도 met.no 가 대신 답해 주지만, 시간별까지
 * 흉내 내지는 못한다. 한 번에 물으면 지금 날씨까지 같이 못 받는다.
 * 그래서 갈라 두고, 시간별은 실패해도 그냥 비워 둔다 — 카드의 기온은 살아 있다.
 */
const fetchHourlyWithoutKey = async (city) => {
  try {
    const data = await fetchForecast({
      latitude: city.lat,
      longitude: city.lon,
      hourly: 'temperature_2m,weather_code',
      timezone: 'Asia/Seoul',
      forecast_days: 2,
    })

    const times = data.hourly?.time ?? []
    // 지금 이후의 것만, OpenWeather 경로와 같이 여덟 칸
    const from = Math.max(
      0,
      times.findIndex((time) => new Date(time).getTime() >= Date.now()),
    )

    return times.slice(from, from + 8).map((time, index) => ({
      // OpenWeather 는 '2026-08-04 15:00:00' 모양으로 준다 — 화면이 그걸 읽는다
      time: `${time.replace('T', ' ')}:00`,
      temp: Math.round(data.hourly.temperature_2m[from + index] ?? 0),
      status: mapWmoCode(data.hourly.weather_code[from + index]),
    }))
  } catch {
    return []
  }
}

const fetchCityWithoutKey = async (city) => {
  const [data, hourly] = await Promise.all([
    fetchForecast({
      latitude: city.lat,
      longitude: city.lon,
      current: 'temperature_2m,relative_humidity_2m,weather_code',
      timezone: 'Asia/Seoul',
    }),
    fetchHourlyWithoutKey(city),
  ])

  const now = data.current ?? {}

  return {
    id: city.id,
    name: city.name,
    region: city.region,
    lat: city.lat,
    lon: city.lon,
    temp: Math.round(now.temperature_2m ?? 0),
    humidity: Math.round(now.relative_humidity_2m ?? 0),
    status: mapWmoCode(now.weather_code),
    hourly,
  }
}

const fetchCityWeather = async (city) => {
  if (!OWM_KEY) return fetchCityWithoutKey(city)

  const [currentRes, forecastRes] = await Promise.all([
    axios.get(`${OWM_BASE}/weather`, {
      params: { lat: city.lat, lon: city.lon, appid: OWM_KEY, units: 'metric', lang: 'kr' },
    }),
    axios.get(`${OWM_BASE}/forecast`, {
      params: { lat: city.lat, lon: city.lon, appid: OWM_KEY, units: 'metric', lang: 'kr' },
    }),
  ])

  const current = currentRes.data
  const hourly = forecastRes.data.list.slice(0, 8).map((item) => ({
    time: item.dt_txt, // "2026-08-04 15:00:00" 형태
    temp: Math.round(item.main.temp),
    status: mapWeatherId(item.weather[0].id),
  }))

  return {
    id: city.id,
    name: city.name,
    region: city.region,
    lat: city.lat,
    lon: city.lon,
    temp: Math.round(current.main.temp),
    humidity: current.main.humidity,
    status: mapWeatherId(current.weather[0].id),
    hourly,
  }
}

const loadAllWeather = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const results = await Promise.all(cities.value.map(fetchCityWeather))
    weatherList.value = results
  } catch (err) {
    console.error(err)
    errorMessage.value = '날씨 정보를 불러오지 못했어요. 네트워크 상태를 확인해주세요.'
  } finally {
    isLoading.value = false
  }
}

/* ─────────────────────────────────────────────
   4. 내 위치
   ───────────────────────────────────────────── */
const reverseGeocode = async (lat, lon) => {
  try {
    const res = await axios.get('https://api.bigdatacloud.net/data/reverse-geocode-client', {
      params: { latitude: lat, longitude: lon, localityLanguage: 'ko' },
    })
    return res.data.city || res.data.locality || '내 위치'
  } catch (err) {
    console.warn('지명을 가져오지 못했어요.', err)
    return '내 위치'
  }
}

const loadMyLocation = () => {
  if (!('geolocation' in navigator)) {
    myLocationState.value = 'error'
    return
  }
  myLocationState.value = 'loading'
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords
        const [myCity, placeName] = await Promise.all([
          fetchCityWeather({
            id: 'my-location',
            name: '내 위치',
            region: '내 위치',
            lat: latitude,
            lon: longitude,
          }),
          reverseGeocode(latitude, longitude),
        ])
        myCity.name = placeName
        myCity.isMyLocation = true
        weatherList.value = [myCity, ...weatherList.value.filter((c) => c.id !== 'my-location')]
        myLocationState.value = 'done'
      } catch (err) {
        console.error(err)
        myLocationState.value = 'error'
      }
    },
    (err) => {
      console.warn('위치 정보를 가져오지 못했습니다.', err)
      myLocationState.value = 'error'
    },
  )
}

onMounted(() => {
  loadAllWeather()
  loadMyLocation()
  loadFestivalBadges()
})

/* ─────────────────────────────────────────────
   5. computed - 필터 + 정렬 + 우선순위
   ───────────────────────────────────────────── */
const displayedWeatherList = computed(() => {
  let list = [...weatherList.value]

  if (selectedRegion.value !== '전체') {
    list = list.filter((city) => city.region === selectedRegion.value)
  }
  if (selectedStatus.value !== '전체') {
    list = list.filter((city) => city.status === selectedStatus.value)
  }
  const query = searchQuery.value.trim()
  if (query) {
    list = list.filter((city) => city.name.includes(query))
  }

  switch (selectedSort.value) {
    case 'temp-desc':
      list.sort((a, b) => b.temp - a.temp)
      break
    case 'temp-asc':
      list.sort((a, b) => a.temp - b.temp)
      break
    case 'name-asc':
      list.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
      break
  }

  const priorityOf = (city) => {
    if (city.id === 'my-location') return 0
    if (favoriteIds.value.includes(city.id)) return 1
    return 2
  }
  list.sort((a, b) => priorityOf(a) - priorityOf(b))

  return list
})

watch(selectedCityInfo, (newInfo, oldInfo) => {
  console.log(`👁️ [watch] 상태바 변경: "${oldInfo}" → "${newInfo}"`)
})

watchEffect(() => {
  console.log(
    `🤖 [watchEffect] 현재 검색어 '${searchQuery.value}' → 검색 결과 ${displayedWeatherList.value.length}건`,
  )
})

/* ─────────────────────────────────────────────
   이벤트 처리
   ───────────────────────────────────────────── */
const updateQuery = (val) => {
  searchQuery.value = val
}
const updateStatus = (val) => {
  selectedStatus.value = val
}
const updateRegion = (val) => {
  selectedRegion.value = val
}
const updateSort = (val) => {
  selectedSort.value = val
}

const selectCity = (city) => {
  selectedId.value = city.id
  selectedCityInfo.value = `${city.name}이 선택되었습니다.`
  selectedMoodStatus.value = city.status
}

// 상세보기 → Programmatic Navigation
const showDetail = (city) => {
  router.push(link('weatherDetail', { cityId: city.id }))
}
</script>

<template>
  <div class="mood-bg">
    <div class="mood-layer layer-default" :class="{ active: !selectedMoodStatus }"></div>
    <div class="mood-layer layer-sunny" :class="{ active: selectedMoodStatus === '맑음' }"></div>
    <div class="mood-layer layer-rainy" :class="{ active: selectedMoodStatus === '비' }"></div>
    <div class="mood-layer layer-cloudy" :class="{ active: selectedMoodStatus === '구름' }"></div>
  </div>

  <header class="app-header">
    <div class="header-text">
      <h1 class="app-title">과제 : 날씨 다이어리</h1>
      <p class="app-subtitle">실시간 날씨를 확인해보세요</p>
    </div>
    <div class="header-right">
      <UnitToggler />
      <span class="badge"><i class="fa-solid fa-puzzle-piece"></i> Vue.js</span>
    </div>
  </header>

  <BaseDashboardCard>
    <SearchBar :current-query="searchQuery" @update-query="updateQuery" />
  </BaseDashboardCard>

  <div class="controls-row">
    <div class="controls-top">
      <FilterBar :current-status="selectedStatus" @update-status="updateStatus" />
      <SortSelect :current-sort="selectedSort" @update-sort="updateSort" />
    </div>
    <RegionFilter :current-region="selectedRegion" @update-region="updateRegion" />
    <p v-if="myLocationState === 'loading'" class="location-hint">
      <i class="fa-solid fa-location-crosshairs fa-spin"></i> 내 위치를 찾는 중이에요...
    </p>
    <p v-else-if="myLocationState === 'error'" class="location-hint">
      <i class="fa-solid fa-location-crosshairs"></i> 위치 권한이 없어 내 위치는 표시되지 않아요.
    </p>
  </div>

  <BaseDashboardCard>
    <h3 class="panel-title">
      <span><i class="fa-solid fa-chart-simple"></i> 지역별 날씨 현황</span>
      <span class="count">{{ displayedWeatherList.length }}건</span>
    </h3>

    <div v-if="isLoading" class="status-box loading">
      <i class="fa-solid fa-spinner fa-spin"></i> 날씨 정보를 불러오는 중이에요...
    </div>

    <div v-else-if="errorMessage" class="status-box error">
      <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMessage }}
      <button class="retry-btn" @click="loadAllWeather">
        <i class="fa-solid fa-rotate-right"></i> 다시 시도
      </button>
    </div>

    <template v-else>
      <div class="card-list">
        <WeatherCard
          v-for="city in displayedWeatherList"
          :key="city.id"
          :city-item="city"
          :is-selected="selectedId === city.id"
          :is-favorite="favoriteIds.includes(city.id)"
          :festival-badge="festivalBadges[city.id]"
          @select-card="selectCity"
          @click-detail="showDetail"
          @toggle-favorite="toggleFavorite"
        />
      </div>

      <p v-if="displayedWeatherList.length === 0" class="empty-result">
        <i class="fa-solid fa-face-frown"></i> 조건에 맞는 도시가 없습니다.
      </p>
    </template>
  </BaseDashboardCard>

  <div class="status-bar">
    <i class="fa-solid fa-comment-dots"></i>
    {{ selectedCityInfo }}
  </div>
</template>

<style scoped>
.mood-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}
.mood-layer {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 1.1s ease;
}
.mood-layer.active {
  opacity: 1;
}
.layer-default {
  background: linear-gradient(160deg, #fff8ef 0%, #eaf6ff 60%, #eef2ff 100%);
}
.layer-sunny {
  background: linear-gradient(160deg, #fff3d6 0%, #ffe3b0 55%, #ffcf85 100%);
}
.layer-rainy {
  background: linear-gradient(160deg, #dceeff 0%, #bcdcff 55%, #9dc4ef 100%);
}
.layer-cloudy {
  background: linear-gradient(160deg, #eee9fb 0%, #ddd5f2 55%, #c7bce4 100%);
}
.layer-sunny::before {
  content: '';
  position: absolute;
  top: -140px;
  right: -100px;
  width: 460px;
  height: 460px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 182, 72, 0.6), transparent 70%);
  filter: blur(6px);
}
.layer-rainy::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    112deg,
    rgba(255, 255, 255, 0.35) 0px,
    rgba(255, 255, 255, 0.35) 2px,
    transparent 2px,
    transparent 26px
  );
}
.layer-cloudy::before {
  content: '';
  position: absolute;
  top: 8%;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  max-width: 620px;
  height: 220px;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.55), transparent 70%);
  filter: blur(4px);
}

.app-header {
  padding: 8px 8px 24px 8px;
  margin-bottom: 24px;
  border-bottom: 2px dashed #f1ecff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.app-title {
  margin: 0;
  font-family: 'Jua', 'Pretendard', sans-serif;
  font-size: 26px;
  font-weight: 400;
  color: #45415f;
}
.app-subtitle {
  margin: 0;
  font-size: 13px;
  color: #a6a0be;
}
.badge {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background-color: #ffe9f1;
  color: #ff7faa;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
}

.controls-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}
.controls-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.location-hint {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #a6a0be;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 16px 0;
  font-family: 'Jua', 'Pretendard', sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #45415f;
}
.panel-title i {
  margin-right: 6px;
}
.count {
  padding: 4px 12px;
  background-color: #e3fbf1;
  color: #3fcb94;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.status-box {
  padding: 40px 18px;
  border-radius: 18px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
}
.status-box.loading {
  background-color: #eaf6ff;
  color: #3b82c4;
}
.status-box.error {
  background-color: #ffe9f1;
  color: #ff5c8a;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.retry-btn {
  padding: 8px 18px;
  border: none;
  border-radius: 999px;
  background-color: #ff7faa;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.retry-btn:hover {
  background-color: #ff5c8a;
}

.empty-result {
  margin: 14px 0 0 0;
  padding: 30px 18px;
  background-color: #ffe9f1;
  border: 2px dashed #ffc2d9;
  border-radius: 18px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #ff5c8a;
}

.status-bar {
  margin-top: 24px;
  padding: 16px 20px;
  background-color: #eaf6ff;
  border-radius: 18px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #3b82c4;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.header-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
</style>
