<script setup>
import { computed } from 'vue'
import { convertTemp } from '../utils/temperature'
import { useDisplayTemp } from '../composables/useDisplayTemp'

const props = defineProps({
  temp: {
    type: Number,
    default: null,
  },
  min: {
    type: Number,
    default: -20,
  },
  max: {
    type: Number,
    default: 45,
  },
})

const { unit, unitSymbol, displayTemp } = useDisplayTemp(() => props.temp)

function ratioOf(value) {
  const clamped = Math.min(Math.max(value, props.min), props.max)
  return ((clamped - props.min) / (props.max - props.min)) * 100
}

const ratio = computed(() => (props.temp == null ? 0 : ratioOf(props.temp)))

const fillColor = computed(() => {
  if (props.temp == null) return 'var(--border-color-default)'
  return props.temp >= 25 ? 'var(--color-warm)' : 'var(--color-info)'
})

const TICK_STEPS = 5
const ticks = computed(() =>
  Array.from({ length: TICK_STEPS + 1 }, (_, i) => {
    const value = Math.round(props.min + ((props.max - props.min) * i) / TICK_STEPS)
    return { value: convertTemp(value, unit.value), ratio: ratioOf(value) }
  }),
)
</script>

<template>
  <div class="thermometer">
    <div class="thermometer__track">
      <div class="thermometer__fill" :style="{ height: ratio + '%', background: fillColor }"></div>
    </div>

    <div
      v-for="tick in ticks"
      :key="tick.value"
      class="thermometer__tick"
      :style="{ bottom: tick.ratio + '%' }"
    >
      <span class="thermometer__tick-mark"></span>
      <span class="thermometer__tick-label">{{ tick.value }}{{ unitSymbol }}</span>
    </div>

    <div v-if="temp != null" class="thermometer__pointer" :style="{ bottom: ratio + '%' }">
      <span class="thermometer__pointer-label" :style="{ background: fillColor }">
        {{ displayTemp }}{{ unitSymbol }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.thermometer {
  position: relative;
  width: 44px;
  height: 100%;
  min-height: 160px;
  flex-shrink: 0;
}

.thermometer__track {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  background: var(--color-primary-opacity-10);
  border: 1px solid var(--border-color-default);
  border-radius: 999px;
  overflow: hidden;
}

.thermometer__fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  transition:
    height 0.6s ease,
    background 0.6s ease;
}

.thermometer__tick {
  position: absolute;
  left: 14px;
  display: flex;
  align-items: center;
  gap: 3px;
  transform: translateY(50%);
}

.thermometer__tick-mark {
  width: 4px;
  height: 1px;
  background: var(--border-color-default);
}

.thermometer__tick-label {
  font-size: 8px;
  font-weight: 600;
  color: var(--color-text-light);
  white-space: nowrap;
}

.thermometer__pointer {
  position: absolute;
  left: 14px;
  z-index: 2;
  transform: translateY(50%);
  transition: bottom 0.6s ease;
}

.thermometer__pointer-label {
  display: inline-block;
  padding: 2px 5px;
  border-radius: 999px;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: var(--shadow-card);
  transition: background 0.6s ease;
}
</style>
