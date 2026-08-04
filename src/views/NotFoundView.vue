<script setup>
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="nf page">
    <p class="eyebrow">404</p>
    <h2>그런 페이지는 없습니다</h2>
    <p class="path"><code>{{ route.fullPath }}</code></p>
    <RouterLink class="to-index" :to="{ name: 'index' }">목록으로</RouterLink>
  </div>
</template>

<style scoped>
.nf {
  padding: clamp(90px, 22vh, 220px) 0 160px;
}

h2 {
  margin: 18px 0 0;
  font-size: clamp(26px, 4vw, 44px);
  font-weight: 400;
  letter-spacing: -0.03em;
}

.path {
  margin: 14px 0 0;
  color: var(--faint);
  font-size: 12.5px;
}

.path code {
  font-family: var(--font-mono);
}

.to-index {
  display: inline-block;
  margin-top: 34px;
  padding: 11px 20px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  font-size: 13px;
}

.to-index:hover {
  border-color: var(--ink);
}
</style>
