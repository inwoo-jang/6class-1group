import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'youngwoo-weatherUnit'

export const useConfigStore = defineStore('youngwoo-config', () => {
  // state
  const unit = ref(localStorage.getItem(STORAGE_KEY) || 'celsius')

  // getters
  const unitSymbol = computed(() => (unit.value === 'celsius' ? '°C' : '°F'))

  // actions
  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
    localStorage.setItem(STORAGE_KEY, unit.value)
  }

  return { unit, unitSymbol, toggleUnit }
})
