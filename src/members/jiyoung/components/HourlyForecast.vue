<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  lat: { type: Number, default: null },
  lon: { type: Number, default: null },
})

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const hourlyList = ref([])
const isLoading = ref(false)

const fetchHourly = async () => {
  if (props.lat === null) return
  isLoading.value = true
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: { lat: props.lat, lon: props.lon, appid: API_KEY, units: 'metric', lang: 'kr' },
    })
    hourlyList.value = response.data.list.slice(0, 6).map((item) => ({
      time: item.dt_txt.slice(11, 16),
      temp: Math.round(item.main.temp),
    }))
  } catch (error) {
    console.error('시간별예보 조회 실패:', error)
  } finally {
    isLoading.value = false
  }
}

watch(() => [props.lat, props.lon], fetchHourly, { immediate: true })

// 미니 그래프용 좌표 계산 (SVG viewBox 0~200 x 0~50 기준)
const graphPoints = computed(() => {
  if (hourlyList.value.length === 0) return ''
  const temps = hourlyList.value.map((h) => h.temp)
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  const range = max - min || 1

  return hourlyList.value
    .map((h, i) => {
      const x = (i / (hourlyList.value.length - 1)) * 200
      const y = 45 - ((h.temp - min) / range) * 35
      return `${x},${y}`
    })
    .join(' ')
})
</script>

<template>
  <div class="forecast-box">
    <p class="forecast-title">⏰ 오늘 시간별 예보</p>
    <el-skeleton v-if="isLoading" :rows="3" animated />
    <template v-else>
      <el-scrollbar height="80px">
        <div class="hourly-row">
          <div v-for="hour in hourlyList" :key="hour.time" class="hourly-item">
            <span class="hour-label">{{ hour.time }}</span>
            <span class="hour-temp">{{ hour.temp }}°</span>
          </div>
        </div>
      </el-scrollbar>

      <div class="graph-box">
        <svg viewBox="0 0 200 50" class="temp-graph" preserveAspectRatio="none">
          <polyline :points="graphPoints" fill="none" stroke="#a78bda" stroke-width="2" />
          <circle
            v-for="(h, i) in hourlyList"
            :key="'dot-' + h.time"
            :cx="(i / (hourlyList.length - 1)) * 200"
            :cy="45 - ((h.temp - Math.min(...hourlyList.map((x) => x.temp))) / ((Math.max(...hourlyList.map((x) => x.temp)) - Math.min(...hourlyList.map((x) => x.temp))) || 1)) * 35"
            r="2.5"
            fill="#6c4ab6"
          />
        </svg>
        <p class="graph-caption">기온 변화 추이</p>
      </div>
    </template>
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
.hourly-row {
  display: flex;
  gap: 16px;
}
.hourly-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #4b2e83;
  flex-shrink: 0;
}
.hour-label {
  color: #8a6fc7;
}
.hour-temp {
  font-weight: bold;
}
.graph-box {
  margin-top: 14px;
  border-top: 1px solid #f0eafa;
  padding-top: 10px;
}
.temp-graph {
  width: 100%;
  height: 50px;
}
.graph-caption {
  text-align: center;
  font-size: 11px;
  color: #b7a4e0;
  margin: 4px 0 0;
}
</style>