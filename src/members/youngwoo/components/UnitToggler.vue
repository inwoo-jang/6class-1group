<script setup>
import { storeToRefs } from 'pinia'
import { useConfigStore } from '../stores/configStore'

const configStore = useConfigStore()
const { unit, unitSymbol } = storeToRefs(configStore)
const { toggleUnit } = configStore
</script>

<template>
  <div class="unit-toggler">
    <span class="unit-toggler__label">
      날씨단위: {{ unit === 'celsius' ? '섭씨' : '화씨' }}({{ unitSymbol }})
    </span>
    <button type="button" class="unit-toggler__btn" @click="toggleUnit">단위변경</button>
  </div>
</template>

<style scoped>
.unit-toggler {
  display: flex;
  align-items: center;
  gap: 10px;
}

.unit-toggler__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.unit-toggler__btn {
  padding: 6px 12px;
  border: none;
  border-radius: var(--border-radius-medium);
  background: var(--color-primary-darker);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.unit-toggler__btn:hover {
  filter: brightness(1.08);
}

@media (max-width: 520px) {
  .unit-toggler__label {
    display: none;
  }
}
</style>
