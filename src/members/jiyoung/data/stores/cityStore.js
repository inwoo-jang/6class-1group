import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const STORAGE_KEY = 'favorite-cities'

export const useCityStore = defineStore('city', () => {
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

  // localStorage에서 즐겨찾기 불러오기 (없으면 기존 8개 도시로 시작)
  const loadInitial = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
    return [
      { id: 'Jeju-KR', name: '제주', engName: 'Jeju', lat: 33.4996, lon: 126.5312 },
      { id: 'Gangneung-KR', name: '강릉', engName: 'Gangneung', lat: 37.7519, lon: 128.8761 },
      { id: 'Daejeon-KR', name: '대전', engName: 'Daejeon', lat: 36.3504, lon: 127.3845 },
      { id: 'Seoul-KR', name: '서울', engName: 'Seoul', lat: 37.5665, lon: 126.978 },
      { id: 'Busan-KR', name: '부산', engName: 'Busan', lat: 35.1796, lon: 129.0756 },
      { id: 'Incheon-KR', name: '인천', engName: 'Incheon', lat: 37.4563, lon: 126.7052 },
      { id: 'Gwangju-KR', name: '광주', engName: 'Gwangju', lat: 35.1595, lon: 126.8526 },
      { id: 'Jeonju-KR', name: '전주', engName: 'Jeonju', lat: 35.8242, lon: 127.148 },
    ]
  }

  const favoriteCities = ref(loadInitial())
  const isSearching = ref(false)
  const searchError = ref('')
  const selectedCityId = ref(null)

  const saveToStorage = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteCities.value))
  }

  // 🔍 지오코딩: 도시 이름 → 좌표(위도/경도) 찾기
  const searchCity = async (query) => {
    isSearching.value = true
    searchError.value = ''
    try {
      const response = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
        params: { q: query, limit: 5, appid: API_KEY },
      })
      return response.data // [{ name, lat, lon, country, local_names... }, ...]
    } catch (error) {
      console.error('도시 검색 실패:', error)
      searchError.value = '도시를 찾는 중 오류가 발생했습니다.'
      return []
    } finally {
      isSearching.value = false
    }
  }

  // ➕ 즐겨찾기에 도시 추가 (이미 있으면 무시)
  const addCity = (geoResult) => {
    const id = `${geoResult.name}-${geoResult.country}-${geoResult.lat}`
    const exists = favoriteCities.value.some((c) => c.id === id)
    if (exists) return

    favoriteCities.value.push({
      id,
      name: geoResult.local_names?.ko || geoResult.name,
      engName: geoResult.name,
      lat: geoResult.lat,
      lon: geoResult.lon,
    })
    saveToStorage()
  }

  // ➖ 즐겨찾기에서 제거
  const removeCity = (id) => {
    favoriteCities.value = favoriteCities.value.filter((c) => c.id !== id)
    saveToStorage()
  }

  const setSelectedCity = (id) => {
    selectedCityId.value = id
  }

  return {
    favoriteCities,
    isSearching,
    searchError,
    searchCity,
    addCity,
    removeCity,
    selectedCityId,
    setSelectedCity,
  }
})