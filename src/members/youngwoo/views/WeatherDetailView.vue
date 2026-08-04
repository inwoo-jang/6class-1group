<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KOREA_CITIES } from '../utils/koreaCities'
import { WORLD_CITIES } from '../utils/worldCities'
import { fetchWeatherForCities, getWeatherErrorMessage } from '../utils/fetchWeather'
import { fetchAirQuality, fetchForecast } from '../utils/fetchWeatherExtras'
import { useDisplayTemp } from '../composables/useDisplayTemp'
import { link } from '../routes'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const route = useRoute()
const router = useRouter()

const city = ref(null)
const isDomestic = ref(true)
const isLoading = ref(false)
const errorMessage = ref('')

const airQuality = ref(null)
const airQualityLoading = ref(false)

const forecast = ref([])
const forecastLoading = ref(false)

const { unitSymbol, displayTemp } = useDisplayTemp(() => city.value?.temp)

const regionLabel = computed(() => (isDomestic.value ? '대한민국 ' : ''))

function formatForecastDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return `${date.getMonth() + 1}/${date.getDate()} (${WEEKDAYS[date.getDay()]})`
}

async function loadMainWeather(target) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [result] = await fetchWeatherForCities([target])
    city.value = result
  } catch (error) {
    errorMessage.value = getWeatherErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

// 미세먼지·예보는 상세 화면을 보조하는 부가 정보라, 메인 날씨와 서로 기다리지 않고
// 각자 준비되는 대로 채워진다. 실패해도 그 섹션만 "불러오지 못함"으로 남고 나머지엔 영향 없다.
async function loadAirQuality(target) {
  airQualityLoading.value = true
  try {
    airQuality.value = await fetchAirQuality(target)
  } catch {
    airQuality.value = null
  } finally {
    airQualityLoading.value = false
  }
}

async function loadForecast(target) {
  forecastLoading.value = true
  try {
    forecast.value = await fetchForecast(target)
  } catch {
    forecast.value = []
  } finally {
    forecastLoading.value = false
  }
}

function loadWeatherFor(target) {
  // 셋 다 위경도만 있으면 되고 서로 의존관계가 없어서, 하나가 끝나야 다음이
  // 시작하는 게 아니라 처음부터 동시에 쏜다.
  loadMainWeather(target)
  loadAirQuality(target)
  loadForecast(target)
}

function loadCityWeather() {
  const cityId = route.params.cityId

  // "현위치" 버튼처럼 목록에 없는 임의 좌표는 쿼리스트링(lat/lon/name)으로 받는다.
  if (cityId === 'current-location') {
    const lat = Number(route.query.lat)
    const lon = Number(route.query.lon)
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      errorMessage.value = '위치 정보가 없습니다.'
      return
    }
    isDomestic.value = false
    loadWeatherFor({
      id: 'current-location',
      name: route.query.name || '현재 위치',
      lat,
      lon,
    })
    return
  }

  const foundInKorea = KOREA_CITIES.find((item) => item.id === cityId)
  const found = foundInKorea ?? WORLD_CITIES.find((item) => item.id === cityId)

  if (!found) {
    errorMessage.value = '존재하지 않는 도시입니다.'
    return
  }

  isDomestic.value = Boolean(foundInKorea)
  loadWeatherFor(found)
}

function goHome() {
  router.push(link('home'))
}

onMounted(loadCityWeather)
</script>

<template>
  <div class="weather-detail">
    <div class="weather-detail__header">
      <button class="weather-detail__back-btn" @click="goHome">
        <i class="fa-solid fa-arrow-left"></i> 뒤로가기
      </button>
      <h2 class="weather-detail__title">
        <i class="fa-solid fa-location-dot"></i> 지역별 상세 기상관측 정보
      </h2>
    </div>

    <p v-if="isLoading" class="weather-detail__empty">
      <i class="fa-solid fa-spinner fa-spin"></i> 날씨 정보를 불러오는 중입니다...
    </p>
    <p v-else-if="errorMessage" class="weather-detail__error">
      <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMessage }}
    </p>

    <template v-else-if="city">
      <div class="weather-detail__card">
        <p class="weather-detail__place">
          <i class="fa-solid fa-location-dot"></i> 지정 지역: {{ regionLabel }}{{ city.name }}
        </p>
        <dl class="weather-detail__list">
          <div class="weather-detail__row">
            <dt><i class="fa-solid fa-temperature-half"></i> 실시간 기온</dt>
            <dd>{{ displayTemp }}{{ unitSymbol }}</dd>
          </div>
          <div class="weather-detail__row">
            <dt><i class="fa-solid" :class="city.icon"></i> 기상 현황</dt>
            <dd>{{ city.status }}</dd>
          </div>
          <div class="weather-detail__row">
            <dt><i class="fa-solid fa-droplet"></i> 습도</dt>
            <dd>{{ city.humidity }}%</dd>
          </div>
          <div class="weather-detail__row">
            <dt><i class="fa-solid fa-wind"></i> 풍속</dt>
            <dd>{{ city.windSpeed }}m/s</dd>
          </div>
        </dl>
      </div>

      <div class="weather-detail__card">
        <p class="weather-detail__section-title"><i class="fa-solid fa-smog"></i> 미세먼지</p>
        <p v-if="airQualityLoading" class="weather-detail__section-empty">불러오는 중...</p>
        <dl v-else-if="airQuality" class="weather-detail__list">
          <div class="weather-detail__row">
            <dt>등급</dt>
            <dd>{{ airQuality.level }}</dd>
          </div>
          <div class="weather-detail__row">
            <dt>미세먼지 (PM10)</dt>
            <dd>{{ airQuality.pm10 }}µg/m³</dd>
          </div>
          <div class="weather-detail__row">
            <dt>초미세먼지 (PM2.5)</dt>
            <dd>{{ airQuality.pm2_5 }}µg/m³</dd>
          </div>
        </dl>
        <p v-else class="weather-detail__section-empty">미세먼지 정보를 불러오지 못했습니다.</p>
      </div>

      <div class="weather-detail__card">
        <p class="weather-detail__section-title">
          <i class="fa-solid fa-calendar-days"></i> 5일 예보
        </p>
        <p v-if="forecastLoading" class="weather-detail__section-empty">불러오는 중...</p>
        <ul v-else-if="forecast.length > 0" class="weather-detail__forecast">
          <li v-for="day in forecast" :key="day.date" class="weather-detail__forecast-day">
            <span class="weather-detail__forecast-date">{{ formatForecastDate(day.date) }}</span>
            <i class="fa-solid" :class="day.icon"></i>
            <span class="weather-detail__forecast-temps">
              <strong>{{ day.tempMax }}°</strong> / {{ day.tempMin }}°
            </span>
          </li>
        </ul>
        <p v-else class="weather-detail__section-empty">예보 정보를 불러오지 못했습니다.</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.weather-detail {
  max-width: 480px;
  margin: 12px auto 32px;
  padding: 0 16px;
}

.weather-detail__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 20px;
}

.weather-detail__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 20px;
  color: var(--color-text);
}

.weather-detail__title i {
  color: var(--color-primary-darker);
}

.weather-detail__card {
  background: var(--color-card-background);
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-large);
  padding: 20px 22px;
  margin-bottom: 18px;
  box-shadow: var(--shadow-card);
}

.weather-detail__place {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
}

.weather-detail__place i {
  color: var(--color-primary-darker);
}

.weather-detail__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

.weather-detail__section-title i {
  color: var(--color-primary-darker);
}

.weather-detail__section-empty {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-light);
  text-align: center;
}

.weather-detail__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
}

.weather-detail__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.weather-detail__row dt {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
}

.weather-detail__row dt i {
  width: 16px;
  color: var(--color-primary-darker);
}

.weather-detail__row dd {
  margin: 0;
  font-weight: 700;
  color: var(--color-text);
}

.weather-detail__forecast {
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: auto;
}

.weather-detail__forecast-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 64px;
  padding: 10px 6px;
  border-radius: var(--border-radius-medium);
  background: var(--color-primary-opacity-10);
}

.weather-detail__forecast-date {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.weather-detail__forecast-day i {
  font-size: 16px;
  color: var(--color-primary-darker);
}

.weather-detail__forecast-temps {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.weather-detail__forecast-temps strong {
  color: var(--color-text);
}

.weather-detail__empty,
.weather-detail__error {
  margin: 4px 0 18px;
  padding: 10px 16px;
  border-radius: var(--border-radius-medium);
  font-size: 14px;
  text-align: center;
}

.weather-detail__empty {
  color: var(--color-text-light);
}

.weather-detail__error {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.weather-detail__back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 8px 12px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
  background: var(--color-card-background);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.weather-detail__back-btn:hover {
  background: var(--color-primary-darker);
  border-color: var(--color-primary-darker);
  color: #ffffff;
}
</style>
