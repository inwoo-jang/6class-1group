<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { link } from '../routes'
import { useConfigStore } from '@/members/gayeon/stores/configStore'
import axios from 'axios'
import { fetchFestivalsByArea, sortFestivals } from '@/members/gayeon/components/exercise/festivalService'
import FestivalList from '@/members/gayeon/components/exercise/FestivalList.vue'

const route = useRoute()

const cities = [
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
]

const city = ref(null)
const isLoading = ref(true)

const festivals = ref([])
const festivalStatus = ref('loading')

const loadFestivals = async (cityName) => {
  festivalStatus.value = 'loading'
  const meta = cities.find((c) => c.name === cityName)
  if (!meta) {
    festivalStatus.value = 'error'
    return
  }
  try {
    const list = await fetchFestivalsByArea(meta.tourAreaCode)
    festivals.value = sortFestivals(list)
    festivalStatus.value = 'ok'
  } catch (err) {
    console.error(err)
    festivalStatus.value = 'error'
  }
}

const configStore = useConfigStore()

const convertTemp = (rawTemp) => {
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32)
  }
  return rawTemp
}

const mapWeatherId = (id) => {
  if (id === 800 || id === 801) return '맑음'
  if (id >= 802 && id <= 804) return '구름'
  if (id >= 700 && id < 800) return '구름'
  return '비'
}

const OWM_BASE = 'https://api.openweathermap.org/data/2.5'
const OWM_KEY = import.meta.env.VITE_OPENWEATHER_KEY

const fetchCityWeather = async (meta) => {
  const [currentRes, forecastRes] = await Promise.all([
    axios.get(`${OWM_BASE}/weather`, {
      params: { lat: meta.lat, lon: meta.lon, appid: OWM_KEY, units: 'metric', lang: 'kr' },
    }),
    axios.get(`${OWM_BASE}/forecast`, {
      params: { lat: meta.lat, lon: meta.lon, appid: OWM_KEY, units: 'metric', lang: 'kr' },
    }),
  ])

  const current = currentRes.data
  const hourly = forecastRes.data.list.slice(0, 8).map((item) => ({
    time: item.dt_txt,
    temp: Math.round(item.main.temp),
    status: mapWeatherId(item.weather[0].id),
  }))

  return {
    id: meta.id,
    name: meta.name,
    region: meta.region,
    temp: Math.round(current.main.temp),
    humidity: current.main.humidity,
    status: mapWeatherId(current.weather[0].id),
    hourly,
  }
}

// Router 동적 경로(:cityId)를 기반으로 Mount 시점에 도시 정보 조회
const loadCity = async (cityId) => {
  isLoading.value = true
  city.value = null

  if (cityId === 'my-location') {
    if (!('geolocation' in navigator)) {
      isLoading.value = false
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          city.value = await fetchCityWeather({
            id: 'my-location',
            name: '내 위치',
            region: '내 위치',
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
        } finally {
          isLoading.value = false
        }
      },
      () => {
        isLoading.value = false
      },
    )
    return
  }

  const meta = cities.find((c) => c.id === cityId)
  if (!meta) {
    isLoading.value = false
    return
  }

  try {
    city.value = await fetchCityWeather(meta)
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

watch(() => route.params.cityId, loadCity, { immediate: true })

watch(city, (newCity) => {
  if (newCity && newCity.name !== '내 위치') {
    loadFestivals(newCity.name)
  }
})

const theme = computed(() => {
  switch (city.value?.status) {
    case '맑음':
      return { icon: 'fa-solid fa-sun', wash: '#fff4de', accent: '#ffb648' }
    case '비':
      return { icon: 'fa-solid fa-cloud-rain', wash: '#e8f4ff', accent: '#5fadff' }
    case '구름':
      return { icon: 'fa-solid fa-cloud', wash: '#f1edfb', accent: '#a79fc9' }
    default:
      return { icon: 'fa-solid fa-temperature-half', wash: '#f4f4f6', accent: '#9ca3af' }
  }
})

const tempInfo = computed(() => {
  const t = city.value?.temp ?? 0
  if (t >= 30) return { label: '무더워요', color: '#e4572e' }
  if (t >= 25) return { label: '더워요', color: '#ff9f45' }
  if (t >= 20) return { label: '선선해요', color: '#4caf50' }
  if (t >= 10) return { label: '쌀쌀해요', color: '#4a90e2' }
  return { label: '추워요', color: '#2e3a87' }
})

const humidityInfo = computed(() => {
  const h = city.value?.humidity ?? 0
  if (h >= 80) return { label: '눅눅해요', color: '#0f9da6', wash: '#e0f7f5' }
  if (h >= 60) return { label: '습해요', color: '#5fadff', wash: '#e8f4ff' }
  if (h >= 40) return { label: '쾌적해요', color: '#3fcb94', wash: '#e3fbf1' }
  return { label: '건조해요', color: '#d97706', wash: '#fef3e2' }
})

const formatHour = (isoString, index) => {
  if (index === 0) return '지금'
  return `${Number(isoString.slice(11, 13))}시`
}
</script>

<template>
  <div v-if="isLoading" class="status-box loading">
    <i class="fa-solid fa-spinner fa-spin"></i> 날씨 정보를 불러오는 중이에요...
  </div>

  <div v-else-if="!city" class="status-box error">
    <i class="fa-solid fa-triangle-exclamation"></i> 해당 도시 정보를 찾을 수 없어요.
    <RouterLink :to="link('home')" class="back-btn">대시보드 홈으로 이동</RouterLink>
  </div>

  <template v-else>
    <div class="detail-hero" :style="{ '--wash': theme.wash, '--accent': theme.accent }">
      <div class="detail-icon"><i :class="theme.icon"></i></div>
      <p class="detail-name">
        {{ city.name }}
        <span class="city-region">{{ city.region }}</span>
      </p>
      <p class="detail-temp">
        {{ convertTemp(city.temp) }}<span class="unit">{{ configStore.unitSymbol }}</span>
      </p>
      <div class="detail-meta">
        <span
          class="humidity"
          :style="{ color: humidityInfo.color, backgroundColor: humidityInfo.wash }"
        >
          <i class="fa-solid fa-droplet"></i> {{ city.humidity }}% · {{ humidityInfo.label }}
        </span>
        <span class="label" :style="{ backgroundColor: tempInfo.color }">{{ tempInfo.label }}</span>
      </div>
    </div>

    <section class="hourly-section" v-if="city.hourly?.length">
      <h3 class="section-title"><i class="fa-solid fa-clock"></i> 시간별 예보</h3>
      <div class="hourly-scroll">
        <div v-for="(hour, index) in city.hourly" :key="hour.time" class="hourly-item">
          <span class="hourly-time">{{ formatHour(hour.time, index) }}</span>
          <span class="hourly-temp">{{ convertTemp(hour.temp) }}{{ configStore.unitSymbol }}</span>
        </div>
      </div>
    </section>

    <section class="festival-section" v-if="city.name !== '내 위치'">
      <h3 class="section-title"><i class="fa-solid fa-champagne-glasses"></i> 지역 축제</h3>
      <div v-if="festivalStatus === 'loading'" class="mini-status loading">
        <i class="fa-solid fa-spinner fa-spin"></i> 축제 정보를 불러오는 중이에요...
      </div>
      <div v-else-if="festivalStatus === 'error'" class="mini-status error">
        <i class="fa-solid fa-triangle-exclamation"></i> 축제 정보를 불러오지 못했어요.
        <button class="retry-btn" @click="loadFestivals(city.name)">다시 시도</button>
      </div>
      <FestivalList
        v-else
        :festivals="festivals"
        :empty-message="`현재 ${city.name}에서 진행 중인 축제가 없습니다.`"
      />
    </section>

    <RouterLink :to="link('home')" class="back-btn">
      <i class="fa-solid fa-arrow-left"></i> 대시보드 홈으로 이동
    </RouterLink>
  </template>
</template>

<style scoped>
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

.detail-hero {
  position: relative;
  text-align: center;
  padding: 32px 20px;
  background-color: var(--wash);
  border-radius: 24px;
  margin-bottom: 24px;
}
.detail-icon {
  width: 76px;
  height: 76px;
  margin: 0 auto 12px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: var(--accent);
  background-color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 8px 20px rgba(69, 65, 95, 0.1);
}
.detail-name {
  margin: 0 0 4px 0;
  font-family: 'Jua', 'Pretendard', sans-serif;
  font-size: 22px;
  color: #45415f;
}
.city-region {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  background-color: #c7c2de;
  padding: 3px 10px;
  border-radius: 999px;
  vertical-align: middle;
}
.detail-temp {
  margin: 4px 0 12px 0;
  font-size: 44px;
  font-weight: 800;
  color: #45415f;
}
.unit {
  font-size: 20px;
  font-weight: 500;
  color: #a6a0be;
}
.detail-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}
.humidity {
  font-size: 13px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 999px;
}
.label {
  display: inline-block;
  padding: 5px 13px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}

.hourly-section {
  margin-bottom: 24px;
}
.section-title {
  margin: 0 0 12px 0;
  font-family: 'Jua', 'Pretendard', sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: #45415f;
}
.hourly-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.hourly-item {
  flex-shrink: 0;
  width: 62px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 6px;
  background-color: #fbfaff;
  border-radius: 14px;
}
.hourly-time {
  font-size: 12px;
  font-weight: 700;
  color: #a6a0be;
}
.hourly-temp {
  font-size: 14px;
  font-weight: 800;
  color: #45415f;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 999px;
  background-color: #f1ecff;
  color: #45415f;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.back-btn:hover {
  background-color: #45415f;
  color: #ffffff;
}
.festival-section {
  margin-bottom: 24px;
}
.mini-status {
  padding: 20px;
  border-radius: 14px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
}
.mini-status.loading {
  background-color: #eaf6ff;
  color: #3b82c4;
}
.mini-status.error {
  background-color: #ffe9f1;
  color: #ff5c8a;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
</style>
