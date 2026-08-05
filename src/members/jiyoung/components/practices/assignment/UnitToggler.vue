<script setup>
import { useConfigStore } from '../../../data/stores/configStore'
const configStore = useConfigStore()
</script>

<template>
  <div style="display: inline-flex; align-items: center; gap: 8px">
    <span
      >날씨단위: <strong>{{ configStore.unit === 'celsius' ? '섭씨(℃)' : '화씨(℉)' }}</strong></span
    >
    <button @click="configStore.toggleUnit" class="toggle-btn">단위변경</button>
  </div>
</template>

<style scoped>
.toggle-btn {
  padding: 6px 12px;
  background-color: #6c4ab6;
  color: white;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
}
.toggle-btn:hover {
  background-color: #573b96;
}
</style>
