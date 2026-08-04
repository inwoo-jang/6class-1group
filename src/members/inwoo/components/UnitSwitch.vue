<script setup>
import { storeToRefs } from 'pinia'
import { useConfigStore } from '../stores/configStore'

/**
 * 온도 단위 스위치 — 도구 줄에 놓는 작은 두 칸짜리 버튼.
 *
 * 과제 5의 UnitToggler 와 같은 Store 를 보지만 생김새가 다르다.
 * 저쪽은 내비게이션 바에 놓이는 한 칸짜리 토글, 이쪽은 새로고침 옆에 붙는
 * ℃ · ℉ 두 칸짜리다. 지금 어느 단위인지가 한눈에 보여야 해서 둘 다 띄운다.
 *
 * 부모에게서 받는 것도, 부모에게 올리는 것도 없다. Store 하나만 본다.
 */
const configStore = useConfigStore()
const { unit } = storeToRefs(configStore)
const { setUnit } = configStore

const OPTIONS = [
  { value: 'celsius', symbol: '℃', label: '섭씨로 보기' },
  { value: 'fahrenheit', symbol: '℉', label: '화씨로 보기' },
]
</script>

<template>
  <div class="unit-switch" role="group" aria-label="온도 단위">
    <button
      v-for="option in OPTIONS"
      :key="option.value"
      type="button"
      :class="{ on: unit === option.value }"
      :aria-pressed="unit === option.value"
      :title="option.label"
      @click="setUnit(option.value)"
    >
      {{ option.symbol }}
    </button>
  </div>
</template>

<style scoped>
.unit-switch {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
}

.unit-switch button {
  min-width: 26px;
  padding: 3px 7px;
  border: 0;
  border-radius: 999px;
  color: var(--faint);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 11.5px;
  font-weight: 700;
  line-height: 1.5;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.unit-switch button:hover:not(.on) {
  color: var(--accent);
}

.unit-switch button.on {
  color: var(--on-accent);
  background: var(--accent);
}
</style>
