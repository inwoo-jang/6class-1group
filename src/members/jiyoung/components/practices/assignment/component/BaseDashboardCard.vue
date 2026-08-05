<script setup>
defineProps({
  icon: { type: String, default: '📋' },
  title: { type: String, required: true },
})
</script>

<template>
  <section class="dashboard-card">
    <h3><span class="icon">{{ icon }}</span>{{ title }}</h3>
    <div class="card-body">
      <!-- 부모(WeatherParent)가 도시 검색 UI 또는 날씨 현황 목록을 이 자리에 주입 -->
      <slot></slot>
    </div>
  </section>
</template>

<style scoped>
.dashboard-card {
  background: white;
  border-radius: 22px;
  padding: 18px 20px;
  margin-bottom: 14px;
  box-shadow: 0 4px 14px rgba(108, 74, 182, 0.08);
}
.dashboard-card h3 {
  margin: 0 0 12px;
  color: #6c4ab6;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.icon {
  font-size: 18px;
}
</style>