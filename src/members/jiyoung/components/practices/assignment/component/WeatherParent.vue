<script setup>
import { ref, computed } from 'vue'
import BaseDashboardCard from './BaseDashboardCard.vue'
import SearchBar from './SearchBar.vue'
import WeatherCard from './WeatherCard.vue'

// 모든 반응형 데이터는 이 부모 컴포넌트가 유지
const weatherList = ref([
  { id: 'city_01', name: '제주', temp: 27, status: '맑음' },
  { id: 'city_02', name: '강릉', temp: 22, status: '흐림' },
  { id: 'city_03', name: '대전', temp: 29, status: '맑음' },
  { id: 'city_04', name: '서울', temp: 24, status: '비' },
  { id: 'city_05', name: '부산', temp: 26, status: '구름' },
])

const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

// 추가 기능: 온도 정렬 토글 (오름차순 / 내림차순)
const isAscending = ref(true)
const toggleSort = () => {
  isAscending.value = !isAscending.value
}

const filteredWeatherList = computed(() => {
  const base = weatherList.value.filter((city) =>
    city.name.includes(searchQuery.value),
  )
  return [...base].sort((a, b) =>
    isAscending.value ? a.temp - b.temp : b.temp - a.temp,
  )
})

// SearchBar가 emit한 update-query 이벤트 수신
const handleUpdateQuery = (newQuery) => {
  searchQuery.value = newQuery
}

// WeatherCard가 emit한 select-card 이벤트 수신
const handleSelectCard = (cityName) => {
  selectedCityInfo.value = `[${cityName}] 이(가) 선택되었습니다.`
}

// WeatherCard가 emit한 click-detail 이벤트 수신
const handleClickDetail = (city) => {
  window.alert(`${city.name} 지역 현재 날씨: ${city.status}, ${city.temp}°C`)
}
</script>

<template>
  <div class="weather-parent">
    <h2>💜 오늘의 날씨 대시보드 (Component 분리)</h2>

    <!-- BaseDashboardCard의 slot 안에 SearchBar를 주입 -->
    <BaseDashboardCard icon="🔍" title="도시 검색">
      <SearchBar :search-query="searchQuery" @update-query="handleUpdateQuery" />
    </BaseDashboardCard>

    <!-- 추가 기능: 정렬 토글 버튼 -->
    <div class="sort-toggle">
      <button @click="toggleSort">
        🌡️ 온도 {{ isAscending ? '낮은순' : '높은순' }} 정렬 중 (클릭해서 전환)
      </button>
    </div>

    <!-- BaseDashboardCard의 slot 안에 WeatherCard 목록을 주입 -->
    <BaseDashboardCard icon="📍" title="지역별 날씨 현황">
      <template v-if="filteredWeatherList.length > 0">
        <WeatherCard
          v-for="city in filteredWeatherList"
          :key="city.id"
          :city="city"
          @select-card="handleSelectCard"
          @click-detail="handleClickDetail"
        />
      </template>
      <p v-else class="no-result">🔍 일치하는 도시가 없습니다.</p>
    </BaseDashboardCard>

    <div class="status-bar">{{ selectedCityInfo }}</div>
  </div>
</template>

<style scoped>
.weather-parent {
  max-width: 580px;
  margin: 0 auto;
  padding: 28px;
  background: linear-gradient(160deg, #f3eefc 0%, #eaf7f3 100%);
  border-radius: 28px;
  font-family: 'Pretendard', sans-serif;
}
h2 {
  text-align: center;
  color: #6c4ab6;
  margin-bottom: 20px;
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
.sort-toggle button:hover {
  background: #ddc9f7;
}
.no-result {
  text-align: center;
  padding: 24px;
  color: #a38fc7;
  font-weight: bold;
}
.status-bar {
  margin-top: 8px;
  padding: 14px;
  background: #e4d9f7;
  color: #4b2e83;
  border-radius: 16px;
  text-align: center;
  font-weight: bold;
}
</style>