<script setup>
import { RouterLink } from 'vue-router'
import { link } from '../routes'
</script>

<template>
  <main class="home-page">
    <section class="home-hero">
      <p class="home-eyebrow">TODAY, AT A GLANCE</p>
      <h1>오늘을 조금 더<br />기분 좋게 시작해요.</h1>
      <p>실시간 날씨를 확인하고, 오늘의 타로 카드로 가벼운 힌트도 받아 보세요.</p>
    </section>

    <section class="home-links" aria-label="서비스 바로가기">
      <RouterLink :to="link('weather')" class="home-link weather-link">
        <span>☁</span>
        <strong>날씨</strong>
        <small>지금 도시의 날씨 확인하기</small>
      </RouterLink>
      <RouterLink :to="link('tarot')" class="home-link tarot-link">
        <span>✶</span>
        <strong>운세</strong>
        <small>오늘의 타로 한 장 뽑기</small>
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.home-page { display: grid; gap: 12px; }
.home-hero, .home-link { border: 1px solid color-mix(in srgb, var(--surface) 75%, transparent); border-radius: 22px; background: color-mix(in srgb, var(--surface) 82%, transparent); backdrop-filter: blur(12px); }
.home-hero { padding: 34px 28px; }
.home-eyebrow { margin: 0 0 12px; color: var(--accent); font-family: var(--font-mono); font-size: 11px; letter-spacing: .1em; }
h1 { margin: 0; color: var(--ink); font-size: clamp(30px, 7vw, 42px); font-weight: 600; line-height: 1.18; }
.home-hero > p:last-child { max-width: 420px; margin: 16px 0 0; color: var(--ink-soft); line-height: 1.65; }
.home-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.home-link { display: grid; gap: 8px; min-height: 170px; padding: 22px; color: var(--ink); text-decoration: none; transition: transform .2s ease, background .2s ease; }
.home-link:hover { transform: translateY(-3px); background: var(--surface); }
.home-link > span { font-size: 30px; line-height: 1; }
.home-link strong { margin-top: auto; font-size: 25px; font-weight: 600; }
.home-link small { color: var(--muted); }
.weather-link > span { color: #49788d; }
.tarot-link > span { color: #755899; }
@media (max-width: 420px) { .home-links { grid-template-columns: 1fr; } }
</style>
