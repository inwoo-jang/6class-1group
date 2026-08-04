<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../stores/dashboardStore'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import SearchBar from '../components/SearchBar.vue'
import WeatherCard from '../components/WeatherCard.vue'
import WeatherMap from '../components/WeatherMap.vue'
import WeatherEffect from '../components/WeatherEffect.vue'
import WeatherThermometer from '../components/WeatherThermometer.vue'
import { KOREA_CITIES } from '../utils/koreaCities'
import { WORLD_CITIES } from '../utils/worldCities'
import { fetchWeatherForCities, getWeatherErrorMessage } from '../utils/fetchWeather'
import { reverseGeocode } from '../utils/fetchWeatherExtras'
import { useDisplayTemp } from '../composables/useDisplayTemp'
import { withSubjectParticle } from '../utils/korean'
import { link } from '../routes'

const router = useRouter()
const dashboardStore = useDashboardStore()

const {
  region,
  weatherList,
  searchQuery,
  statusFilter,
  selectedCityInfo,
  selectedCity,
  focusedCityId,
  currentLocationCity,
  currentLocationPlaceName,
} = storeToRefs(dashboardStore)

const isLoading = ref(false)
const errorMessage = ref('')

const currentLocationLoading = ref(false)
const currentLocationError = ref('')
// WeatherCard의 더움/선선함 판정과 동일하게 표시 단위와 무관하게 원본(섭씨) 값 기준으로 유지한다.
const currentLocationIsWarm = computed(() => (currentLocationCity.value?.temp ?? 0) >= 25)
const { unitSymbol: currentLocationUnitSymbol, displayTemp: currentLocationDisplayTemp } =
  useDisplayTemp(() => currentLocationCity.value?.temp)

const activeCities = computed(() => (region.value === 'domestic' ? KOREA_CITIES : WORLD_CITIES))

// 콤마로 여러 도시명을 한 번에 검색할 수 있게 한다 ("서울, 부산" -> 서울 또는 부산 매칭).
// weatherList 자체가 이미 다 불러와 있는 목록(국내 22개/해외 14개)이라 API 재호출 없이
// 메모리 안에서 필터만 확장하는 거라 추가 비용은 없다.
const searchTerms = computed(() =>
  searchQuery.value
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean),
)

// 검색어까지만 반영한 목록. 상태 필터 칩의 선택지를 여기서 뽑아서
// "지금 검색된 도시들 중에 실제로 존재하는 상태"만 칩으로 보여준다.
const searchedWeatherList = computed(() =>
  weatherList.value.filter(
    (item) =>
      searchTerms.value.length === 0 ||
      searchTerms.value.some((term) => item.name.includes(term)),
  ),
)

const statusOptions = computed(() => [
  '전체',
  ...new Set(searchedWeatherList.value.map((item) => item.status)),
])

const filteredWeatherList = computed(() =>
  searchedWeatherList.value.filter(
    (item) => statusFilter.value === '전체' || item.status === statusFilter.value,
  ),
)

// 검색어가 바뀌어서 지금 선택된 상태 칩이 더 이상 후보에 없으면(예: "비" 선택 중
// "서울"(맑음)을 검색), 칩이 안 보이는데 필터는 걸려 있어 결과가 0개로 보이는
// 함정을 막기 위해 전체로 되돌린다.
watch(statusOptions, (options) => {
  if (!options.includes(statusFilter.value)) {
    statusFilter.value = '전체'
  }
})

// 캐시가 아직 안 지났으면 WeatherMap한테 넘겨서 geolocation을 다시 안 묻고
// 마커만 조용히 복원하게 한다. 지났으면 null을 넘겨서 진짜로 다시 찾게 한다.
const cachedCurrentLocation = computed(() =>
  dashboardStore.isCurrentLocationFresh() ? currentLocationCity.value : null,
)

// 상세보기를 다녀오는 정도의 재진입에서는 굳이 다시 안 부르고 캐시를 그대로 쓴다.
// (10분 TTL — dashboardStore 참고. 백그라운드 자동 새로고침은 안 하고, 재진입 시점에만 체크한다.)
async function fetchWeatherList({ force = false } = {}) {
  if (!force && dashboardStore.isWeatherListFresh(region.value)) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await fetchWeatherForCities(activeCities.value)
    dashboardStore.setWeatherList(result, region.value)
  } catch (error) {
    errorMessage.value = getWeatherErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

function onUpdateQuery(value) {
  searchQuery.value = value
}

function onUpdateRegion(value) {
  if (region.value === value) return
  region.value = value
  searchQuery.value = ''
  statusFilter.value = '전체'
  focusedCityId.value = null
  selectedCity.value = null
  fetchWeatherList()
}

function onUpdateStatus(status) {
  statusFilter.value = status
}

function onSearchEnter() {
  if (filteredWeatherList.value.length === 1) {
    selectCity(filteredWeatherList.value[0].id)
  }
}

function selectCity(cityId) {
  const city = weatherList.value.find((item) => item.id === cityId)
  if (!city) return
  selectedCityInfo.value = `${withSubjectParticle(city.name)} 선택되었습니다.`
  focusedCityId.value = cityId
  selectedCity.value = city
}

function goToDetail(cityId) {
  router.push(link('detail', { cityId }))
}

async function onLocate({ lat, lon }) {
  currentLocationLoading.value = true
  currentLocationError.value = ''

  const [weatherResult, placeResult] = await Promise.allSettled([
    fetchWeatherForCities([{ id: 'current-location', name: '현재 위치', lat, lon }]),
    reverseGeocode({ lat, lon }),
  ])

  if (weatherResult.status === 'fulfilled') {
    // 지명은 부가 정보라 실패해도 날씨 표시엔 영향 없이 그냥 city.name("현재 위치")으로 남는다.
    const placeName = placeResult.status === 'fulfilled' ? placeResult.value : ''
    dashboardStore.setCurrentLocation(weatherResult.value[0], placeName)
    // 현위치 버튼을 누른 건 "내 위치를 보고 싶다"는 명시적 의도라, 이전에 선택돼 있던
    // 다른 카드 포커스를 그대로 두지 않고 현재 위치로 선택 상태를 넘긴다.
    selectCurrentLocation()
  } else {
    currentLocationError.value = getWeatherErrorMessage(weatherResult.reason)
  }

  currentLocationLoading.value = false
}

function selectCurrentLocation() {
  if (!currentLocationCity.value) return
  const label = currentLocationPlaceName.value || currentLocationCity.value.name
  selectedCityInfo.value = `${withSubjectParticle(label)} 선택되었습니다.`
  focusedCityId.value = 'current-location'
  selectedCity.value = currentLocationCity.value
}

function goToCurrentLocationDetail() {
  if (!currentLocationCity.value) return
  router.push(
    link(
      'detail',
      { cityId: 'current-location' },
      {
        lat: currentLocationCity.value.lat,
        lon: currentLocationCity.value.lon,
        name: currentLocationPlaceName.value || currentLocationCity.value.name,
      },
    ),
  )
}

watch(selectedCityInfo, (newValue) => {
  console.log('[watch 감지] 상태바 문구가 업데이트되었습니다 ->', newValue)
})

watchEffect(() => {
  console.log('[watchEffect 자동 호출] 현재 검색어:', searchQuery.value)
})

onMounted(fetchWeatherList)
</script>

<template>
  <div class="weather-dashboard">
    <WeatherEffect :status="selectedCity?.status ?? null" />

    <div class="weather-dashboard__layout">
      <div class="weather-dashboard__main">
        <BaseDashboardCard icon="fa-solid fa-magnifying-glass" title="도시 검색">
          <SearchBar
            :search-query="searchQuery"
            :status-filter="statusFilter"
            :status-options="statusOptions"
            :region="region"
            @update-query="onUpdateQuery"
            @update-status="onUpdateStatus"
            @update-region="onUpdateRegion"
            @search-enter="onSearchEnter"
          />
        </BaseDashboardCard>

        <BaseDashboardCard
          icon="fa-solid fa-cloud-sun"
          :title="region === 'domestic' ? '국내 날씨 현황' : '해외 날씨 현황'"
        >
          <p v-if="isLoading" class="weather-dashboard__empty">
            <i class="fa-solid fa-spinner fa-spin"></i> 날씨 정보를 불러오는 중입니다...
          </p>
          <p v-else-if="errorMessage" class="weather-dashboard__error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMessage }}
          </p>
          <ul v-else-if="filteredWeatherList.length > 0" class="weather-dashboard__list">
            <WeatherCard
              v-for="item in filteredWeatherList"
              :key="item.id"
              :city="item"
              :is-focused="item.id === focusedCityId"
              @select-card="selectCity"
              @click-detail="goToDetail"
            />
          </ul>
          <p v-else class="weather-dashboard__empty">검색 결과가 일치하는 도시가 없습니다.</p>
        </BaseDashboardCard>
      </div>

      <div class="weather-dashboard__side">
        <BaseDashboardCard
          icon="fa-solid fa-map-location-dot"
          :title="region === 'domestic' ? '국내 지도' : '해외 지도'"
        >
          <template v-if="selectedCityInfo" #title-extra>
            <span class="weather-dashboard__map-status">{{ selectedCityInfo }}</span>
          </template>

          <div class="weather-dashboard__map-row">
            <div class="weather-dashboard__map-wrap">
              <WeatherMap
                :cities="filteredWeatherList"
                :all-cities="weatherList"
                :focused-city-id="focusedCityId"
                :region="region"
                :current-location="cachedCurrentLocation"
                @select-city="selectCity"
                @locate="onLocate"
                @view-detail="goToDetail"
              />
            </div>
            <WeatherThermometer :temp="selectedCity?.temp ?? null" />
          </div>
        </BaseDashboardCard>

        <BaseDashboardCard icon="fa-solid fa-location-crosshairs" title="현재 위치 날씨">
          <template v-if="currentLocationCity" #title-extra>
            <button
              type="button"
              class="current-location__detail-btn"
              @click="goToCurrentLocationDetail"
            >
              <i class="fa-solid fa-circle-info"></i> 상세보기
            </button>
          </template>

          <p v-if="currentLocationLoading" class="weather-dashboard__empty">
            <i class="fa-solid fa-spinner fa-spin"></i> 현재 위치 날씨를 불러오는 중입니다...
          </p>
          <p v-else-if="currentLocationError" class="weather-dashboard__error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ currentLocationError }}
          </p>
          <div
            v-else-if="currentLocationCity"
            class="current-location"
            :class="{ 'is-focused': selectedCity?.id === 'current-location' }"
            @click="selectCurrentLocation"
          >
            <i class="current-location__icon fa-solid" :class="currentLocationCity.icon"></i>
            <div class="current-location__info">
              <p class="current-location__place">
                {{ currentLocationPlaceName || currentLocationCity.name }}
              </p>
              <p class="current-location__status">{{ currentLocationCity.status }}</p>
            </div>
            <p
              class="current-location__temp"
              :class="currentLocationIsWarm ? 'is-warm' : 'is-cool'"
            >
              {{ currentLocationDisplayTemp }}{{ currentLocationUnitSymbol }}
            </p>
          </div>
          <p v-else class="weather-dashboard__empty">
            <i class="fa-solid fa-spinner fa-spin"></i> 위치 정보를 확인하는 중입니다...
          </p>
        </BaseDashboardCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weather-dashboard {
  max-width: 1080px;
  margin: 12px auto 32px;
  padding: 0 16px;
}

.weather-dashboard__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

@media (min-width: 860px) {
  .weather-dashboard__layout {
    grid-template-columns: minmax(0, 1fr) 440px;
    align-items: start;
  }

  .weather-dashboard__side {
    position: sticky;
    top: calc(var(--nav-height) + 24px);
  }
}

.weather-dashboard__map-row {
  display: flex;
  align-items: stretch;
  height: 360px;
  gap: 12px;
}

.weather-dashboard__map-wrap {
  flex: 1;
  min-width: 0;
}

/* 카드 5줄(2열이라 카드 10장) 높이만큼만 보이고 그 아래는 스크롤.
   카드 한 장 높이(padding 16*2 + header 37) 69px * 5줄 + 줄 사이 gap 12px * 4 = 393px. */
.weather-dashboard__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  max-height: 393px;
  margin: 0;
  padding: 0 10px 0 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color-default) transparent;
}

.weather-dashboard__list::-webkit-scrollbar {
  width: 6px;
}

.weather-dashboard__list::-webkit-scrollbar-track {
  background: transparent;
}

.weather-dashboard__list::-webkit-scrollbar-thumb {
  background: var(--border-color-default);
  border-radius: 999px;
}

.weather-dashboard__list::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-darker);
}

.weather-dashboard__empty {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--color-text-light);
  text-align: center;
}

.weather-dashboard__error {
  margin: 4px 0 0;
  padding: 10px 16px;
  border-radius: var(--border-radius-medium);
  background: var(--color-error-bg);
  color: var(--color-error);
  font-size: 14px;
  text-align: center;
}

.current-location {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.current-location:hover {
  border-color: var(--color-primary-darker);
}

.current-location.is-focused {
  border-color: var(--color-primary-darker);
  border-width: 2px;
  box-shadow: 0 0 0 2px var(--color-primary-opacity-30);
}

.current-location__icon {
  font-size: 22px;
  color: var(--color-primary-darker);
  flex-shrink: 0;
}

.current-location__info {
  flex: 1;
  min-width: 0;
}

.current-location__place {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-location__status {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.current-location__temp {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  flex-shrink: 0;
}

.current-location__temp.is-warm {
  color: var(--color-warm);
}

.current-location__temp.is-cool {
  color: var(--color-info);
}

.current-location__detail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 5px 10px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-small);
  background: var(--color-card-background);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.current-location__detail-btn:hover {
  background: var(--color-primary-darker);
  border-color: var(--color-primary-darker);
  color: #ffffff;
}

.weather-dashboard__map-status {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--color-success-bg);
  color: var(--color-success);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
</style>
