<script setup>
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()
</script>

<template>
  <button class="unit-toggler" @click="configStore.toggleUnit">
    <span class="unit-option" :class="{ active: configStore.unit === 'celsius' }">°C</span>
    <span class="unit-option" :class="{ active: configStore.unit === 'fahrenheit' }">°F</span>
  </button>
</template>

<style scoped>
.unit-toggler {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border: none;
  border-radius: 999px;
  background-color: #f1ecff;
  cursor: pointer;
}
.unit-option {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #a6a0be;
  transition: all 0.2s ease;
}
.unit-option.active {
  background-color: #ff7faa;
  color: #ffffff;
}
</style>
