<script setup>
/**
 * 최종 결과물 — 껍데기
 * ------------------------------------------------------------------
 * 교안의 App.vue 자리다.
 *   내비게이션 : <RouterLink>
 *   본문       : <RouterView />
 *
 * 주소가 바뀌면 <RouterView /> 자리만 갈아끼워진다.
 * 어떤 주소가 어떤 화면인지는 옆의 routes.js 에 적혀 있다.
 *
 * 색은 아래 <style scoped> 맨 위에서 이 영역(.final) 에만 선언한다.
 * 갤러리는 무채색이고 내 결과물은 종이+딥그린이라 토큰이 서로 다른데,
 * 전역 main.css 를 고치면 다른 조원 화면까지 물들기 때문이다.
 * 대신 테마 전환(<html data-theme>) 에는 같이 따라가도록 맞춰 두었다.
 */
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import WeatherBackdrop from './components/WeatherBackdrop.vue'
import { backdropStatus } from './data/backdropState'
import { link } from './routes'

const route = useRoute()

/** 상세 화면에서도 '날씨' 탭이 눌린 채로 남아야 한다 */
const isWeather = computed(() => route.name === 'inwoo.weather' || route.name === 'inwoo.detail')
const isTarot = computed(() => route.name === 'inwoo.tarot')
const isHome = computed(() => !isWeather.value && !isTarot.value)
</script>

<template>
  <div class="final">
    <!-- 보고 있는 도시의 날씨가 배경이 된다 -->
    <WeatherBackdrop :status="backdropStatus" />

    <!-- 홈 · 날씨 · 운세가 전부 같은 폭을 쓰도록 한 기둥 안에 넣는다 -->
    <div class="column">
      <nav class="nav">
        <RouterLink :to="link('home')" :class="{ on: isHome }">홈</RouterLink>
        <RouterLink :to="link('weather')" :class="{ on: isWeather }">날씨</RouterLink>
        <RouterLink :to="link('tarot')" :class="{ on: isTarot }">운세</RouterLink>
        <code class="url">{{ route.path }}</code>
      </nav>

      <!-- 주소에 맞는 화면이 여기 놓인다 -->
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
/*
 * ── 장인우 개인 팔레트 ──────────────────────────────────────────────
 * 이 토큰들은 .final 안에서만 산다. 바깥(갤러리 껍데기·다른 조원 화면)은
 * 무채색 main.css 를 그대로 쓰고, 여기 들어온 순간부터 종이+딥그린이 된다.
 * 컨셉은 원본 프로젝트와 같은 Technical Editorial — 따뜻한 종이(paper) 위에
 * 근접 블랙(ink), 누를 곳만 딥그린(accent) 하나로 찍는다.
 *
 * light-dark(밝을 때, 어두울 때) 는 바로 아래 color-scheme 을 보고 고른다.
 * 그래서 값을 두 벌 적지 않고 한 줄에 나란히 둘 수 있다.
 * 밝을 때는 EDITORIAL, 어두울 때는 TERMINAL(어두운 IDE) 배색이다.
 */
.final {
  /* 갤러리 헤더의 테마 토글이 <html data-theme> 를 바꾸면 여기가 따라간다 */
  color-scheme: light dark;

  --paper: light-dark(#f6f4ef, #14181f);
  --surface: light-dark(#fffefb, #1b212b);

  --ink: light-dark(#16191c, #e8edf4);
  --ink-soft: light-dark(#3d4348, #c2ccda);
  --muted: light-dark(#6f7479, #8b98a9);
  --faint: light-dark(#9b9f9f, #6c7889);

  --line: light-dark(#e4e0d6, #2b3543);
  --line-strong: light-dark(#cfcabb, #3c4859);

  --accent: light-dark(#0f7a4e, #3ddc97);
  --accent-tint: light-dark(#e7efe8, #1c2b28);
  --accent-line: light-dark(#b6cfc0, #2f4a41);
  --on-accent: light-dark(#ffffff, #0d1b16);

  --signal: light-dark(#9a5b18, #e8a866);
  --signal-tint: light-dark(#f7efe3, #2a2318);

  --slate: light-dark(#3f5666, #79b8e0);
  --slate-tint: light-dark(#ecefef, #1a2530);
}

/* 토글로 콕 집어 정했으면 OS 설정보다 그쪽이 이긴다 */
:root[data-theme='light'] .final {
  color-scheme: light;
}

:root[data-theme='dark'] .final {
  color-scheme: dark;
}

.final {
  position: relative;
  display: grid;
  overflow: hidden;
  min-height: 70vh;
  padding: 12px;
  border-radius: 16px;
  background: var(--paper);
}

/* 배경(z-index 0) 위에 내용이 오도록 */
.final > *:not(.backdrop) {
  position: relative;
  z-index: 1;
}

/*
 * 화면의 폭을 여기 한 곳에서 정한다.
 * 안에 들어오는 화면은 자기 너비를 신경 쓰지 않아도 되고,
 * 그래서 홈에서 날씨로 넘어가도 판이 흔들리지 않는다.
 */
.column {
  display: grid;
  /*
   * minmax(0, 1fr) 이 없으면 안 되는 이유 —
   * grid 칸은 기본이 min-width: auto 라, 시간별 예보처럼 가로로 긴 내용이
   * 들어오면 칸이 그만큼 벌어져 max-width 를 넘어가 버린다.
   * 0 을 최소로 못박아야 넘치는 대신 그 안에서 스크롤된다.
   */
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 12px;
  width: 100%;
  max-width: 660px;
  margin: 0 auto;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  align-items: center;
  padding: 2px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 72%, transparent);
  backdrop-filter: blur(10px);
}

.nav a {
  padding: 8px 16px;
  border-radius: 999px;
  color: var(--muted);
  font-size: 13.5px;
  font-weight: 600;
  text-decoration: none;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.nav a:hover {
  color: var(--ink);
}

.nav a.on {
  color: var(--on-accent);
  background: var(--accent);
}

.url {
  margin-left: auto;
  padding: 0 12px;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11.5px;
  overflow-wrap: anywhere;
}

@media (max-width: 620px) {
  .url {
    display: none;
  }
}
</style>
