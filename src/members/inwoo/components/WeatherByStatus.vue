<script setup>
import { computed } from 'vue'
import WeatherIcon from './WeatherIcon.vue'
import UiIcon from './UiIcon.vue'

/**
 * 날씨별 지역 현황.
 * 같은 목록을 "지역 기준"이 아니라 "날씨 기준"으로 묶어 본다.
 * 데이터는 그대로 받고, 묶는 방법만 여기서 정한다.
 */
const props = defineProps({
  list: { type: Array, required: true },
  favorites: { type: Array, default: () => [] },
  hereId: { type: String, default: '' },
  selectedId: { type: String, default: '' },
})

defineEmits(['select-card', 'toggle-favorite'])

/** 같은 status끼리 묶고, 지역이 많은 날씨부터 위로 올린다 */
const groups = computed(() => {
  const bucket = new Map()
  for (const item of props.list) {
    if (!bucket.has(item.status)) bucket.set(item.status, [])
    bucket.get(item.status).push(item)
  }
  return [...bucket.entries()]
    .map(([status, cities]) => ({
      status,
      cities: [...cities].sort((a, b) => b.temp - a.temp),
    }))
    .sort((a, b) => b.cities.length - a.cities.length)
})
</script>

<template>
  <div class="by-status">
    <div v-for="group in groups" :key="group.status" class="group">
      <p class="group-head">
        <WeatherIcon :status="group.status" :size="26" />
        <b class="status-name">{{ group.status }}</b>
        <span class="count">{{ group.cities.length }}곳</span>
      </p>

      <ul class="chips">
        <li v-for="city in group.cities" :key="city.id">
          <button
            type="button"
            class="chip"
            :class="{ here: city.id === hereId, selected: city.id === selectedId }"
            @click="$emit('select-card', city.id)"
          >
            <UiIcon v-if="city.id === hereId" name="location" :size="11" />
            <span class="chip-name">{{ city.name }}</span>
            <UiIcon v-if="city.id === selectedId" name="check" :size="12" class="chip-check" />
            <span class="chip-temp">{{ city.temp }}°</span>
            <span class="chip-region">{{ city.region }}</span>
          </button>
          <button
            type="button"
            class="chip-star"
            :class="{ on: favorites.includes(city.id) }"
            :title="favorites.includes(city.id) ? '즐겨찾기 해제' : '즐겨찾기에 추가'"
            @click="$emit('toggle-favorite', city.id)"
          >
            <UiIcon name="star" :size="13" :filled="favorites.includes(city.id)" />
          </button>
        </li>
      </ul>
    </div>

    <p v-if="!groups.length" class="empty-message">
      <UiIcon name="empty" :size="22" />
      표시할 날씨가 없습니다.
    </p>
  </div>
</template>

<style scoped>
.by-status {
  display: grid;
  gap: 12px;
}

.group {
  padding: 13px 15px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}

.group-head {
  display: flex;
  gap: 9px;
  align-items: center;
  margin: 0 0 10px;
}

.status-name {
  color: var(--ink);
  font-size: 14.5px;
  font-weight: 700;
}

.count {
  padding: 2px 9px;
  border-radius: 999px;
  color: var(--muted);
  background: var(--paper);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chips li {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper);
  transition: border-color 0.15s ease;
}

.chips li:hover {
  border-color: var(--accent-line);
}

.chip {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 5px 4px 5px 11px;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.chip.here {
  color: var(--accent);
}

/* 선택된 곳 — 카드와 같이 연한 회색 테두리 + 체크 */
.chips li:has(.chip.selected) {
  border-color: var(--line-strong);
  background: var(--surface);
}

.chip-check {
  color: var(--muted);
}

.chip-name {
  font-size: 12.5px;
  font-weight: 700;
}

.chip-temp {
  color: var(--slate);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
}

.chip-region {
  color: var(--faint);
  font-size: 10.5px;
}

.chip-star {
  padding: 0 9px 0 5px;
  border: 0;
  background: transparent;
  color: var(--line-strong);
  cursor: pointer;
  transition: color 0.15s ease;
}

.chip-star:hover,
.chip-star.on {
  color: #e0a12a;
}

.empty-message {
  display: flex;
  gap: 9px;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 30px 0;
  color: var(--faint);
  font-size: 13.5px;
}
</style>
