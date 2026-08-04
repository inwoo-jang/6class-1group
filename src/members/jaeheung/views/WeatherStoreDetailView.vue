<script setup>
/* ── [Store 실습 / 과제5] WeatherStoreDetailView.vue ──
   WeatherDetailView.vue(과제4)를 기반으로, Pinia configStore의 단위 설정에 따라
   기온/체감온도 표시를 섭씨/화씨로 변환한다. 도시 목록은 과제4(Open-Meteo)와 분리된
   useOpenWeatherCities(Axios + OpenWeatherMap) 싱글턴을 공유한다. */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOpenWeatherCities } from '../composables/useOpenWeatherCities'
import { fetchAirQuality, gradePm10 } from '../composables/useOpenWeatherApi'
import { useConfigStore } from '../composables/useConfigState'
import MagpieNest from '../components/MagpieNest.vue'
import { link } from '../routes'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()

const { cities, loading, loaded, error: apiError, loadCities } = useOpenWeatherCities()

onMounted(loadCities)

const city = computed(() => cities.value.find((c) => c.id === route.params.cityId) ?? null)
const notFound = computed(() => loaded.value && !loading.value && !city.value)

/* ── 미세먼지(대기질) — 도시가 확정되면 위/경도로 한 번 조회한다 ── */
const airQuality = ref(null)
const airLoading = ref(false)
const airError = ref(false)

watch(
  city,
  async (target) => {
    if (!target || target.lat === undefined || target.lon === undefined) return
    airLoading.value = true
    airError.value = false
    try {
      airQuality.value = await fetchAirQuality(target.lat, target.lon)
    } catch {
      airError.value = true
    } finally {
      airLoading.value = false
    }
  },
  { immediate: true },
)

const dustGrade = computed(() => gradePm10(airQuality.value?.pm10 ?? null))

/* ── [Store 실습] 단위 설정(configStore)에 따라 기온/체감온도 표시를 변환 ── */
const toDisplayTemp = (rawTemp) => {
  if (rawTemp === null || rawTemp === undefined) return null
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32) // 화씨 변환 연산
  }
  return rawTemp // 'celsius'일 때는 원본 그대로 반환
}
const displayTemp = computed(() => toDisplayTemp(city.value?.temp))
const displayFeelsLike = computed(() => toDisplayTemp(city.value?.feelsLike))

const goHome = () => {
  router.push(link('home'))
}
</script>

<template>
  <div class="card-panel">
    <div v-if="loading" class="loading">날씨 불러오는 중...</div>

    <template v-else-if="city">
      <p class="panel-title">
        📡 {{ city.name }} 상세 기상관측 정보
        <span class="live-dot" title="Axios + OpenWeatherMap 실시간 연동"></span>
      </p>

      <p v-if="city.temp === null" class="not-found">
        ⚠️ 이 도시의 날씨 정보를 불러오지 못했습니다.
      </p>
      <div v-else class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">현재 상태</span>
          <span class="detail-value">{{ city.status }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">현재 기온</span>
          <span class="detail-value">{{ displayTemp }}{{ configStore.unitSymbol }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">체감 온도</span>
          <span class="detail-value">{{ displayFeelsLike }}{{ configStore.unitSymbol }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">습도</span>
          <span class="detail-value">{{ city.humidity }}%</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">풍속</span>
          <span class="detail-value">{{ city.windSpeed }}m/s</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">도시 코드</span>
          <span class="detail-value">{{ city.id }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">미세먼지 (PM10)</span>
          <span class="detail-value">
            <template v-if="airLoading">조회 중...</template>
            <template v-else-if="airQuality?.pm10 != null">
              {{ airQuality.pm10 }}㎍/㎥ ({{ dustGrade }})
            </template>
            <template v-else>정보 없음</template>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">초미세먼지 (PM2.5)</span>
          <span class="detail-value">
            <template v-if="airLoading">조회 중...</template>
            <template v-else-if="airQuality?.pm2_5 != null">{{ airQuality.pm2_5 }}㎍/㎥</template>
            <template v-else>정보 없음</template>
          </span>
        </div>
      </div>

      <div v-if="city.temp !== null" class="nest-wrap">
        <MagpieNest size="large" :city="city" :dust-grade="dustGrade" />
      </div>
    </template>

    <template v-else>
      <p v-if="apiError" class="not-found">⚠️ 날씨 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      <p v-else-if="notFound" class="not-found">
        '{{ route.params.cityId }}' 도시 정보를 찾을 수 없습니다.
      </p>
    </template>

    <button class="back-btn" @click="goHome">← 메인 대시보드로 돌아가기</button>
  </div>
</template>

<style scoped>
.card-panel {
  position: relative;
  overflow: hidden;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  width: 100%;
  max-width: 640px;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 28px;
  font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  box-sizing: border-box;
}
.card-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--magpie-gradient);
}
.panel-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2ecc71;
  animation: live-pulse 1.8s infinite;
}
@keyframes live-pulse {
  0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.5); }
  70% { box-shadow: 0 0 0 7px rgba(46, 204, 113, 0); }
  100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
}
.loading {
  text-align: center;
  padding: 24px 0;
  color: var(--color-text);
  opacity: 0.7;
  font-size: 14px;
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.detail-item {
  background: var(--color-background-mute);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-label {
  font-size: 12px;
  color: var(--color-text);
  opacity: 0.7;
  font-weight: 600;
}
.detail-value {
  font-size: 18px;
  color: var(--color-heading);
  font-weight: 700;
}
.not-found {
  text-align: center;
  color: #c0392b;
  background: #fdecea;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 24px;
}
.nest-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}
.nest-wrap :deep(.magpie-nest) {
  max-width: 260px;
}
.back-btn {
  width: 100%;
  background: var(--magpie-gradient);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.back-btn:hover {
  filter: brightness(1.08);
}
</style>
