import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 상세보기(WeatherDetailView)를 다녀와도 대시보드 상태가 유지되도록
// WeatherHomeView 컴포넌트 바깥(Pinia)에 둔다. 컴포넌트는 라우트 이동마다
// 마운트/언마운트되지만 스토어는 앱이 떠 있는 동안 그대로 남는다.
//
// 캐싱 정책: 날씨는 API 자체가 10분 안팎으로만 갱신되고(OpenWeatherMap 무료 티어 기준),
// 백그라운드 타이머로 몰래 새로고침하면 오히려 어색하다. 그래서 "다시 들어올 때"만
// 마지막 요청 후 TTL이 지났는지 체크하고, 안 지났으면 캐시를 그대로 쓴다.
const CACHE_TTL_MS = 10 * 60 * 1000

export const useDashboardStore = defineStore('youngwoo-dashboard', () => {
  // state — 국내/해외 목록. 국내↔해외를 왔다갔다해도 서로 캐시를 안 지우게
  // 지역별로 따로 들고 있는다 (하나만 두면 전환할 때마다 이전 지역 캐시가 덮어써짐).
  const region = ref('domestic')
  const weatherListByRegion = ref({ domestic: [], international: [] })
  const weatherListFetchedAt = ref({ domestic: 0, international: 0 })

  const weatherList = computed(() => weatherListByRegion.value[region.value] ?? [])

  // state — 검색/필터/선택
  const searchQuery = ref('')
  const statusFilter = ref('전체')
  const selectedCityInfo = ref('')
  const selectedCity = ref(null)
  const focusedCityId = ref(null)

  // state — 현재 위치
  const currentLocationCity = ref(null)
  const currentLocationPlaceName = ref('')
  const currentLocationFetchedAt = ref(0)

  // actions
  function setRegion(value) {
    region.value = value
  }

  function isWeatherListFresh(forRegion) {
    return (
      weatherListByRegion.value[forRegion].length > 0 &&
      Date.now() - weatherListFetchedAt.value[forRegion] < CACHE_TTL_MS
    )
  }

  function setWeatherList(list, forRegion) {
    weatherListByRegion.value[forRegion] = list
    weatherListFetchedAt.value[forRegion] = Date.now()
  }

  function isCurrentLocationFresh() {
    return (
      Boolean(currentLocationCity.value) &&
      Date.now() - currentLocationFetchedAt.value < CACHE_TTL_MS
    )
  }

  function setCurrentLocation(city, placeName) {
    currentLocationCity.value = city
    currentLocationPlaceName.value = placeName
    currentLocationFetchedAt.value = Date.now()
  }

  return {
    region,
    setRegion,
    weatherList,
    isWeatherListFresh,
    setWeatherList,
    searchQuery,
    statusFilter,
    selectedCityInfo,
    selectedCity,
    focusedCityId,
    currentLocationCity,
    currentLocationPlaceName,
    isCurrentLocationFresh,
    setCurrentLocation,
  }
})
