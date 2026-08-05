<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'

const props = defineProps({
  cityItem: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  festivalBadge: { type: Object, default: null },
})

const emit = defineEmits(['select-card', 'click-detail', 'toggle-favorite'])

const configStore = useConfigStore()

const displayTemp = computed(() => {
  const rawTemp = props.cityItem.temp // 원본 데이터는 항상 섭씨
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32)
  }
  return rawTemp
})

const theme = computed(() => {
  switch (props.cityItem.status) {
    case '맑음':
      return { icon: 'fa-solid fa-sun', wash: '#fff4de', accent: '#ffb648' }
    case '비':
      return { icon: 'fa-solid fa-cloud-rain', wash: '#e8f4ff', accent: '#5fadff' }
    case '구름':
      return { icon: 'fa-solid fa-cloud', wash: '#f1edfb', accent: '#a79fc9' }
    default:
      return { icon: 'fa-solid fa-temperature-half', wash: '#f4f4f6', accent: '#9ca3af' }
  }
})

const tempInfo = computed(() => {
  const t = props.cityItem.temp
  if (t >= 30) return { label: '무더워요', color: '#e4572e' }
  if (t >= 25) return { label: '더워요', color: '#ff9f45' }
  if (t >= 20) return { label: '선선해요', color: '#4caf50' }
  if (t >= 10) return { label: '쌀쌀해요', color: '#4a90e2' }
  return { label: '추워요', color: '#2e3a87' }
})

const humidityInfo = computed(() => {
  const h = props.cityItem.humidity
  if (h >= 80) return { label: '눅눅해요', color: '#0f9da6', wash: '#e0f7f5' }
  if (h >= 60) return { label: '습해요', color: '#5fadff', wash: '#e8f4ff' }
  if (h >= 40) return { label: '쾌적해요', color: '#3fcb94', wash: '#e3fbf1' }
  return { label: '건조해요', color: '#d97706', wash: '#fef3e2' }
})

const handleSelect = () => {
  emit('select-card', props.cityItem)
}

const handleDetail = () => {
  emit('click-detail', props.cityItem)
}

const handleFavorite = () => {
  emit('toggle-favorite', props.cityItem)
}
</script>

<template>
  <div
    class="card"
    :class="{ active: isSelected }"
    :style="{ '--wash': theme.wash, '--accent': theme.accent }"
    @click="handleSelect"
  >
    <span
      v-if="festivalBadge"
      class="festival-badge"
      :style="{ backgroundColor: festivalBadge.color }"
    >
      {{ festivalBadge.label }}
    </span>
    <div class="icon-bubble"><i :class="theme.icon"></i></div>

    <div class="card-body">
      <p class="city-name">
        {{ cityItem.name }}
        <span v-if="cityItem.isMyLocation" class="city-region my-location">
          <i class="fa-solid fa-location-crosshairs"></i> 내 위치
        </span>
        <span v-else class="city-region">{{ cityItem.region }}</span>
        <span class="city-status">{{ cityItem.status }}</span>
      </p>

      <div class="city-meta">
        <p class="city-temp">
          {{ displayTemp }}<span class="unit">{{ configStore.unitSymbol }}</span>
        </p>
        <span
          class="humidity"
          :style="{ color: humidityInfo.color, backgroundColor: humidityInfo.wash }"
        >
          <i class="fa-solid fa-droplet"></i> {{ cityItem.humidity }}% · {{ humidityInfo.label }}
        </span>
      </div>

      <span class="label" :style="{ backgroundColor: tempInfo.color }">
        {{ tempInfo.label }}
      </span>
    </div>

    <div class="card-actions">
      <button class="favorite-btn" :class="{ active: isFavorite }" @click.stop="handleFavorite">
        <i class="fa-solid fa-star"></i>
      </button>
      <button class="detail-btn" @click.stop="handleDetail">
        <i class="fa-solid fa-circle-info"></i> 상세보기
      </button>
    </div>
  </div>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: var(--wash);
  border: 2px solid transparent;
  border-radius: 20px;
  padding: 16px 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(69, 65, 95, 0.1);
}
.card.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(69, 65, 95, 0.08);
}

.icon-bubble {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: var(--accent);
  background-color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(69, 65, 95, 0.08);
  transition: transform 0.2s ease;
}
.card:hover .icon-bubble {
  transform: rotate(-8deg) scale(1.05);
}

.card-body {
  flex: 1;
  min-width: 0;
}
.city-name {
  margin: 0;
  font-family: 'Jua', 'Pretendard', sans-serif;
  font-size: 17px;
  font-weight: 400;
  color: #45415f;
}
.city-region {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  background-color: #c7c2de;
  padding: 2px 8px;
  border-radius: 999px;
  vertical-align: middle;
}
.city-region.my-location {
  background-color: #ff7faa;
}
.city-status {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}

.city-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 4px 0 8px 0;
}
.city-temp {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #45415f;
}
.unit {
  font-size: 14px;
  font-weight: 500;
  color: #a6a0be;
}
.humidity {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.label {
  display: inline-block;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
}

.card-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.favorite-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background-color: #ffffff;
  color: #d5d1e6;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.favorite-btn:hover {
  color: #ffb648;
  transform: scale(1.1);
}
.favorite-btn.active {
  color: #ffb648;
}
.detail-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 15px;
  border: 2px solid #ffffff;
  border-radius: 999px;
  background-color: #ffffff;
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.detail-btn:hover {
  background-color: var(--accent);
  color: #ffffff;
}
.festival-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  color: #ffffff;
}
</style>
