<script setup>
import { RouterView, RouterLink } from 'vue-router'
import UnitToggler from './components/practices/assignment/UnitToggler.vue'
import { link } from './routes'
</script>

<template>
  <div class="jiyoung">
    <nav class="nav-links">
      <RouterLink :to="link('home')">홈</RouterLink>
      <RouterLink :to="link('about')">About</RouterLink>
      <RouterLink :to="link('menu')">오늘의 메뉴 추천</RouterLink>
      <UnitToggler class="unit-position" />
    </nav>
    <RouterView />
  </div>
</template>

<style scoped>
.jiyoung {
  --accent: #6c4ab6;
  --paper: #f3eefc;
  --ink: #4b2e83;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}
@media (prefers-color-scheme: dark) {
  .jiyoung { --paper: #1a1625; --ink: #e8dffa; }
}
:root[data-theme='light'] .jiyoung { --paper: #f3eefc; --ink: #4b2e83; }
:root[data-theme='dark'] .jiyoung { --paper: #1a1625; --ink: #e8dffa; }

.nav-links {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.nav-links a {
  text-decoration: none;
  color: var(--accent);
  font-weight: bold;
}
.unit-position {
  margin-left: auto;
}
</style>