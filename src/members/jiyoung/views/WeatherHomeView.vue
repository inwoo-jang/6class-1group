<script setup>
import { link } from '../routes'
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCityStore } from '../data/stores/cityStore'
import axios from 'axios'
import WeatherCard from '../components/practices/assignment/component/WeatherCard.vue'
import WeatherMascot from '../components/WeatherMascot.vue'
import KoreaMapMini from '../components/KoreaMapMini.vue'
import WeeklyForecast from '../components/WeeklyForecast.vue'
import HourlyForecast from '../components/HourlyForecast.vue'

const router = useRouter()
const cityStore = useCityStore()
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

// 날씨 목록(배열)은 API에서 통째로 재할당되므로 ref 유지
const weatherList = ref([])
const isLoading = ref(false)

// 서로 관련된 UI 상태값들을 하나의 reactive 객체로 묶음
// (통째로 재할당하지 않고, 속성 하나씩만 바뀌는 값들이라 reactive에 적합)
const uiState = reactive({
  searchQuery: '',
  newCityInput: '',
  selectedCityInfo: '카드를 클릭하거나 검색해 보세요.',
  selectedCityName: '',
  isAscending: true,
})

const toggleSort = () => {
  uiState.isAscending = !uiState.isAscending
}

const fetchFavoritesWeather = async () => {
  isLoading.value = true
  try {
    const requests = cityStore.favoriteCities.map((city) =>
      axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: { lat: city.lat, lon: city.lon, appid: API_KEY, units: 'metric', lang: 'kr' },
      }),
    )
    const responses = await Promise.all(requests)
    weatherList.value = responses.map((res, index) => ({
      id: cityStore.favoriteCities[index].id,
      name: cityStore.favoriteCities[index].name,
      temp: Math.round(res.data.main.temp),
      status: res.data.weather[0].description,
    }))
  } catch (error) {
    console.error('날씨 조회 실패:', error)
  } finally {
    isLoading.value = false
  }
}

fetchFavoritesWeather()

// el-autocomplete용 추천 함수
const handleAutocompleteQuery = async (queryString, callback) => {
  if (!queryString) {
    callback([])
    return
  }
  const results = await cityStore.searchCity(queryString)
  callback(results.map((r) => ({ value: `${r.local_names?.ko || r.name} (${r.country})`, raw: r })))
}

const handleSelectAutocomplete = async (item) => {
  cityStore.addCity(item.raw)
  uiState.newCityInput = ''
  await fetchFavoritesWeather()
}

const handleRemoveCity = async (id) => {
  cityStore.removeCity(id)
  await fetchFavoritesWeather()
}

// 정렬 + 검색 + 선택된 도시를 맨 위로 고정
const filteredWeatherList = computed(() => {
  const base = weatherList.value.filter((city) => city.name.includes(uiState.searchQuery))
  const sorted = [...base].sort((a, b) =>
    uiState.isAscending ? a.temp - b.temp : b.temp - a.temp,
  )

  if (uiState.selectedCityName) {
    const selectedIndex = sorted.findIndex((c) => c.name === uiState.selectedCityName)
    if (selectedIndex > -1) {
      const [selectedCity] = sorted.splice(selectedIndex, 1)
      sorted.unshift(selectedCity)
    }
  }

  return sorted
})

// "선택하기" 버튼 클릭 시 실행
const handleSelectCard = (cityName) => {
  const found = weatherList.value.find((c) => c.name === cityName)
  if (!found) return

  uiState.selectedCityInfo = `[${cityName}] 이(가) 선택되었습니다.`
  uiState.selectedCityName = cityName
  cityStore.setSelectedCity(found.id)
}

const handleClickDetail = (city) => {
  router.push(link('detail', { cityId: city.id }))
}

const mascotTarget = computed(() => {
  const found = weatherList.value.find((c) => c.name === uiState.selectedCityName)
  return found || weatherList.value[0] || { status: '', temp: 20 }
})

// 오른쪽 사이드바 기준 도시: 선택된 도시 → 없으면 서울 → 없으면 즐겨찾기 첫 번째
const selectedCityDisplay = computed(() => {
  const found = cityStore.favoriteCities.find((c) => c.name === uiState.selectedCityName)
  if (found) return found
  return (
    cityStore.favoriteCities.find((c) => c.name === '서울') ||
    cityStore.favoriteCities[0] || { name: '', lat: null, lon: null }
  )
})

// 현재 날짜/시간 (1분마다 갱신)
const now = ref(new Date())
let timer = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 60 * 1000)
})
onUnmounted(() => {
  clearInterval(timer)
})

const formattedDate = computed(() => {
  const y = now.value.getFullYear()
  const m = now.value.getMonth() + 1
  const d = now.value.getDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const w = weekdays[now.value.getDay()]
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${w})`
})

const formattedTime = computed(() => {
  const h = String(now.value.getHours()).padStart(2, '0')
  const min = String(now.value.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
})
</script>

<template>
  <div class="page-layout">
    <!-- 왼쪽 사이드바 -->
    <div class="sidebar">
      <p class="selected-city-badge">
        <span v-if="uiState.selectedCityName">✅ {{ uiState.selectedCityName }} 선택 중</span>
        <span v-else>📍 도시를 선택해보세요</span>
      </p>
      <WeatherMascot :status="mascotTarget.status" :temp="mascotTarget.temp" />
      <KoreaMapMini :selected-city-name="uiState.selectedCityName" />
    </div>

    <!-- 메인 -->
    <div class="weather-parent">
      <h2>오늘의 날씨보드</h2>

      <div class="add-city-box">
        <el-autocomplete
          v-model="uiState.newCityInput"
          class="autocomplete-input"
          placeholder="새 도시 검색 (예: Tokyo, Paris, 대구)"
          :fetch-suggestions="handleAutocompleteQuery"
          @select="handleSelectAutocomplete"
        />
      </div>

      <div class="search-box">
        <input v-model="uiState.searchQuery" placeholder="즐겨찾기 안에서 검색" />
      </div>

      <div class="sort-toggle">
        <button @click="toggleSort">
          🌡️ 온도 {{ uiState.isAscending ? '낮은순' : '높은순' }} 정렬 중 (클릭해서 전환)
        </button>
      </div>

      <el-scrollbar height="560px" v-loading="isLoading">
        <template v-if="filteredWeatherList.length > 0">
          <WeatherCard
            v-for="city in filteredWeatherList"
            :key="city.id"
            :city="city"
            @select-card="handleSelectCard"
            @click-detail="handleClickDetail"
            @remove-city="handleRemoveCity"
          />
        </template>
        <el-empty v-else description="등록된 도시가 없습니다. 위에서 새 도시를 추가해보세요." />
      </el-scrollbar>

      <div class="status-bar">{{ uiState.selectedCityInfo }}</div>
    </div>

    <!-- 오른쪽 사이드바 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <p class="sidebar-city-label">
          <span v-if="uiState.selectedCityName">✅ {{ selectedCityDisplay.name }} 선택됨</span>
          <span v-else>📍 {{ selectedCityDisplay.name }} (기본값)</span>
        </p>
        <p class="sidebar-datetime">{{ formattedDate }} · {{ formattedTime }}</p>
      </div>
      <HourlyForecast :lat="selectedCityDisplay.lat" :lon="selectedCityDisplay.lon" />
      <WeeklyForecast :lat="selectedCityDisplay.lat" :lon="selectedCityDisplay.lon" />
    </div>
  </div>
</template>

<style scoped>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

.page-layout {
  display: flex;
  gap: 20px;
  max-width: 1180px;
  margin: 0 auto;
  align-items: flex-start;
  justify-content: center;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 20px;
}
.weather-parent {
  width: 480px;
  flex-shrink: 0;
  padding: 28px;
  background: linear-gradient(160deg, #f3eefc 0%, #eaf7f3 100%);
  border-radius: 28px;
}
.sidebar {
  width: 240px;
  flex-shrink: 0;
}
.selected-city-badge {
  text-align: center;
  background: #ede4fb;
  color: #6c4ab6;
  font-weight: 700;
  font-size: 13px;
  padding: 8px;
  border-radius: 999px;
  margin-bottom: 12px;
}
.sidebar-header {
  text-align: center;
  margin-bottom: 10px;
}
.sidebar-city-label {
  color: #6c4ab6;
  font-weight: 700;
  font-size: 13px;
  margin: 0 0 4px;
}
.sidebar-datetime {
  color: #b7a4e0;
  font-size: 12px;
  margin: 0;
}
h2 {
  text-align: center;
  color: #6c4ab6;
  font-weight: 800;
  font-size: 24px;
  margin-bottom: 20px;
}
.add-city-box {
  margin-bottom: 12px;
}
.autocomplete-input {
  width: 100%;
}
.search-box {
  margin-bottom: 12px;
}
.search-box input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2d6f7;
  border-radius: 14px;
  box-sizing: border-box;
}
.sort-toggle {
  text-align: center;
  margin-bottom: 14px;
}
.sort-toggle button {
  border: none;
  background: #ede4fb;
  color: #6c4ab6;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
}
.status-bar {
  margin-top: 12px;
  padding: 14px;
  background: #e4d9f7;
  color: #4b2e83;
  border-radius: 16px;
  text-align: center;
  font-weight: bold;
}
/* 모바일 반응형: 화면 폭이 900px 이하면 세로로 쌓기 */
@media (max-width: 900px) {
  .page-layout {
    flex-direction: column;
    align-items: center;
    padding: 12px;
  }
  .weather-parent {
    width: 100%;
    max-width: 480px;
  }
  .sidebar {
    width: 100%;
    max-width: 480px;
  }
}
</style>