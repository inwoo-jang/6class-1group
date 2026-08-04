<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useConfigStore } from '../stores/configStore'

/**
 * 온도 단위 토글 — 도구 줄에 놓는 한 칸짜리 스위치.
 *
 * 예전에는 ℃ · ℉ 를 각각 누르는 두 칸짜리 버튼이었는데,
 * 고를 수 있는 값이 둘뿐이라 "누를 곳을 고르는" 동작이 오히려 번거로웠다.
 * 지금은 어디를 눌러도 반대편으로 넘어가는 토글이다. 클릭 한 번 = 전환 한 번.
 *
 * 다만 지금 어느 쪽인지는 계속 보여야 해서 글자 두 개는 그대로 띄우고,
 * 뒤에서 알약(.thumb)이 미끄러져 현재 단위를 덮는 방식으로 표시한다.
 *
 * 부모에게서 받는 것도, 부모에게 올리는 것도 없다. Store 하나만 본다.
 */
const configStore = useConfigStore()
const { unit } = storeToRefs(configStore)
const { toggleUnit } = configStore

/** 화씨일 때 알약을 오른쪽으로 민다 */
const isFahrenheit = computed(() => unit.value === 'fahrenheit')

/**
 * 스크린리더에는 "지금 무엇인지"와 "누르면 무엇이 되는지"를 같이 알린다.
 * 글자(℃/℉)만으로는 읽어 주는 내용이 빈약하다.
 */
const label = computed(() =>
  isFahrenheit.value ? '화씨 표시 중, 누르면 섭씨' : '섭씨 표시 중, 누르면 화씨',
)
</script>

<template>
  <button
    type="button"
    class="unit-switch"
    role="switch"
    :class="{ fahrenheit: isFahrenheit }"
    :aria-checked="isFahrenheit"
    :aria-label="label"
    :title="label"
    @click="toggleUnit()"
  >
    <!-- 현재 단위를 덮는 알약. 글자 뒤에 깔리고 좌우로 미끄러진다 -->
    <span class="thumb" aria-hidden="true" />

    <!-- 글자는 늘 둘 다 보인다. 덮인 쪽이 현재 단위 -->
    <span class="mark c">℃</span>
    <span class="mark f">℉</span>
  </button>
</template>

<style scoped>
/* 색 토큰은 이 영역의 뿌리인 index.vue 의 .final 에서 내려온다 */
.unit-switch {
  position: relative;
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  cursor: pointer;
  font: inherit;
}

/* 좌우로 미끄러지는 알약 — 폭은 안쪽 영역의 절반 */
.thumb {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  width: calc(50% - 2px);
  border-radius: 999px;
  background: var(--accent);
  transition: transform 0.3s var(--ease);
}

.unit-switch.fahrenheit .thumb {
  transform: translateX(100%);
}

.mark {
  position: relative; /* 알약 위로 올린다 */
  z-index: 1;
  min-width: 26px;
  padding: 3px 7px;
  color: var(--faint);
  font-size: 11.5px;
  font-weight: 700;
  line-height: 1.5;
  text-align: center;
  transition: color 0.3s var(--ease);
}

/*
 * 알약에 덮인 쪽 글자만 반전시킨다.
 * .c / .f 로 콕 집는다 — :first-of-type 은 "span 중 첫째"라서
 * 앞에 놓인 .thumb 이 걸려 버린다.
 */
.unit-switch:not(.fahrenheit) .mark.c,
.unit-switch.fahrenheit .mark.f {
  color: var(--on-accent);
}

/* 덮이지 않은 쪽만 hover 에 반응한다 */
.unit-switch:hover .mark.c,
.unit-switch:hover .mark.f {
  color: var(--accent);
}

.unit-switch:hover:not(.fahrenheit) .mark.c,
.unit-switch:hover.fahrenheit .mark.f {
  color: var(--on-accent);
}

/* 움직임 줄이기 설정은 main.css 가 전역으로 끄고 있어 여기서 또 적지 않는다 */
</style>
