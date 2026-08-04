<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="jaeheung">
    <RouterView />
  </div>
</template>

<style scoped>
/* 내 색·글꼴은 여기 한 곳에만 선언한다. CSS 변수는 자식으로 흘러내리므로
   하위 컴포넌트는 이것만 보고 그린다. body 나 :root 는 건드리지 않는다.

   갤러리는 무채색이라 파랑·청록·보라가 혼자 튀었다. 변수 이름은 그대로 두고
   값만 갤러리 토큰(--fg · --card · --surface)에 맞췄다. 그래서 하위 컴포넌트는
   한 줄도 고칠 필요가 없다. */
.jaeheung {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;

  /* 배경 · 글자 — 갤러리의 카드 색과 글자색을 그대로 쓴다 */
  --color-background: var(--surface);
  --color-background-soft: var(--surface);
  --color-background-mute: var(--card);
  --color-border: color-mix(in srgb, var(--fg) 12%, transparent);
  --color-heading: var(--fg);
  --color-text: var(--fg-muted);

  /* 강조 — 무채색 갤러리에서는 검정이 강조다 */
  --magpie-black: #14161a;
  --magpie-white: #fafafa;
  --magpie-accent: var(--fg);
  --magpie-accent-soft: color-mix(in srgb, var(--fg) 10%, transparent);

  /* 예전에는 버튼과 카드 위 띠가 같은 그라데이션 하나를 나눠 썼다.
     무채색으로 바꾸니 둘의 사정이 갈렸다 — 버튼은 눌러야 해서 진해야 하고,
     띠는 장식이라 옅어야 한다. 그래서 변수도 둘로 나눈다. */
  --magpie-gradient: var(--fg);
  --magpie-on-accent: var(--on-fg);
  --magpie-strip: color-mix(in srgb, var(--fg) 16%, transparent);
}
</style>
