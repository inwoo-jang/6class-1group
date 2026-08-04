<script setup>
import { RouterLink, useRoute } from 'vue-router'
import SiteHeader from '../components/SiteHeader.vue'

const route = useRoute()
</script>

<template>
  <div class="nf">
    <SiteHeader here="404" />

    <main class="panel">
      <p class="state">404</p>
      <h2>그런 페이지는 없습니다</h2>
      <p class="path">
        <code>{{ route.fullPath }}</code>
      </p>
      <RouterLink class="pill back" :to="{ name: 'index' }">← 전체 보기</RouterLink>
    </main>
  </div>
</template>

<style scoped>
.nf {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  min-height: 100vh;
  padding: var(--edge);
}

.panel {
  display: grid;
  flex: 1;
  align-content: center;
  gap: 14px;
  padding: clamp(60px, 18vh, 160px) 24px;
  border-radius: var(--radius);
  background: var(--card);
  justify-items: center;
  text-align: center;
}

.state {
  margin: 0;
  color: var(--fg-muted);
  font-family: var(--font-mono);
}

h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.14px;
  line-height: 16px;
}

.path {
  margin: 0;
  color: var(--fg-muted);
}

.path code {
  font-family: var(--font-mono);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.back {
  margin-top: 10px;
  background: var(--surface);
  transition:
    color 0.3s var(--ease),
    background 0.3s var(--ease);
}

.back:hover {
  color: var(--on-fg);
  background: var(--fg);
}
</style>
