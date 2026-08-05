<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../composables/useConfigState'

const props = defineProps({
  city: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
})

const emit = defineEmits(['select-card', 'click-detail', 'remove'])

const configStore = useConfigStore()

const displayTemp = computed(() => {
  const rawTemp = props.city.temp
  if (rawTemp === null) return null
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32)
  }
  return rawTemp
})

const statusEmoji = computed(() => {
  const status = props.city.status ?? ''
  if (status.includes('눈')) return '❄️'
  if (status.includes('천둥')) return '⛈️'
  if (status.includes('비')) return '🌧️'
  if (status.includes('안개')) return '🌫️'
  if (status.includes('약간') || status.includes('조금')) return '🌤️'
  if (status.includes('구름')) return '☁️'
  if (status.includes('맑')) return '☀️'
  return '🌡️'
})

const tempRangeClass = computed(() => {
  const t = props.city.temp
  if (t === null) return 'range-unknown'
  if (t >= 25) return 'range-hot'
  if (t >= 10) return 'range-cool'
  return 'range-cold'
})
</script>

<template>
  <div
    class="weather-card"
    :class="[tempRangeClass, { selected: isSelected }]"
    @click="emit('select-card', city)"
  >
    <button class="remove-btn" title="목록에서 삭제" @click.stop="emit('remove', city.id)">×</button>

    <div class="city-col">
      <div class="city-name">{{ statusEmoji }} {{ city.name }}</div>
      <div class="city-status">
        {{ city.status }}
        <span v-if="city.custom" class="custom-tag">직접 추가</span>
      </div>
    </div>

    <span class="temp-value">
      {{ city.temp === null ? '조회 실패' : `${displayTemp}${configStore.unitSymbol}` }}
    </span>

    <button class="detail-btn" @click.stop="emit('click-detail', city)">상세보기 및 미세먼지</button>
  </div>
</template>

<style scoped>
.weather-card {
  position: relative;
  background: var(--color-background);
  border-radius: 12px;
  padding: 14px 40px 14px 16px;
  margin-bottom: 10px;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
  border: 1px solid var(--color-border);
  border-left: 5px solid transparent;
  box-sizing: border-box;
}
.weather-card:hover {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}
.weather-card.selected {
  border-color: var(--magpie-accent);
}

.weather-card.range-hot {
  background: rgba(239, 91, 91, 0.1);
  border-left-color: #ef5b5b;
}
.weather-card.range-cool {
  background: rgba(46, 134, 222, 0.1);
  border-left-color: var(--magpie-blue);
}
.weather-card.range-cold {
  background: rgba(124, 92, 255, 0.1);
  border-left-color: var(--magpie-violet);
}
.weather-card.range-unknown {
  background: rgba(154, 165, 177, 0.1);
  border-left-color: #9aa5b1;
}

.city-col {
  flex: 1;
  min-width: 0;
}
.city-name {
  font-weight: 800;
  font-size: 18px;
  color: var(--color-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* 줄높이를 물려받으면 16px 이라 18px 글자와 이모지의 위아래가 잘린다 */
  line-height: 1.4;
}
.city-status {
  font-size: 13px;
  color: var(--color-text);
  opacity: 0.75;
  margin-top: 2px;
  line-height: 1.4;
}
.temp-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-heading);
  white-space: nowrap;
  flex-shrink: 0;
}
.custom-tag {
  font-size: 10px;
  font-weight: 700;
  color: var(--magpie-accent);
  background: var(--magpie-accent-soft);
  padding: 2px 6px;
  border-radius: 10px;
  vertical-align: middle;
  margin-left: 4px;
}
.detail-btn {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.detail-btn:hover {
  background: var(--magpie-accent-soft);
  border-color: var(--magpie-accent);
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text);
  opacity: 0.5;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    opacity 0.15s ease;
}
.remove-btn:hover {
  background: #fdecea;
  color: #c0392b;
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .weather-card,
  .remove-btn {
    transition: none !important;
  }
}
</style>
