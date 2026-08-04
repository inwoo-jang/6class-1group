// Home ↔ Detail 뷰가 같은 도시 목록(+ OpenWeatherMap 실시간 날씨)을 공유하기 위한
// 모듈 스코프 싱글턴 상태.
import { ref } from 'vue'
import { WEATHER_ROUTER_DEFAULT_CITIES } from '../data/weatherRouterCities'
import { fetchOpenWeatherByCoords } from './useOpenWeatherApi'

// localStorage 키는 다른 조원 폴더와 충돌하지 않도록 'jh-weather'로 네임스페이싱했습니다.
const CUSTOM_KEY = 'jh-weather:custom-cities'
const REMOVED_KEY = 'jh-weather:removed-default-cities'

function loadJson(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage를 쓸 수 없는 환경(프라이빗 모드 등)에서는 조용히 무시
  }
}

const cities = ref([])
const loading = ref(false)
const loaded = ref(false)
const error = ref(false)
const removedDefaultIds = ref(loadJson(REMOVED_KEY))

async function fetchWeatherForCities(targets) {
  const results = await Promise.allSettled(
    targets.map((city) => fetchOpenWeatherByCoords(city.lat, city.lon)),
  )

  return targets.map((city, index) => {
    const result = results[index]
    if (result.status === 'fulfilled') {
      return { ...city, ...result.value, error: false }
    }
    return { ...city, temp: null, status: '알 수 없음', error: true }
  })
}

async function loadCities() {
  if (loaded.value || loading.value) return
  loading.value = true
  try {
    const removedIds = removedDefaultIds.value
    const activeDefaults = WEATHER_ROUTER_DEFAULT_CITIES.filter((c) => !removedIds.includes(c.id))
    const customMetas = loadJson(CUSTOM_KEY)
    const targets = [...activeDefaults, ...customMetas]
    const result = await fetchWeatherForCities(targets)

    cities.value = result.map((city, index) => ({
      ...city,
      custom: index >= activeDefaults.length,
    }))
    error.value = targets.length > 0 && cities.value.every((c) => c.error)
  } catch {
    error.value = true
  } finally {
    loading.value = false
    loaded.value = true
  }
}

async function addCity(meta) {
  if (cities.value.some((c) => c.id === meta.id)) {
    throw new Error('이미 추가된 도시입니다.')
  }
  const weather = await fetchOpenWeatherByCoords(meta.lat, meta.lon)
  cities.value.push({ ...meta, ...weather, error: false, custom: true })

  const metas = loadJson(CUSTOM_KEY)
  metas.push(meta)
  saveJson(CUSTOM_KEY, metas)
}

function removeCity(id) {
  cities.value = cities.value.filter((c) => c.id !== id)

  if (WEATHER_ROUTER_DEFAULT_CITIES.some((c) => c.id === id)) {
    if (!removedDefaultIds.value.includes(id)) {
      removedDefaultIds.value = [...removedDefaultIds.value, id]
      saveJson(REMOVED_KEY, removedDefaultIds.value)
    }
  } else {
    saveJson(
      CUSTOM_KEY,
      loadJson(CUSTOM_KEY).filter((m) => m.id !== id),
    )
  }
}

async function restoreDefaultCities() {
  removedDefaultIds.value = []
  saveJson(REMOVED_KEY, [])
  loaded.value = false
  await loadCities()
}

export function useOpenWeatherCities() {
  return {
    cities,
    loading,
    loaded,
    error,
    removedDefaultIds,
    loadCities,
    addCity,
    removeCity,
    restoreDefaultCities,
  }
}
