<script setup>
defineProps({
  selectedCityName: { type: String, default: '' },
})

// 대략적인 위치(비율 좌표, 0~100)
const cityPoints = [
  { name: '서울', x: 42, y: 22 },
  { name: '인천', x: 36, y: 24 },
  { name: '강릉', x: 62, y: 25 },
  { name: '대전', x: 46, y: 45 },
  { name: '전주', x: 38, y: 55 },
  { name: '광주', x: 33, y: 62 },
  { name: '대구', x: 60, y: 55 },
  { name: '부산', x: 63, y: 68 },
  { name: '제주', x: 30, y: 92 },
]
</script>

<template>
  <div class="map-box">
    <p class="map-title">📍 대한민국</p>
    <svg viewBox="0 0 100 100" class="map-svg">
      <!-- 단순화된 한반도 형태 -->
      <path
        d="M40,10 L55,15 L60,25 L65,35 L60,45 L65,55 L60,65 L65,70 L55,75 L45,70 L35,65 L30,55 L35,45 L30,35 L35,25 Z"
        fill="#ede4fb"
        stroke="#c9b6ea"
        stroke-width="1"
      />
      <circle
        v-for="point in cityPoints"
        :key="point.name"
        :cx="point.x"
        :cy="point.y"
        :r="point.name === selectedCityName ? 3.5 : 2"
        :fill="point.name === selectedCityName ? '#e74c3c' : '#6c4ab6'"
        class="city-dot"
      />
      <text
        v-for="point in cityPoints"
        :key="point.name + '-label'"
        :x="point.x + 3"
        :y="point.y + 1"
        font-size="4"
        :fill="point.name === selectedCityName ? '#e74c3c' : '#4b2e83'"
        :font-weight="point.name === selectedCityName ? 'bold' : 'normal'"
      >
        {{ point.name }}
      </text>
    </svg>
  </div>
</template>

<style scoped>
.map-box {
  background: white;
  border-radius: 24px;
  padding: 20px;
  margin-top: 14px;
  box-shadow: 0 4px 14px rgba(108, 74, 182, 0.08);
}
.map-title {
  color: #6c4ab6;
  font-weight: 700;
  margin: 0 0 12px;
}
.map-svg {
  width: 100%;
  height: auto;
}
.city-dot {
  transition: r 0.2s;
}
</style>