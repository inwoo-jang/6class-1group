<script setup>
/**
 * 화면 조작을 돕는 UI 아이콘.
 *
 * 이 대시보드는 아이콘 체계를 둘로 나눠서 쓴다.
 *   · 날씨 상태(데이터) → WeatherIcon.vue 의 컬러 PNG
 *   · 화면 안내(UI)     → 이 파일의 단색 선 아이콘
 * 섞어 쓰면 투박해 보이므로 역할이 다르면 체계도 다르게 둔다.
 */
defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 18 },
  /** 별표처럼 "켜짐" 상태를 색으로 채워야 하는 아이콘에 쓴다 */
  filled: { type: Boolean, default: false },
})
</script>

<template>
  <svg
    class="ui-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="filled ? 'currentColor' : 'none'"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- 돋보기 -->
    <template v-if="name === 'search'">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </template>

    <!-- 도시 건물 -->
    <template v-else-if="name === 'city'">
      <path d="M3 21h18" />
      <path d="M5 21V8l6-4v17" />
      <path d="M11 21V11h8v10" />
      <path d="M8 11v0M8 15v0M15 15v0M15 18v0" />
    </template>

    <!-- 온도계 -->
    <template v-else-if="name === 'thermometer'">
      <path d="M14 14.76V4.5a2.5 2.5 0 0 0-5 0v10.26a4.5 4.5 0 1 0 5 0Z" />
      <path d="M11.5 8v6.5" />
    </template>

    <!-- 물방울 (습도) -->
    <template v-else-if="name === 'droplet'">
      <path d="M12 3.2 6.9 8.6a7 7 0 1 0 10.2 0Z" />
    </template>

    <!-- 별표 (즐겨찾기) -->
    <template v-else-if="name === 'star'">
      <path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85Z" />
    </template>

    <!-- 현재 위치 -->
    <template v-else-if="name === 'location'">
      <path d="M20 10c0 5.2-8 12-8 12s-8-6.8-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </template>

    <!-- 새로고침 — 화살촉이 달린 원형 화살표 -->
    <template v-else-if="name === 'refresh'">
      <path d="M20 11a8 8 0 1 0-.7 4.3" />
      <path d="M20 5v6h-6" />
    </template>

    <!-- 체크 -->
    <template v-else-if="name === 'check'">
      <path d="m5 12.5 4.5 4.5L19 7" />
    </template>

    <!-- 결과 없음 — 빈 돋보기 -->
    <template v-else-if="name === 'empty'">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M8.5 11h5" />
    </template>
  </svg>
</template>

<style scoped>
.ui-icon {
  flex: none;
  vertical-align: -3px;
}
</style>
