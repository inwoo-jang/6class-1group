<script setup>
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import { tests } from '../data/personalityTests'
import { link } from '../routes'

/**
 * 테스트 — /final/tests
 *
 * 카드를 정사각형으로 세워 그림이 먼저 보이게 한다.
 * 글이 먼저 보이면 "읽어야 하는 것"이 되고, 그림이 먼저 보이면 "눌러 보는 것"이 된다.
 */
</script>

<template>
  <BaseDashboardCard>
    <div class="tests">
      <header>
        <p class="eyebrow">RULE BASED TEST</p>
        <h3>심리 테스트</h3>
        <p class="lead">
          정답은 없습니다. 오래 고민하지 말고 먼저 손이 가는 쪽을 고르세요.
        </p>
      </header>

      <ul class="grid">
        <li v-for="test in tests" :key="test.id">
          <RouterLink :to="link('test', { testId: test.id })" :style="{ '--tone': test.accent }">
            <!-- 표지: 한 장이면 꽉 채우고, 여러 장이면 2×2 로 붙인다 -->
            <span class="art" :class="{ mosaic: test.cover.length > 1 }" aria-hidden="true">
              <img v-for="(src, i) in test.cover" :key="i" :src="src" alt="" loading="lazy" />
            </span>

            <span class="veil" aria-hidden="true" />

            <span class="text">
              <span class="badge">{{ test.emoji }} {{ test.short }}</span>
              <b>{{ test.title }}</b>
              <small>{{ test.description }}</small>
              <span class="meta">
                <span>{{ test.questions.length }}문항</span>
                <span>결과 {{ Object.keys(test.results).length }}종</span>
                <span class="go">시작하기 →</span>
              </span>
            </span>
          </RouterLink>
        </li>
      </ul>

      <p class="hint">
        결과는 선택지에 붙은 점수를 더해서 정해집니다. 같은 답을 고르면 언제나 같은 결과가 나옵니다.
      </p>
    </div>
  </BaseDashboardCard>
</template>

<style scoped>
.tests {
  display: grid;
  gap: 16px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
}

h3 {
  margin: 0 0 6px;
  color: var(--ink);
  font-size: 20px;
}

.lead {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

/* ── 정사각형 카드 두 장 ── */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.grid a {
  position: relative;
  display: block;
  /* 정사각형 — 그림이 주인공이 되도록 */
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 18px;
  color: #fff;
  text-decoration: none;
  isolation: isolate;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.grid a:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--tone) 40%, transparent);
}

/* 표지 그림 */
.art {
  position: absolute;
  inset: 0;
  display: block;
}

.art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.grid a:hover .art img {
  transform: scale(1.06);
}

/* 여러 장이면 2×2 로 붙여 한 장처럼 보이게 한다 */
.art.mosaic {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

/* 글자가 놓일 자리를 만든다 — 아래로 갈수록 테스트 색이 진해진다 */
.veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    170deg,
    color-mix(in srgb, var(--tone) 10%, transparent) 0%,
    color-mix(in srgb, var(--tone) 55%, transparent) 45%,
    color-mix(in srgb, var(--tone) 94%, transparent) 100%
  );
}

.text {
  position: relative;
  display: grid;
  align-content: end;
  gap: 5px;
  height: 100%;
  padding: 16px;
}

.badge {
  justify-self: start;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.22);
  backdrop-filter: blur(6px);
  font-size: 11px;
  font-weight: 700;
}

.text b {
  font-size: 17px;
  line-height: 1.35;
  text-shadow: 0 1px 8px rgb(0 0 0 / 0.35);
}

.text small {
  color: rgb(255 255 255 / 0.85);
  font-size: 12px;
  line-height: 1.6;
  /* 설명은 두 줄까지만 — 카드 높이가 정해져 있다 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 6px;
  color: rgb(255 255 255 / 0.8);
  font-family: var(--font-mono);
  font-size: 11px;
}

.go {
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 999px;
  background: #fff;
  color: var(--tone);
  font-family: var(--font-sans);
  font-size: 11.5px;
  font-weight: 700;
}

.hint {
  margin: 0;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  color: var(--faint);
  font-size: 12px;
  line-height: 1.7;
}

@media (prefers-reduced-motion: reduce) {
  .grid a,
  .art img {
    transition: none;
  }
}
</style>
