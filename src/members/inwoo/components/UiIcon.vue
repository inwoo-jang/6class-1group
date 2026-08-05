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

    <!--
      아래 네 개는 홈의 바로가기에 나란히 놓인다.
      선 굵기·크기가 제각각이면 한 줄에 놓였을 때 들쭉날쭉해 보이므로
      모두 같은 원(반지름 8 정도) 안에 들어오게 맞춰 두었다.
    -->

    <!-- 해와 구름 — 날씨 -->
    <template v-else-if="name === 'sun-cloud'">
      <circle cx="9" cy="8.2" r="3.3" />
      <path d="M9 2.6v1.4M3.6 8.2H5M5.2 4.4l1 1M12.8 4.4l-1 1" />
      <path d="M17.4 20H9.6a3.6 3.6 0 0 1-.5-7.2 4.9 4.9 0 0 1 9.3 1.2A3 3 0 0 1 17.4 20Z" />
    </template>

    <!-- 달과 별 — 운세 -->
    <template v-else-if="name === 'moon-star'">
      <path d="M19.6 14.9A7.4 7.4 0 0 1 9.4 4.7a7.8 7.8 0 1 0 10.2 10.2Z" />
      <path d="m17.6 3.4.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7Z" />
    </template>

    <!-- 체크리스트 — 심리테스트 -->
    <template v-else-if="name === 'checklist'">
      <rect x="4.6" y="5.4" width="14.8" height="14.6" rx="2.6" />
      <path d="M9.4 3.4h5.2a1 1 0 0 1 1 1v1.2a1 1 0 0 1-1 1H9.4a1 1 0 0 1-1-1V4.4a1 1 0 0 1 1-1Z" />
      <path d="m9.2 13.4 2 2 3.6-3.8" />
    </template>

    <!-- 룰렛판 — 게임 -->
    <template v-else-if="name === 'wheel'">
      <circle cx="12" cy="12.6" r="7.6" />
      <!-- 살은 넷만. 여덟 개를 다 그으면 작은 크기에서 뭉쳐 보인다 -->
      <path d="M12 5v15.2M4.4 12.6h15.2" />
      <circle cx="12" cy="12.6" r="1.9" />
      <path d="M12 2.4 13.9 5h-3.8Z" />
    </template>

    <!-- 톱니 — 환경 설정 -->
    <template v-else-if="name === 'gear'">
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.3 14.6a1.5 1.5 0 0 0 .3 1.65l.06.05a1.8 1.8 0 1 1-2.55 2.55l-.05-.06a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.91 1.37v.14a1.8 1.8 0 1 1-3.6 0v-.07a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.05.06a1.8 1.8 0 1 1-2.55-2.55l.06-.05a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.91h-.14a1.8 1.8 0 1 1 0-3.6h.07a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65l-.06-.05A1.8 1.8 0 1 1 7.68 4.7l.05.06a1.5 1.5 0 0 0 1.65.3h.07a1.5 1.5 0 0 0 .91-1.37v-.14a1.8 1.8 0 1 1 3.6 0v.07a1.5 1.5 0 0 0 .91 1.37 1.5 1.5 0 0 0 1.65-.3l.05-.06a1.8 1.8 0 1 1 2.55 2.55l-.06.05a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.91h.14a1.8 1.8 0 1 1 0 3.6h-.07a1.5 1.5 0 0 0-1.37.91Z" />
    </template>

    <!-- 하트 — '내 마음' 을 다루는 테스트에 붙는다 -->
    <template v-else-if="name === 'heart'">
      <path d="M12 20.3 4.8 13.4a4.6 4.6 0 0 1 0-6.6 4.8 4.8 0 0 1 6.7 0l.5.5.5-.5a4.8 4.8 0 0 1 6.7 0 4.6 4.6 0 0 1 0 6.6Z" />
    </template>

    <!-- 종이비행기 — 스토리를 보내고 받는 자리 -->
    <template v-else-if="name === 'send'">
      <path d="M21 3 10.5 13.5" />
      <path d="M21 3 14.4 21l-3.9-7.5L3 9.6Z" />
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
