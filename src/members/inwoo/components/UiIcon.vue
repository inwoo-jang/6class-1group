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

    <!-- 네잎클로버 — 행운지수 -->
    <template v-else-if="name === 'clover'">
      <path d="M12 12c0-2.2-1.3-4-3.2-4A2.8 2.8 0 0 0 6 10.8C6 12.6 8.4 12 12 12Z" />
      <path d="M12 12c2.2 0 4-1.3 4-3.2A2.8 2.8 0 0 0 13.2 6C11.4 6 12 8.4 12 12Z" />
      <path d="M12 12c0 2.2 1.3 4 3.2 4A2.8 2.8 0 0 0 18 13.2C18 11.4 15.6 12 12 12Z" />
      <path d="M12 12c-2.2 0-4 1.3-4 3.2A2.8 2.8 0 0 0 10.8 18c1.8 0 1.2-2.4 1.2-6Z" />
      <path d="M12.6 12.6 16 20" />
    </template>

    <!-- 해와 구름 — 날씨 -->
    <template v-else-if="name === 'sun-cloud'">
      <circle cx="8.6" cy="8" r="3.1" />
      <path d="M8.6 2.4v1.3M3 8h1.3M4.8 4.2l.9.9M12.4 4.2l-.9.9M3.1 13.1l.9-.9" />
      <path d="M17.6 20H9.4a3.7 3.7 0 0 1-.5-7.4 5 5 0 0 1 9.5 1.2A3.1 3.1 0 0 1 17.6 20Z" />
    </template>

    <!-- 달과 별 — 운세 -->
    <template v-else-if="name === 'moon-star'">
      <path d="M20.2 15.3A7.6 7.6 0 0 1 10 5.1a8 8 0 1 0 10.2 10.2Z" />
      <path d="m17.4 3 .8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8Z" />
    </template>

    <!-- 체크리스트 — 심리테스트 -->
    <template v-else-if="name === 'checklist'">
      <path d="M9.2 3.8h5.6a1 1 0 0 1 1 1v1.1H8.2V4.8a1 1 0 0 1 1-1Z" />
      <path d="M15.8 5.6h1.4a1.7 1.7 0 0 1 1.7 1.7v11.4a1.7 1.7 0 0 1-1.7 1.7H6.8a1.7 1.7 0 0 1-1.7-1.7V7.3a1.7 1.7 0 0 1 1.7-1.7h1.4" />
      <path d="m8.8 12.6 1.8 1.8 3.6-3.6" />
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
