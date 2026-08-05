<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { tests } from '../data/personalityTests'
import { link } from '../routes'

/**
 * 테스트 띠 — 대시보드 맨 아래에 길게 눕는 배너.
 *
 * 날씨를 보러 온 사람에게 "이런 것도 있어요"를 흘려 주는 자리다.
 * 3초마다 옆으로 한 칸씩 넘어가고, 마지막 장 다음에는 처음으로 돌아온다.
 *
 * 자동으로 움직이는 것에는 반드시 멈출 방법이 있어야 한다.
 *   · 마우스를 올리거나 키보드 초점이 들어오면 멈춘다 (읽는 중에 넘어가면 성가시다)
 *   · 탭이 안 보이면 멈춘다 (보이지도 않는 화면을 계속 돌릴 이유가 없다)
 *   · 움직임을 줄여 달라고 설정한 사람에게는 아예 돌리지 않는다
 */
const SLIDE_MS = 3000

/** 테스트 하나에 한 장. 같은 테스트가 두 번 뜨면 넘어가는 의미가 없다 */
const slides = computed(() =>
  tests.map((test) => ({
    key: test.id,
    test,
    title: test.title,
    lead: test.description,
    art: test.cover ?? [],
  })),
)

const index = ref(0)
const isPaused = ref(false)

const go = (next) => {
  const size = slides.value.length
  index.value = ((next % size) + size) % size
}

let timer = 0

const stop = () => {
  if (timer) window.clearInterval(timer)
  timer = 0
}

const start = () => {
  stop()
  // 움직임을 줄여 달라는 설정이면 자동 전환을 걸지 않는다
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  timer = window.setInterval(() => {
    if (!isPaused.value && document.visibilityState === 'visible') go(index.value + 1)
  }, SLIDE_MS)
}

const onVisibility = () => {
  if (document.visibilityState === 'visible') start()
  else stop()
}

onMounted(() => {
  start()
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  stop()
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <section
    class="strip"
    aria-label="심리 테스트"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
    @focusin="isPaused = true"
    @focusout="isPaused = false"
  >
    <!-- 창 하나에 여러 장을 옆으로 이어 붙이고 통째로 민다 -->
    <div class="window">
      <ul class="track" :style="{ transform: `translateX(-${index * 100}%)` }">
        <li
          v-for="(slide, i) in slides"
          :key="slide.key"
          :style="{ '--tone': slide.test.accent }"
          :aria-hidden="i !== index"
        >
          <RouterLink :to="link('test', { testId: slide.test.id })" :tabindex="i === index ? 0 : -1">
            <span class="art" aria-hidden="true">
              <img v-for="(src, n) in slide.art" :key="n" :src="src" alt="" loading="lazy" />
            </span>

            <span class="body">
              <span class="tag">{{ slide.test.emoji }} {{ slide.test.short }}</span>
              <b>{{ slide.title }}</b>
              <small>{{ slide.lead }}</small>
            </span>

            <span class="cta">하러 가기 →</span>
          </RouterLink>
        </li>
      </ul>
    </div>

    <!-- 지금 몇 번째인지 + 직접 넘기기 -->
    <div class="dots" role="tablist" aria-label="테스트 넘기기">
      <button
        v-for="(slide, i) in slides"
        :key="slide.key"
        type="button"
        role="tab"
        :aria-selected="i === index"
        :aria-label="`${i + 1}번째 · ${slide.test.short}`"
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
  min-height: 96px;
  padding: 14px 18px;
  background: linear-gradient(
    100deg,
    color-mix(in srgb, var(--tone) 88%, transparent),
    color-mix(in srgb, var(--tone) 62%, transparent)
  );
  color: #fff;
  text-decoration: none;
}

/* 그림 — 한 장이면 크게, 여러 장이면 겹쳐 늘어놓는다 */
.art {
  display: flex;
  flex: none;
}

.art img {
  width: 62px;
  height: 62px;
  border: 2px solid #fff;
  border-radius: 50%;
  object-fit: cover;
}

.art img + img {
  margin-left: -18px;
}

.body {
  display: grid;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.tag {
  justify-self: start;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.22);
  font-size: 10.5px;
  font-weight: 700;
}

.body b {
  font-size: 15px;
  line-height: 1.4;
}

.body small {
  color: rgb(255 255 255 / 0.85);
  font-size: 11.5px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cta {
  flex: none;
  padding: 8px 14px;
  border-radius: 999px;
  background: #fff;
  color: var(--tone);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

/* ── 점 ── */
.dots {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.dots button {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--line-strong);
  cursor: pointer;
  transition:
    width 0.25s ease,
    background 0.25s ease;
}

.dots button.on {
  width: 20px;
  background: var(--accent);
}

@media (max-width: 560px) {
  .cta {
    display: none;
  }

  .art img + img {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .track {
    transition: none;
  }
}
</style>
