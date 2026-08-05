<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  festivals: { type: Array, required: true },
  showCityName: { type: Boolean, default: false },
  emptyMessage: { type: String, default: '현재 진행 중인 축제가 없습니다.' },
})

const expanded = ref(false)
const visibleFestivals = computed(() =>
  expanded.value ? props.festivals : props.festivals.slice(0, 6),
)
const formatDate = (raw) => (raw ? `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}` : '')
</script>

<template>
  <div v-if="festivals.length === 0" class="festival-empty">
    <i class="fa-solid fa-champagne-glasses"></i> {{ emptyMessage }}
  </div>

  <template v-else>
    <div class="festival-grid">
      <RouterLink
        v-for="f in visibleFestivals"
        :key="f.id"
        :to="f.cityId ? `/weather/${f.cityId}` : ''"
        class="festival-card"
        :class="{ 'no-link': !f.cityId }"
      >
        <div class="festival-image">
          <img v-if="f.image" :src="f.image" alt="" />
          <div v-else class="festival-image-fallback"><i class="fa-solid fa-image"></i></div>
        </div>
        <div class="festival-body">
          <span class="festival-status" :style="{ backgroundColor: f.status.color }">{{
            f.status.label
          }}</span>
          <p class="festival-title">{{ f.title }}</p>
          <p class="festival-meta">
            <span v-if="showCityName && f.cityName" class="festival-city">{{ f.cityName }}</span>
            {{ formatDate(f.startDate) }} – {{ formatDate(f.endDate) }}
          </p>
          <p class="festival-place"><i class="fa-solid fa-location-dot"></i> {{ f.address }}</p>
        </div>
      </RouterLink>
    </div>

    <button v-if="!expanded && festivals.length > 6" class="more-btn" @click="expanded = true">
      더 보기 ({{ festivals.length - 6 }}개 더) <i class="fa-solid fa-chevron-down"></i>
    </button>
  </template>
</template>

<style scoped>
.festival-empty {
  padding: 30px 18px;
  background-color: #fbfaff;
  border-radius: 16px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: #a6a0be;
}
.festival-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.festival-card {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  background-color: #fbfaff;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease;
}
.festival-card:not(.no-link):hover {
  transform: translateY(-3px);
}
.festival-card.no-link {
  cursor: default;
}
.festival-image {
  width: 100%;
  height: 120px;
  background-color: #f1ecff;
}
.festival-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.festival-image-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #c7c2de;
}
.festival-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.festival-status {
  align-self: flex-start;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
}
.festival-title {
  margin: 2px 0 0 0;
  font-size: 14px;
  font-weight: 700;
  color: #45415f;
}
.festival-meta {
  margin: 0;
  font-size: 11px;
  color: #a6a0be;
  display: flex;
  gap: 6px;
  align-items: center;
}
.festival-city {
  padding: 1px 8px;
  background-color: #c7c2de;
  color: #ffffff;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}
.festival-place {
  margin: 0;
  font-size: 11px;
  color: #a6a0be;
}
.more-btn {
  display: block;
  margin: 14px auto 0 auto;
  padding: 9px 18px;
  border: none;
  border-radius: 999px;
  background-color: #f1ecff;
  color: #45415f;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.more-btn:hover {
  background-color: #45415f;
  color: #ffffff;
}
</style>
