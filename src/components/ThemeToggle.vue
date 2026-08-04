<script setup>
/**
 * 밝기 토글.
 * 처음에는 기기 설정을 그대로 따르고, 한 번 누른 뒤부터는
 * 고른 값을 기억한다. 값은 <html data-theme> 한 곳에만 적는다.
 */
import { onMounted, ref } from 'vue'

const KEY = 'gallery-theme'
const isDark = ref(false)

const apply = (dark) => {
  isDark.value = dark
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

onMounted(() => {
  const saved = localStorage.getItem(KEY)
  apply(saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches)
})

const toggle = () => {
  apply(!isDark.value)
  localStorage.setItem(KEY, isDark.value ? 'dark' : 'light')
}
</script>

<template>
  <button
    class="toggle"
    type="button"
    :aria-label="isDark ? '밝게 보기' : '어둡게 보기'"
    @click="toggle"
  >
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <!-- 해 → 달. 원 하나를 가리는 원으로 모양을 바꾼다 -->
      <mask id="moon">
        <rect width="16" height="16" fill="white" />
        <circle :cx="isDark ? 11 : 16" :cy="isDark ? 4 : 0" r="5" fill="black" />
      </mask>
      <circle cx="8" cy="8" :r="isDark ? 5.5 : 3.4" fill="currentColor" mask="url(#moon)" />
      <g v-if="!isDark" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
        <path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9L13 13M13 3l-1.1 1.1M4.1 11.9L3 13" />
      </g>
    </svg>
  </button>
</template>

<style scoped>
.toggle {
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  color: var(--fg-muted);
  background: none;
  cursor: pointer;
  transition: color 0.3s var(--ease);
}

.toggle:hover {
  color: var(--fg);
}

svg {
  transition: transform 0.4s var(--ease);
}

.toggle:hover svg {
  transform: rotate(35deg);
}
</style>
