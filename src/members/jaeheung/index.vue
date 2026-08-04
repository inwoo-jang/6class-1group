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

  /*
   * 패널은 바닥보다 밝아야 떠 보인다. 갤러리의 --surface 를 그대로 쓰면
   * 바닥(--page)보다 어두워서 종이가 아니라 판때기처럼 눌려 보였다.
   */
  --color-background: #ffffff;
  --color-background-soft: #ffffff;
  --color-background-mute: color-mix(in srgb, var(--fg) 4%, transparent);

  /* 까치 꼬리·날개의 광택 — 화면은 무채색이어도 그림 하나쯤은 색을 가져도 좋다 */
  --magpie-sheen: #4a6b8a;
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

/*
 * 어두운 화면. 갤러리는 시스템 설정과 우측 상단 토글 두 가지로 전환한다.
 *
 * 까치는 원래 검정인데 어두운 판 위에서는 형체가 사라진다.
 * 그래서 어두울 때만 몸빛을 밝은 흑연색으로 뒤집는다 — 실루엣이 남는 쪽이
 * "안 보이는 검정"보다 낫다.
 */
@media (prefers-color-scheme: dark) {
  .jaeheung {
    --color-background: #1e1e1e;
    --color-background-soft: #1e1e1e;
    --color-background-mute: color-mix(in srgb, var(--fg) 7%, transparent);
    --magpie-black: #d5dae0;
    --magpie-white: #2a2a2a;
    --magpie-sheen: #7fa6c9;
  }
}

:root[data-theme='light'] .jaeheung {
  --color-background: #ffffff;
  --color-background-soft: #ffffff;
  --color-background-mute: color-mix(in srgb, var(--fg) 4%, transparent);
  --magpie-black: #14161a;
  --magpie-white: #fafafa;
  --magpie-sheen: #4a6b8a;
}

:root[data-theme='dark'] .jaeheung {
  --color-background: #1e1e1e;
  --color-background-soft: #1e1e1e;
  --color-background-mute: color-mix(in srgb, var(--fg) 7%, transparent);
  --magpie-black: #d5dae0;
  --magpie-white: #2a2a2a;
  --magpie-sheen: #7fa6c9;
}
</style>
