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
/*
 * 예전에는 한 줄 한 줄이 그림자 달린 카드였다. 그런 카드가 열 개 넘게
 * 쌓이니 목록이 아니라 카드 더미로 보였다. 배경과 그림자를 걷고
 * 가는 선으로만 나눈다 — 눈이 세로로 훑고 내려갈 수 있게.
 */
.weather-card {
  position: relative;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
  padding: 13px 34px 13px 14px;
  border-bottom: 1px solid var(--color-border);
  border-left: 2px solid transparent;
  cursor: pointer;
  box-sizing: border-box;
  transition: background 0.15s ease;
}
.weather-card:last-of-type {
  border-bottom: 0;
}
.weather-card:hover {
  background: var(--magpie-accent-soft);
}
.weather-card.selected {
  border-left-color: var(--magpie-accent);
  background: var(--magpie-accent-soft);
}

/*
 * 기온대 구분. 갤러리가 무채색이라 빨강·파랑을 쓰면 혼자 튄다.
 * 왼쪽 선의 진하기만 달리해서, 색 없이도 더운 줄과 추운 줄이 구별되게 했다.
 */
.weather-card.range-hot {
  border-left-color: color-mix(in srgb, var(--fg) 72%, transparent);
}
.weather-card.range-cool {
  border-left-color: color-mix(in srgb, var(--fg) 40%, transparent);
}
.weather-card.range-cold {
  border-left-color: color-mix(in srgb, var(--fg) 20%, transparent);
}
.weather-card.range-unknown {
  border-left-color: transparent;
}

.city-col {
  flex: 1;
  min-width: 0;
}
.city-name {
  font-weight: 700;
  font-size: 14.5px;
  color: var(--color-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.city-status {
  font-size: 13px;
  color: var(--color-text);
  opacity: 0.75;
  margin-top: 2px;
}
.temp-value {
  font-size: 16px;
  font-weight: 700;
  font-family: var(--font-mono);
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
