<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchFestivalsByArea, sortFestivals } from '@/members/gayeon/components/exercise/festivalService'
import FestivalList from '@/members/gayeon/components/exercise/FestivalList.vue'

const cities = [
  { id: 'city_01', name: '서울', tourAreaCode: '1' },
  { id: 'city_02', name: '수원', tourAreaCode: '31' },
  { id: 'city_03', name: '인천', tourAreaCode: '2' },
  { id: 'city_04', name: '춘천', tourAreaCode: '32' },
  { id: 'city_05', name: '강릉', tourAreaCode: '32' },
  { id: 'city_06', name: '천안', tourAreaCode: '34' },
  { id: 'city_07', name: '대전', tourAreaCode: '3' },
  { id: 'city_08', name: '청주', tourAreaCode: '33' },
  { id: 'city_09', name: '전주', tourAreaCode: '37' },
  { id: 'city_10', name: '광주', tourAreaCode: '5' },
  { id: 'city_11', name: '여수', tourAreaCode: '38' },
  { id: 'city_12', name: '대구', tourAreaCode: '4' },
  { id: 'city_13', name: '부산', tourAreaCode: '6' },
  { id: 'city_14', name: '포항', tourAreaCode: '35' },
  { id: 'city_15', name: '제주', tourAreaCode: '39' },
]

const status = ref('loading')
const allFestivals = ref([])
const selectedCity = ref('전체')

const load = async () => {
  status.value = 'loading'
  try {
    const uniqueCodes = [...new Set(cities.map((c) => c.tourAreaCode))]
    const results = await Promise.all(
      uniqueCodes.map((code) =>
        fetchFestivalsByArea(code)
          .then((list) => ({ code, list }))
          .catch(() => ({ code, list: [] })),
      ),
    )
    const merged = []
    results.forEach(({ code, list }) => {
      const candidates = cities.filter((c) => c.tourAreaCode === code)
      list.forEach((f) => {
        const matched = candidates.find((c) => f.address?.includes(c.name))
        const target = matched || candidates[0]
        merged.push({ ...f, cityId: target?.id, cityName: target?.name })
      })
    })
    allFestivals.value = sortFestivals(merged)
    status.value = 'ok'
  } catch (err) {
    console.error(err)
    status.value = 'error'
  }
}

onMounted(load)

const cityOptions = computed(() => ['전체', ...new Set(cities.map((c) => c.name))])
const filteredFestivals = computed(() =>
  selectedCity.value === '전체'
    ? allFestivals.value
    : allFestivals.value.filter((f) => f.cityName === selectedCity.value),
)
</script>

<template>
  <header class="app-header">
    <div class="header-text">
      <h1 class="app-title">🎪 전국 축제 목록</h1>
      <p class="app-subtitle">등록된 도시의 진행 중 · 예정 축제를 확인해보세요</p>
    </div>
  </header>

  <div v-if="status === 'loading'" class="status-box loading">
    <i class="fa-solid fa-spinner fa-spin"></i> 축제 정보를 불러오는 중이에요...
  </div>
  <div v-else-if="status === 'error'" class="status-box error">
    <i class="fa-solid fa-triangle-exclamation"></i> 축제 정보를 불러오지 못했어요.
    <button class="retry-btn" @click="load">
      <i class="fa-solid fa-rotate-right"></i> 다시 시도
    </button>
  </div>
  <template v-else>
    <div class="city-filter">
      <button
        v-for="c in cityOptions"
        :key="c"
        class="filter-chip"
        :class="{ active: selectedCity === c }"
        @click="selectedCity = c"
      >
        {{ c }}
      </button>
    </div>
    <FestivalList :festivals="filteredFestivals" :show-city-name="true" />
  </template>
</template>

<style scoped>
.app-header {
  padding: 8px 8px 24px 8px;
  margin-bottom: 24px;
  border-bottom: 2px dashed #f1ecff;
}
.app-title {
  margin: 0;
  font-family: 'Jua', 'Pretendard', sans-serif;
  font-size: 24px;
  font-weight: 400;
  color: #45415f;
}
.app-subtitle {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #a6a0be;
}
.status-box {
  padding: 40px 18px;
  border-radius: 18px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
}
.status-box.loading {
  background-color: #eaf6ff;
  color: #3b82c4;
}
.status-box.error {
  background-color: #ffe9f1;
  color: #ff5c8a;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.retry-btn {
  padding: 8px 18px;
  border: none;
  border-radius: 999px;
  background-color: #ff7faa;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.city-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.filter-chip {
  padding: 7px 14px;
  border: 2px solid #f1ecff;
  border-radius: 999px;
  background-color: #ffffff;
  color: #a6a0be;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.filter-chip.active {
  border-color: #45415f;
  background-color: #45415f;
  color: #ffffff;
}
</style>
