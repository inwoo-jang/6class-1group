<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { link } from './routes'

const route = useRoute()
const isMagpieHeung = computed(() => route.name === 'jaeheung.magpie-heung')
</script>

<template>
  <div class="jaeheung">
    <nav class="jh-nav">
      <RouterLink :to="link('home')" :class="{ on: !isMagpieHeung }">🌤️ 날씨 대시보드</RouterLink>
      <RouterLink :to="link('magpie-heung')" :class="{ on: isMagpieHeung }">🐦 흥부와 까치</RouterLink>
    </nav>

    <RouterView />
  </div>
</template>

<style scoped>
/* 내 색·글꼴은 여기 한 곳에만 선언한다. CSS 변수는 자식으로 흘러내리므로
   하위 컴포넌트는 이것만 보고 그린다. body 나 :root 는 건드리지 않는다. */
.jaeheung {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;

  --jh-vt-white: #ffffff;
  --jh-vt-white-soft: #f8f8f8;
  --jh-vt-white-mute: #f2f2f2;
  --jh-vt-black: #181818;
  --jh-vt-black-soft: #222222;
  --jh-vt-black-mute: #282828;
  --jh-vt-indigo: #2c3e50;
  --jh-vt-divider-light-2: rgba(60, 60, 60, 0.12);
  --jh-vt-divider-dark-2: rgba(84, 84, 84, 0.48);

  --color-background: var(--jh-vt-white);
  --color-background-soft: var(--jh-vt-white-soft);
  --color-background-mute: var(--jh-vt-white-mute);
  --color-border: var(--jh-vt-divider-light-2);
  --color-heading: var(--jh-vt-indigo);
  --color-text: var(--jh-vt-indigo);

  --magpie-black: #14161a;
  --magpie-white: #fafafa;
  --magpie-blue: #2e86de;
  --magpie-teal: #17a589;
  --magpie-violet: #7c5cff;
  --magpie-gradient: linear-gradient(135deg, var(--magpie-teal), var(--magpie-blue) 55%, var(--magpie-violet));
  --magpie-accent: var(--magpie-blue);
  --magpie-accent-soft: rgba(46, 134, 222, 0.14);
  --magpie-accent-strong: rgba(46, 134, 222, 0.3);
}

@media (prefers-color-scheme: dark) {
  .jaeheung {
    --color-background: var(--jh-vt-black);
    --color-background-soft: var(--jh-vt-black-soft);
    --color-background-mute: var(--jh-vt-black-mute);
    --color-border: var(--jh-vt-divider-dark-2);
    --color-heading: #ffffff;
    --color-text: rgba(235, 235, 235, 0.8);
    --magpie-accent: var(--magpie-teal);
    --magpie-accent-soft: rgba(23, 165, 137, 0.18);
    --magpie-accent-strong: rgba(23, 165, 137, 0.35);
  }
}

.jh-nav {
  display: flex;
  gap: 8px;
  padding: 4px;
  border-radius: 999px;
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
}
.jh-nav a {
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
}
.jh-nav a.on {
  background: var(--magpie-gradient);
  color: #fff;
}
</style>
