<script setup>
/**
 * 떠 있는 머리띠.
 * ------------------------------------------------------------------
 * 화면 위에 얹히지 않고 위에 떠 있다. 배경이 비쳐 보이므로
 * 스크롤해도 아래 내용을 가리는 느낌이 덜하다.
 *
 * 왼쪽에 이름표, 가운데에 지금 보고 있는 곳, 오른쪽에 밝기 토글.
 * 셋 다 같은 알약(.pill)이라 높이가 딱 맞는다.
 */
import { RouterLink } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'

defineProps({
  /** 가운데 알약에 적을 지금 위치. 표지에서는 비운다 */
  here: { type: String, default: '' },
  /** 오른쪽에 붙일 바깥 링크 */
  live: { type: String, default: '' },
})
</script>

<template>
  <header class="head">
    <RouterLink class="mark" :to="{ name: 'index' }">
      <span class="mark-main">SKALA</span>
      <span class="mark-sub">Class 6 — Group 1</span>
    </RouterLink>

    <nav v-if="here" class="crumb">
      <RouterLink class="crumb-up" :to="{ name: 'index' }">전체</RouterLink>
      <span class="crumb-sep" aria-hidden="true">/</span>
      <span class="crumb-here">{{ here }}</span>
    </nav>

    <span class="spacer" />

    <a v-if="live" class="out" :href="live" target="_blank" rel="noreferrer">
      따로 배포한 사이트 ↗
    </a>

    <ThemeToggle />
  </header>
</template>

<style scoped>
/*
 * 참고한 사이트는 이 자리에 알약 배경을 깔지만, 거기서는 머리띠가
 * 사진 위에 떠 있어서 글자가 묻히지 않게 하려는 것이다.
 * 여기는 빈 지면 위라 그 배경이 할 일이 없다. 그래서 글자만 둔다.
 */
.head {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  height: var(--pill);
  gap: 18px;
  align-items: center;
  padding: 0 2px;
}

.spacer {
  flex: 1;
}

.mark {
  display: inline-flex;
  gap: 9px;
  align-items: baseline;
  overflow: hidden;
  white-space: nowrap;
}

.mark-main {
  letter-spacing: 0.14em;
}

/*
 * 사이트에서 세리프를 쓰는 유일한 곳.
 * 나머지가 전부 14px 산세리프 한 종류라, 이 한 줄만 다른 시대에서 온 것처럼 보인다.
 */
.mark-sub {
  color: var(--fg-muted);
  font-family: var(--font-display);
  font-size: 19px;
  font-style: italic;
  letter-spacing: 0;
  line-height: 1;
  /* 세리프는 산세리프보다 위로 떠 보여서 조금 내려 앉힌다 */
  transform: translateY(0.5px);
}

.crumb {
  display: inline-flex;
  gap: 8px;
  align-items: baseline;
  min-width: 0;
}

.crumb-up {
  color: var(--fg-muted);
  transition: color 0.3s var(--ease);
}

.crumb-up:hover {
  color: var(--fg);
}

.crumb-sep {
  color: var(--fg-muted);
}

.crumb-here {
  overflow: hidden;
  text-overflow: ellipsis;
}

.out {
  color: var(--fg-muted);
  transition: color 0.3s var(--ease);
}

.out:hover {
  color: var(--fg);
}

/* 좁은 화면에서는 부제와 바깥 링크부터 접는다 */
@media (max-width: 680px) {
  .mark-sub,
  .out {
    display: none;
  }
}
</style>
