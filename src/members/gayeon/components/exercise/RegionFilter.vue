<script setup>
defineProps({
  currentRegion: {
    type: String,
    default: '전체',
  },
})

const emit = defineEmits(['update-region'])

const regions = [
  { value: '전체', icon: 'fa-solid fa-layer-group' },
  { value: '내 위치', icon: 'fa-solid fa-location-crosshairs' },
  { value: '서울/경기', icon: 'fa-solid fa-location-dot' },
  { value: '강원', icon: 'fa-solid fa-location-dot' },
  { value: '충청', icon: 'fa-solid fa-location-dot' },
  { value: '전라', icon: 'fa-solid fa-location-dot' },
  { value: '경상', icon: 'fa-solid fa-location-dot' },
  { value: '제주', icon: 'fa-solid fa-location-dot' },
]

const selectRegion = (value) => {
  emit('update-region', value)
}
</script>

<template>
  <div class="region-row">
    <button
      v-for="region in regions"
      :key="region.value"
      class="region-chip"
      :class="{ active: currentRegion === region.value }"
      @click="selectRegion(region.value)"
    >
      <i :class="region.icon"></i>
      {{ region.value }}
    </button>
  </div>
</template>

<style scoped>
.region-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.region-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 2px solid #f1ecff;
  border-radius: 999px;
  background-color: #ffffff;
  color: #a6a0be;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.region-chip:hover {
  border-color: #ff7faa;
  color: #ff7faa;
}
.region-chip.active {
  border-color: #45415f;
  background-color: #45415f;
  color: #ffffff;
}
</style>
