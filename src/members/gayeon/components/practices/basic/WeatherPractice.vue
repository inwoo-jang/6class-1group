<script setup>
import { ref, computed, watch, watchEffect } from 'vue'

/* ─────────────────────────────────────────────
   1. 반응형 상태 관리 (1일차 동일)
   ───────────────────────────────────────────── */
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
  { id: 'city_04', name: '천안', temp: 27, status: '맑음' },
])

// 검색어 (한글 조합 처리를 위해 :value + @input 사용)
const searchQuery = ref('')
const onSearchInput = (event) => {
  searchQuery.value = event.target.value
}

// 상태바 문구 + 선택된 카드 표시용
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')
const selectedId = ref(null)

/* ─────────────────────────────────────────────
   2. computed - 검색어로 필터링된 날씨 리스트
   ───────────────────────────────────────────── */
const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()

  // 검색어가 비어 있으면 원본 데이터를 그대로 반환
  if (!query) return weatherList.value

  // 도시 이름에 검색어가 포함된 항목만 반환
  return weatherList.value.filter((city) => city.name.includes(query))
})

/* ─────────────────────────────────────────────
   3-1. watch - 상태바 문구(selectedCityInfo) 감시
   ───────────────────────────────────────────── */
watch(selectedCityInfo, (newInfo, oldInfo) => {
  console.log(`👁️ [watch] 상태바 변경: "${oldInfo}" → "${newInfo}"`)
})

/* ─────────────────────────────────────────────
   3-2. watchEffect - 검색어(searchQuery) 자동 추적
   ───────────────────────────────────────────── */
watchEffect(() => {
  console.log(
    `🤖 [watchEffect] 현재 검색어 '${searchQuery.value}' → 검색 결과 ${filteredWeatherList.value.length}건`,
  )
})

/* ─────────────────────────────────────────────
   이벤트 처리
   ───────────────────────────────────────────── */
const selectCity = (city) => {
  selectedId.value = city.id
  selectedCityInfo.value = `${city.name}이 선택되었습니다.`
}

const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}

// 상태별 아이콘
const statusIcon = (status) => {
  if (status === '맑음') return '☀️'
  if (status === '비') return '🌧️'
  if (status === '구름') return '☁️'
  return '🌡️'
}
</script>

<template>
  <div class="weather-app">
    <header class="app-header">
      <h2>과제 2: 날씨 <span class="badge">Composition</span></h2>
    </header>

    <!-- 양방향 바인딩 (:value / @input) -->
    <section class="panel">
      <h3 class="panel-title">🔍 도시 검색</h3>
      <input
        type="text"
        class="search-input"
        placeholder="검색할 도시 이름 입력"
        :value="searchQuery"
        @input="onSearchInput"
      />
      <p class="search-echo">
        검색 중인 도시:
        <strong v-if="searchQuery">{{ searchQuery }}</strong>
        <span v-else class="placeholder-text">아직 입력하지 않았어요</span>
      </p>
    </section>

    <!-- 4. 검색 결과 표시 (computed 배열을 렌더링) -->
    <section class="panel">
      <h3 class="panel-title">
        📊 지역별 날씨 현황
        <span class="count">{{ filteredWeatherList.length }}건</span>
      </h3>

      <div
        v-for="city in filteredWeatherList"
        :key="city.id"
        class="card"
        :class="{ active: selectedId === city.id }"
        @click="selectCity(city)"
      >
        <div class="card-icon">{{ statusIcon(city.status) }}</div>

        <div class="card-body">
          <p class="city-name">
            {{ city.name }}
            <span class="city-status">{{ city.status }}</span>
          </p>
          <p class="city-temp">{{ city.temp }}<span class="unit">°C</span></p>

          <!-- 조건부 렌더링 (v-if / v-else) -->
          <span v-if="city.temp >= 25" class="label hot">🔥 더움 (25도 이상)</span>
          <span v-else class="label cool">❄️ 선선함 (25도 미만)</span>
        </div>

        <!-- 이벤트 수식어 (.stop 으로 버블링 차단) -->
        <button class="detail-btn" @click.stop="showDetail(city.name, city.status)">
          상세보기
        </button>
      </div>

      <!-- 검색 결과가 없을 때 안내 -->
      <p v-if="filteredWeatherList.length === 0" class="empty-result">
        😭 '{{ searchQuery }}'와 일치하는 도시가 없습니다.
      </p>
    </section>

    <div class="status-bar">{{ selectedCityInfo }}</div>
  </div>
</template>

<style scoped>
.weather-app {
  max-width: 560px;
  margin: 0 auto;
  padding: 28px;
  background-color: #ffffff;
  color: #1f2937;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  font-family:
    'Pretendard',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}

/* 헤더 */
.app-header {
  padding-bottom: 18px;
  margin-bottom: 24px;
  border-bottom: 1px solid #f1f5f9;
}
.app-header h2 {
  margin: 0;
  font-size: 22px;
  color: #0f172a;
}
.badge {
  display: inline-block;
  margin-left: 8px;
  padding: 4px 10px;
  background-color: #eef2ff;
  color: #6366f1;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
  vertical-align: middle;
}

/* 패널 */
.panel {
  background-color: #f8fafc;
  border: 1px solid #eef2f6;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 20px;
}
.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 14px 0;
  font-size: 15px;
  color: #475569;
}
.count {
  padding: 3px 10px;
  background-color: #eef2ff;
  color: #6366f1;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
}

/* 검색 */
.search-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #dbe3ec;
  border-radius: 10px;
  font-size: 15px;
  color: #1f2937;
  background-color: #ffffff;
  box-sizing: border-box;
  transition: all 0.2s ease;
}
.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.search-echo {
  margin: 12px 0 0 0;
  font-size: 14px;
  color: #64748b;
}
.search-echo strong {
  color: #4f46e5;
}
.placeholder-text {
  color: #cbd5e1;
}

/* 카드 */
.card {
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: #ffffff;
  border: 1px solid #eef2f6;
  border-radius: 14px;
  padding: 18px;
  margin-top: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.card:hover {
  border-color: #c7d2fe;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.07);
}
.card.active {
  border-color: #6366f1;
  background-color: #f5f5ff;
}
.card-icon {
  font-size: 32px;
}
.card-body {
  flex: 1;
}
.city-name {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}
.city-status {
  margin-left: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
}
.city-temp {
  margin: 2px 0 10px 0;
  font-size: 26px;
  font-weight: 800;
  color: #334155;
}
.unit {
  font-size: 15px;
  font-weight: 500;
  color: #94a3b8;
}

/* 라벨 */
.label {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}
.hot {
  background: linear-gradient(135deg, #fb7185, #f43f5e);
}
.cool {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
}

/* 버튼 */
.detail-btn {
  padding: 9px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background-color: #ffffff;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.detail-btn:hover {
  background-color: #6366f1;
  border-color: #6366f1;
  color: #ffffff;
}

/* 검색 결과 없음 */
.empty-result {
  margin: 12px 0 0 0;
  padding: 28px 18px;
  background-color: #fff1f2;
  border: 1px dashed #fecdd3;
  border-radius: 14px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #e11d48;
}

/* 상태바 */
.status-bar {
  padding: 16px;
  background-color: #f0fdf4;
  border: 1px solid #dcfce7;
  border-radius: 14px;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: #16a34a;
}
</style>
