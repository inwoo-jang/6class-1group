<script setup>
/**
 * 장인우 · 실시간 날씨 대시보드 — 껍데기
 * ------------------------------------------------------------------
 * 교안의 App.vue 자리다.
 *   내비게이션 : <RouterLink>
 *   본문       : <RouterView />
 *
 * 주소가 바뀌면 <RouterView /> 자리만 갈아끼워진다.
 * 어떤 주소가 어떤 화면인지는 옆의 routes.js 에 적혀 있다.
 *
 * ── 다른 팀원과 섞이지 않게 하는 두 가지 ──
 *  1) 모든 <style> 에 scoped 를 붙인다
 *  2) 내 색·글꼴은 아래 .inwoo 한 곳에만 선언한다.
 *     CSS 변수는 자식으로 흘러내리므로 하위 컴포넌트는 이것만 보고 그린다.
 *     body 나 :root 는 건드리지 않는다 — 갤러리 전체가 깨진다.
 */
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import WeatherBackdrop from './components/WeatherBackdrop.vue'
import { backdropStatus } from './data/backdropState'
import { link } from './routes'

const route = useRoute()

/** 현재 메뉴의 활성 상태 */
const isAbout = computed(() => route.name === 'inwoo.about')
const isTarot = computed(() => route.name === 'inwoo.tarot')
const isWeather = computed(() => route.name === 'inwoo.weather' || route.name === 'inwoo.detail')
</script>

<template>
  <div class="inwoo">
    <!-- 보고 있는 도시의 날씨가 배경이 된다 -->
    <WeatherBackdrop :status="backdropStatus" />

    <!-- 홈 · 소개 · 상세가 전부 같은 폭을 쓰도록 한 기둥 안에 넣는다 -->
    <div class="column">
      <nav class="nav">
        <RouterLink :to="link('home')" :class="{ on: !isAbout && !isTarot && !isWeather }">홈</RouterLink>
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
/* ── 내 프로젝트의 색과 글꼴. 여기서만 선언하고 자식은 물려받는다 ── */
.inwoo {
  --paper: #f2f2f0;
  --surface: #ffffff;

  --ink: #16191c;
  --ink-soft: #3d4348;
  --muted: #6f7479;
  --faint: #9b9f9f;

  --line: #e6e4de;
  --line-strong: #cfcabb;

  --accent: #0f7a4e;
  --accent-tint: #e7efe8;
  --accent-line: #b6cfc0;
  --on-accent: #ffffff;

  --signal: #9a5b18;
  --slate: #3f5666;
  --slate-tint: #ecefef;

  --font-mono: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;

  position: relative;
  display: grid;
  gap: 12px;
  overflow: hidden;
  padding: 12px;
  border-radius: 16px;
  color: var(--ink);
  background: var(--paper);
}

/* 배경(z-index 0) 위에 내용이 오도록 */
.inwoo > *:not(.backdrop) {
  position: relative;
  z-index: 1;
}

/*
 * 화면의 폭을 여기 한 곳에서 정한다.
 * 안에 들어오는 화면은 자기 너비를 신경 쓰지 않아도 되고,
 * 그래서 홈에서 소개로 넘어가도 판이 흔들리지 않는다.
 */
.column {
  display: grid;
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
  font-size: 14px;
  letter-spacing: 0.14px;
  text-decoration: none;
  transition:
    color 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    background 0.3s cubic-bezier(0.22, 1, 0.36, 1);
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
  font-size: 12px;
  overflow-wrap: anywhere;
}
</style>
