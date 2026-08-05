<script setup>
import { computed, ref, watch } from 'vue'
import GamePreview from './GamePreview.vue'
import { useStripTick } from '../data/stripTick'
import { link } from '../routes'

/**
 * 게임 띠 — 테스트 띠 바로 아래에 눕는 배너.
 *
 * 테스트 띠와 같은 규칙으로 돈다(3초 · 마우스 올리면 멈춤 · 안 보이면 멈춤).
 * 다만 색은 더 선명하게 간다 — 테스트가 사진이라 차분한 반면, 여기는 도형
 * 하나뿐이라 색이 옅으면 그냥 빈 띠처럼 보인다.
 */
const slides = computed(() => [
  {
    key: 'roulette',
    to: 'roulette',
    kind: 'roulette',
    tag: '룰렛',
    title: '못 정하겠으면, 돌려서 정하기',
    lead: '점심 메뉴 · 오늘의 당번 · 벌칙 내기까지 룰렛이 대신 골라 줍니다.',
    from: '#ff9a6b',
    to2: '#ff6f91',
  },
  {
    key: 'lotto',
    to: 'lotto',
    kind: 'lotto',
    tag: '로또',
    title: '오늘의 여섯 개, 뽑아 볼까요',
    lead: '추첨기에서 공이 하나씩 굴러 나옵니다. 한 번에도, 하나씩도.',
    from: '#5aa9f5',
    to2: '#8a7bf0',
  },
])

const index = ref(0)

/*
 * 넘기는 박자는 두 띠가 함께 쓴다 (data/stripTick.js).
 * 각자 시계를 들면 조금씩 어긋난 시각에 넘어가 화면 아래가 계속 들썩인다.
 */
const { tick, hold, release } = useStripTick()

watch(tick, () => {
  index.value = (index.value + 1) % slides.value.length
})

const go = (next) => {
  const size = slides.value.length
  index.value = ((next % size) + size) % size
}

</script>

<template>
  <section
    class="strip"
    aria-label="게임"
    @mouseenter="hold"
    @mouseleave="release"
    @focusin="hold"
    @focusout="release"
  >
    <div class="window">
      <ul class="track" :style="{ transform: `translateX(-${index * 100}%)` }">
        <li
          v-for="(slide, i) in slides"
          :key="slide.key"
          :style="{ '--from': slide.from, '--to': slide.to2 }"
          :aria-hidden="i !== index"
        >
          <RouterLink :to="link(slide.to)" :tabindex="i === index ? 0 : -1">
            <span class="art" aria-hidden="true">
              <GamePreview :kind="slide.kind" />
            </span>

            <span class="body">
              <span class="tag">{{ slide.tag }}</span>
              <b>{{ slide.title }}</b>
              <small>{{ slide.lead }}</small>
            </span>

            <span class="cta">하러 가기 →</span>
          </RouterLink>
        </li>
      </ul>
    </div>

    <div class="dots" role="tablist" aria-label="게임 넘기기">
      <button
        v-for="(slide, i) in slides"
        :key="slide.key"
        type="button"
        role="tab"
        :aria-selected="i === index"
        :aria-label="`${i + 1}번째 · ${slide.tag}`"
        :class="{ on: i === index }"
        @click="go(i)"
      />
    </div>
  </section>
</template>

<style scoped>
.strip {
  display: grid;
  gap: 8px;
}

.window {
  overflow: hidden;
  border-radius: 16px;
}

.track {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.track > li {
  flex: 0 0 100%;
  min-width: 0;
}

.track a {
  display: flex;
  gap: 14px;
  align-items: center;
  min-height: 84px;
  padding: 10px 18px;
  /* 옅은 색은 도형 하나만 놓인 띠에서 빈칸처럼 보인다. 선명하게 채운다 */
  background: linear-gradient(105deg, var(--from), var(--to));
  color: #fff;
  text-decoration: none;
}

.art {
  display: grid;
  flex: none;
  place-items: center;
  width: 62px;
  height: 62px;
  border-radius: 18px;
  background: rgb(255 255 255 / 0.22);
}

.body {
  display: grid;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.tag {
  justify-self: start;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.24);
  font-size: 10.5px;
  font-weight: 700;
}

.body b {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.body small {
  overflow: hidden;
  color: rgb(255 255 255 / 0.86);
  font-size: 12px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cta {
  flex: none;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.9);
  color: #2b3038;
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
}

.dots {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.dots button {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ink) 18%, transparent);
  cursor: pointer;
  transition:
    width 0.25s ease,
    background 0.25s ease;
}

.dots button.on {
  width: 18px;
  background: #ff8f6b;
}

@media (max-width: 720px) {
  .track a {
    gap: 10px;
    min-height: 80px;
    padding: 10px 14px;
  }

  .art {
    width: 52px;
    height: 52px;
    border-radius: 15px;
  }

  .body b {
    font-size: 13.5px;
  }

  .body small {
    font-size: 11px;
  }

  .cta {
    padding: 6px 11px;
    font-size: 11.5px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .track {
    transition: none;
  }
}
</style>
