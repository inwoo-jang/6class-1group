<script setup>
import { useConfigStore } from '../composables/useConfigState'

const configStore = useConfigStore()
</script>

<template>
  <div class="unit-toggler">
    <span class="unit-label">
      날씨단위: {{ configStore.unit === 'fahrenheit' ? '화씨' : '섭씨' }}({{ configStore.unitSymbol }})
    </span>
    <button class="unit-btn" @click="configStore.toggleUnit">단위변경</button>
  </div>
</template>

<style scoped>
.unit-toggler {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.unit-label {
  font-size: 13px;
  color: var(--color-text);
  opacity: 0.75;
  white-space: nowrap;
}
.unit-btn {
  background: var(--magpie-gradient);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.unit-btn:hover {
  filter: brightness(1.08);
}
</style>
