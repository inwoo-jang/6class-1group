<script setup>
/**
 * 지역 선택 탭.
 * 어느 지역이 선택됐는지는 부모가 알고 있고(props),
 * 이 컴포넌트는 "눌렸다"고 알리기만 한다(emits).
 */
defineProps({
  regions: { type: Array, required: true },
  current: { type: String, default: '전체' },
  counts: { type: Object, default: () => ({}) },
})

defineEmits(['select-region'])
</script>

<template>
  <div class="tabs" role="tablist">
    <button
      v-for="region in ['전체', ...regions]"
      :key="region"
      type="button"
      role="tab"
      class="tab"
      :class="{ active: region === current }"
      :aria-selected="region === current"
      @click="$emit('select-region', region)"
    >
      {{ region }}
      <span v-if="counts[region]" class="count">{{ counts[region] }}</span>
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.tab {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  background: var(--surface);
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background 0.15s ease;
}

.tab:hover {
  border-color: var(--accent-line);
  color: var(--accent);
}

.tab.active {
  border-color: var(--accent);
  color: var(--on-accent);
  background: var(--accent);
}

.count {
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--paper);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 700;
}

.tab.active .count {
  background: rgb(255 255 255 / 25%);
  color: var(--on-accent);
}
</style>
