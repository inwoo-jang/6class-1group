<script setup>
import { ref, onMounted } from 'vue'
import { useCityStore } from '../data/stores/cityStore'
import axios from 'axios'

const cityStore = useCityStore()
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

const cityWeather = ref(null)
const isLoading = ref(true)
const recommendedMenu = ref(null)

// 음식별 이모지 + 카드 색상 테마
const foodMeta = {
  // 국물/따뜻한 계열
  '부침개': { emoji: '🥞', gradient: 'linear-gradient(135deg, #f6d365, #fda085)' },
  '파전': { emoji: '🥞', gradient: 'linear-gradient(135deg, #f6d365, #fda085)' },
  '해물파전': { emoji: '🦑', gradient: 'linear-gradient(135deg, #f6d365, #fda085)' },
  '라면': { emoji: '🍜', gradient: 'linear-gradient(135deg, #ff9a56, #ff6a88)' },
  '칼국수': { emoji: '🍜', gradient: 'linear-gradient(135deg, #ff9a56, #ff6a88)' },
  '해물칼국수': { emoji: '🦐', gradient: 'linear-gradient(135deg, #ff9a56, #ff6a88)' },
  '수제비': { emoji: '🍲', gradient: 'linear-gradient(135deg, #f7b733, #fc4a1a)' },
  '짬뽕': { emoji: '🍥', gradient: 'linear-gradient(135deg, #eb3349, #f45c43)' },
  '짜장면': { emoji: '🍝', gradient: 'linear-gradient(135deg, #8e2de2, #4a00e0)' },
  '국밥': { emoji: '🍚', gradient: 'linear-gradient(135deg, #d38312, #a83279)' },
  '부대찌개': { emoji: '🍲', gradient: 'linear-gradient(135deg, #eb3349, #f45c43)' },
  '떡볶이': { emoji: '🌶️', gradient: 'linear-gradient(135deg, #ff416c, #ff4b2b)' },
  '차돌박이전골': { emoji: '🥩', gradient: 'linear-gradient(135deg, #614385, #516395)' },
  '어묵탕': { emoji: '🍢', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
  '전골': { emoji: '🍲', gradient: 'linear-gradient(135deg, #eb3349, #f45c43)' },
  '보쌈': { emoji: '🥓', gradient: 'linear-gradient(135deg, #eacda3, #d6ae7b)' },
  '삼겹살': { emoji: '🥓', gradient: 'linear-gradient(135deg, #eacda3, #d6ae7b)' },
  '김치찌개': { emoji: '🍲', gradient: 'linear-gradient(135deg, #eb3349, #f45c43)' },
  '된장찌개': { emoji: '🍲', gradient: 'linear-gradient(135deg, #b79891, #94716b)' },
  '샤브샤브': { emoji: '🍲', gradient: 'linear-gradient(135deg, #56ab2f, #a8e063)' },

  // 겨울 간식
  '호떡': { emoji: '🥮', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
  '군고구마': { emoji: '🍠', gradient: 'linear-gradient(135deg, #8e2de2, #4a00e0)' },
  '붕어빵': { emoji: '🐟', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
  '어묵': { emoji: '🍢', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
  '왕만두': { emoji: '🥟', gradient: 'linear-gradient(135deg, #ffb347, #ffcc33)' },

  // 시원한 계열 (더울 때)
  '냉면': { emoji: '🍜', gradient: 'linear-gradient(135deg, #56ccf2, #2f80ed)' },
  '콩국수': { emoji: '🥛', gradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' },
  '열무비빔국수': { emoji: '🥬', gradient: 'linear-gradient(135deg, #56ab2f, #a8e063)' },
  '중화냉면': { emoji: '🍜', gradient: 'linear-gradient(135deg, #56ccf2, #2f80ed)' },
  '팥빙수': { emoji: '🍧', gradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },
  '냉모밀': { emoji: '🍱', gradient: 'linear-gradient(135deg, #56ccf2, #2f80ed)' },
  '초계국수': { emoji: '🍜', gradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' },
  '냉소면': { emoji: '🍜', gradient: 'linear-gradient(135deg, #56ccf2, #2f80ed)' },
  '아이스크림': { emoji: '🍦', gradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' },
  '수박화채': { emoji: '🍉', gradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },

  // 치킨/맥주류 (흐린날 기분전환)
  '치킨': { emoji: '🍗', gradient: 'linear-gradient(135deg, #ffb347, #ffcc33)' },
  '맥주와안주': { emoji: '🍺', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
  '피자': { emoji: '🍕', gradient: 'linear-gradient(135deg, #ff416c, #ff4b2b)' },
  '족발': { emoji: '🍖', gradient: 'linear-gradient(135deg, #eacda3, #d6ae7b)' },
  '탕수육': { emoji: '🍖', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },

  // 기본/맑은 날
  '비빔밥': { emoji: '🍚', gradient: 'linear-gradient(135deg, #56ab2f, #a8e063)' },
  '초밥': { emoji: '🍣', gradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' },
  '샐러드': { emoji: '🥗', gradient: 'linear-gradient(135deg, #56ab2f, #a8e063)' },
  '파스타': { emoji: '🍝', gradient: 'linear-gradient(135deg, #f6d365, #fda085)' },
  '돈까스': { emoji: '🍱', gradient: 'linear-gradient(135deg, #ffb347, #ffcc33)' },
  '샌드위치': { emoji: '🥪', gradient: 'linear-gradient(135deg, #56ab2f, #a8e063)' },
  '김밥': { emoji: '🍙', gradient: 'linear-gradient(135deg, #56ab2f, #a8e063)' },
  '떡국': { emoji: '🍲', gradient: 'linear-gradient(135deg, #eacda3, #d6ae7b)' },
  '갈비탕': { emoji: '🍲', gradient: 'linear-gradient(135deg, #d38312, #a83279)' },
  '햄버거': { emoji: '🍔', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
}

// 날씨별 후보 메뉴 목록 (기존 대비 4배 이상 확장)
const menuPool = {
  rain: [
    '부침개', '파전', '해물파전', '라면', '칼국수', '해물칼국수', '수제비',
    '짬뽕', '짜장면', '국밥', '부대찌개', '떡볶이', '차돌박이전골', '어묵탕',
    '전골', '보쌈', '삼겹살', '김치찌개',
  ],
  snow: [
    '호떡', '어묵탕', '군고구마', '떡볶이', '붕어빵', '어묵', '왕만두',
    '라면', '전골', '갈비탕', '떡국', '국밥', '칼국수', '수제비',
    '샤브샤브', '탕수육',
  ],
  hot: [
    '냉면', '팥빙수', '콩국수', '냉모밀', '열무비빔국수', '중화냉면',
    '초계국수', '냉소면', '아이스크림', '수박화채', '비빔밥', '초밥',
    '샐러드', '김밥',
  ],
  cold: [
    '샤브샤브', '어묵탕', '뜨끈한국밥', '전골', '갈비탕', '떡국',
    '국밥', '보쌈', '삼겹살', '군고구마', '왕만두', '칼국수',
    '수제비', '김치찌개', '된장찌개',
  ],
  cloud: [
    '파스타', '돈까스', '김치찌개', '치킨', '맥주와안주', '피자',
    '족발', '탕수육', '떡볶이', '짜장면', '짬뽕', '샌드위치',
  ],
  default: [
    '비빔밥', '초밥', '샐러드', '치킨', '파스타', '돈까스', '샌드위치',
    '김밥', '햄버거', '갈비탕', '김치찌개', '피자',
  ],
}

// 실제 존재하지 않는 '뜨끈한국밥'은 국밥 메타로 매핑
foodMeta['뜨끈한국밥'] = foodMeta['국밥']
foodMeta['맥주와안주'] = { emoji: '🍺', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' }

const pickMenuByWeather = (status, temp) => {
  let pool
  if (status.includes('비')) pool = menuPool.rain
  else if (status.includes('눈')) pool = menuPool.snow
  else if (temp >= 28) pool = menuPool.hot
  else if (temp <= 5) pool = menuPool.cold
  else if (status.includes('구름') || status.includes('흐림')) pool = menuPool.cloud
  else pool = menuPool.default

  const randomIndex = Math.floor(Math.random() * pool.length)
  return pool[randomIndex]
}

onMounted(async () => {
  const targetId = cityStore.selectedCityId
  const target =
    cityStore.favoriteCities.find((c) => c.id === targetId) || cityStore.favoriteCities[0]

  if (!target) {
    isLoading.value = false
    return
  }

  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat: target.lat, lon: target.lon, appid: API_KEY, units: 'metric', lang: 'kr' },
    })
    cityWeather.value = {
      name: target.name,
      temp: Math.round(response.data.main.temp),
      status: response.data.weather[0].description,
    }
    recommendedMenu.value = pickMenuByWeather(cityWeather.value.status, cityWeather.value.temp)
  } catch (error) {
    console.error('메뉴 추천용 날씨 조회 실패:', error)
  } finally {
    isLoading.value = false
  }
})

const reRoll = () => {
  if (!cityWeather.value) return
  recommendedMenu.value = pickMenuByWeather(cityWeather.value.status, cityWeather.value.temp)
}


</script>

<template>
  <div class="menu-wrapper" v-loading="isLoading">
    <h2>🍽️ 오늘의 메뉴 추천</h2>

    <div v-if="cityWeather" class="content">
      <p class="city-info">
        📍 {{ cityWeather.name }} · {{ cityWeather.temp }}°C · {{ cityWeather.status }}
      </p>

      <div
        v-if="recommendedMenu"
        class="food-card"
        :style="{ background: (foodMeta[recommendedMenu] || {}).gradient || 'linear-gradient(135deg, #ede4fb, #d8f3dc)' }"
      >
        <div class="food-emoji">{{ (foodMeta[recommendedMenu] || {}).emoji || '🍽️' }}</div>
        <p class="food-name">{{ recommendedMenu }}</p>
        <p class="food-caption">오늘 날씨엔 이거 어때요?</p>
      </div>

      <button class="reroll-btn" @click="reRoll">🎲 다시 추첨</button>
    </div>

    <el-empty v-else-if="!isLoading" description="즐겨찾기에 등록된 도시가 없습니다." />
  </div>
</template>

<style scoped>
.menu-wrapper {
  max-width: 420px;
  margin: 60px auto;
  padding: 28px;
  background: white;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 4px 14px rgba(108, 74, 182, 0.1);
}
h2 {
  color: #6c4ab6;
  margin-bottom: 20px;
}
.city-info {
  color: #8a6fc7;
  font-size: 14px;
  margin-bottom: 16px;
}
.food-card {
  border-radius: 24px;
  padding: 36px 20px;
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}
.food-card:hover {
  transform: translateY(-2px);
}
.food-emoji {
  font-size: 64px;
  margin-bottom: 8px;
}
.food-name {
  font-size: 26px;
  font-weight: 800;
  margin: 4px 0;
}
.food-caption {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}
.reroll-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 999px;
  background: #6c4ab6;
  color: white;
  font-weight: bold;
  cursor: pointer;
}
.reroll-btn:hover {
  background: #573b96;
}
</style>