<script setup>
defineProps({
  currentStatus: {
    type: String,
    default: '전체',
  },
})

const emit = defineEmits(['update-status'])

const filters = [
  { value: '전체', label: '전체', icon: 'fa-solid fa-layer-group', accent: '#8b87a6' },
  { value: '맑음', label: '맑음', icon: 'fa-solid fa-sun', accent: '#ffb648' },
  { value: '비', label: '비', icon: 'fa-solid fa-cloud-rain', accent: '#5fadff' },
  { value: '구름', label: '구름', icon: 'fa-solid fa-cloud', accent: '#a79fc9' },
]

const selectFilter = (value) => {
  emit('update-status', value)
}
</script>

<template>
  <div class="filter-row">
    <button
      v-for="filter in filters"
      :key="filter.value"
      class="filter-chip"
      :class="{ active: currentStatus === filter.value }"
      :style="{ '--chip-accent': filter.accent }"
      @click="selectFilter(filter.value)"
    >
      <i :class="filter.icon"></i>
      {{ filter.label }}
    </button>
  </div>
</template>

<style scoped>
.filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 2px solid #f1ecff;
  border-radius: 999px;
  background-color: #ffffff;
  color: #a6a0be;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.filter-chip:hover {
  border-color: var(--chip-accent);
  color: var(--chip-accent);
}
.filter-chip.active {
  border-color: var(--chip-accent);
  background-color: var(--chip-accent);
  color: #ffffff;
}
</style>
