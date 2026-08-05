<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  lat: { type: Number, default: null },
  lon: { type: Number, default: null },
})

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const dailyList = ref([])
const isLoading = ref(false)

const fetchWeekly = async () => {
  if (props.lat === null) return
  isLoading.value = true
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: { lat: props.lat, lon: props.lon, appid: API_KEY, units: 'metric', lang: 'kr' },
    })
    // 3시간 간격 데이터 중, 매일 정오(12:00)에 가까운 것만 추려서 대표값으로 사용
    const noonEntries = response.data.list.filter((item) => item.dt_txt.includes('12:00:00'))
    dailyList.value = noonEntries.slice(0, 5).map((item) => ({
      date: item.dt_txt.slice(5, 10),
      temp: Math.round(item.main.temp),
      icon: item.weather[0].description,
    }))
  } catch (error) {
    console.error('주간예보 조회 실패:', error)
  } finally {
    isLoading.value = false
  }
}

watch(() => [props.lat, props.lon], fetchWeekly, { immediate: true })
</script>

<template>
  <div class="forecast-box">
    <p class="forecast-title">📅 주간 예보</p>
    <el-skeleton v-if="isLoading" :rows="5" animated />
    <ul v-else class="forecast-list">
      <li v-for="day in dailyList" :key="day.date">
        <span class="day-label">{{ day.date }}</span>
        <span>{{ day.temp }}°</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.forecast-box {
  background: white;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 14px;
  box-shadow: 0 4px 14px rgba(108, 74, 182, 0.08);
}
.forecast-title {
  color: #6c4ab6;
  font-weight: 700;
  margin: 0 0 12px;
}
.forecast-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.forecast-list li {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0eafa;
  font-size: 14px;
  color: #4b2e83;
}
.day-label {
  color: #8a6fc7;
}
</style>