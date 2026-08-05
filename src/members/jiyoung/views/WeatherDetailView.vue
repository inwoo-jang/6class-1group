<script setup>
import { link } from '../routes'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfigStore } from '../data/stores/configStore'
import { useCityStore } from '../data/stores/cityStore'
import { getWeatherTheme } from '../data/utils/weatherTheme'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const cityStore = useCityStore()
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

const cityDetail = ref(null)
const isLoading = ref(true)

onMounted(async () => {
  const cityId = route.params.cityId
  const target = cityStore.favoriteCities.find((c) => c.id === cityId)
  if (!target) {
    isLoading.value = false
    return
  }

  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat: target.lat, lon: target.lon, appid: API_KEY, units: 'metric', lang: 'kr' },
    })
    cityDetail.value = {
      name: target.name,
      temp: Math.round(response.data.main.temp),
      status: response.data.weather[0].description,
    }
  } catch (error) {
    console.error('상세 날씨 API 호출 실패:', error)
  } finally {
    isLoading.value = false
  }
})

const displayTemp = computed(() => {
  if (!cityDetail.value) return null
  const rawTemp = cityDetail.value.temp
  return configStore.unit === 'fahrenheit' ? Math.round((rawTemp * 9) / 5 + 32) : rawTemp
})

const weatherTheme = computed(() => {
  if (!cityDetail.value) return { gradient: '#fff', icon: '' }
  return getWeatherTheme(cityDetail.value.status, cityDetail.value.temp)
})

const advisoryMessage = computed(() => {
  if (!cityDetail.value) return null
  const { status, temp } = cityDetail.value
  if (status.includes('비')) return '🌂 비가 오니 우산을 챙기세요.'
  if (status.includes('눈')) return '❄️ 눈길 미끄러움 주의, 든든히 챙겨입고 나가세요.'
  if (temp >= 33) return '🥵 폭염주의보: 노약자는 외출을 자제하고 수분 섭취에 유념하세요.'
  if (temp >= 28) return '☀️ 더운 날씨입니다. 자외선 차단제를 챙기세요.'
  if (temp <= 0) return '🥶 한파주의보: 방한용품을 단단히 챙기세요.'
  if (temp <= 5) return '🧣 쌀쌀한 날씨입니다. 겉옷을 챙기세요.'
  return '🙂 오늘은 야외 활동하기 좋은 날씨예요.'
})
</script>

<template>
  <div class="detail-wrapper" v-loading="isLoading">
    <div v-if="cityDetail" class="detail-card" :style="{ background: weatherTheme.gradient }">
      <div class="detail-icon">{{ weatherTheme.icon }}</div>
      <h2>{{ cityDetail.name }}</h2>
      <p class="temp">{{ displayTemp }}{{ configStore.unitSymbol }}</p>
      <el-tag effect="dark" round class="status-tag">{{ cityDetail.status }}</el-tag>

      <div class="advisory-box">{{ advisoryMessage }}</div>
    </div>
    <el-empty v-else-if="!isLoading" description="해당 도시 정보를 찾을 수 없습니다." />

    <button class="back-btn" @click="router.push(link('home'))">메인으로 돌아가기</button>
  </div>
</template>

<style scoped>
.detail-wrapper {
  max-width: 420px;
  margin: 40px auto;
  min-height: 200px;
}
.detail-card {
  padding: 32px 24px;
  border-radius: 24px;
  text-align: center;
  color: white;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}
.detail-icon {
  font-size: 56px;
}
.detail-card h2 {
  margin: 4px 0;
}
.temp {
  font-size: 44px;
  font-weight: 800;
  margin: 4px 0;
}
.status-tag {
  border: none;
  background: rgba(255, 255, 255, 0.25) !important;
  color: white !important;
}
.advisory-box {
  margin-top: 18px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  color: #b45309;
  font-weight: 600;
  font-size: 14px;
}
.back-btn {
  margin-top: 20px;
  padding: 10px 20px;
  border: none;
  border-radius: 999px;
  background: #6c4ab6;
  color: white;
  font-weight: bold;
  cursor: pointer;
}
</style>