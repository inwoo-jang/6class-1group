<script setup>
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import GamePreview from '../components/GamePreview.vue'
import { link } from '../routes'

/**
 * 게임 — /final/games
 *
 * 운세·테스트가 "오늘의 나"를 보는 것이라면, 여기는 "정하지 못한 것을
 * 대신 정해 주는" 자리다. 결과는 전부 My 에 남길 수 있다.
 */
const games = [
  {
    to: 'roulette',
    title: '돌려서 정하기',
    desc: '점심 메뉴부터 오늘의 당번까지, 룰렛이 대신 골라 줍니다.',
    tag: '룰렛',
    tone: '#6a7f8c',
    ready: true,
  },
  {
    to: 'lotto',
    title: '로또 번호 뽑기',
    desc: '1부터 45까지, 오늘의 여섯 개를 뽑아 봅니다.',
    tag: '로또',
    tone: '#b08a5e',
    ready: true,
  },
]
</script>

<template>
  <BaseDashboardCard>
    <div class="games">
      <header>
        <p class="eyebrow">GAME</p>
        <h3>정하기 어려울 땐</h3>
        <p class="lead">고민하는 시간이 아까울 때, 대신 정해 드립니다.</p>
      </header>

      <ul class="list">
        <li v-for="game in games" :key="game.title">
          <component
            :is="game.ready ? 'RouterLink' : 'div'"
            v-bind="game.ready ? { to: link(game.to) } : {}"
            class="card"
            :class="{ soon: !game.ready }"
            :style="{ '--tone': game.tone }"
          >
            <GamePreview class="face" :kind="game.to" />
            <span class="body">
              <span class="tag">{{ game.tag }}</span>
              <b>{{ game.title }}</b>
              <small>{{ game.desc }}</small>
            </span>
            <span class="go">{{ game.ready ? '→' : '준비 중' }}</span>
          </component>
        </li>
      </ul>
    </div>
  </BaseDashboardCard>
</template>

<style scoped>
.games {
  display: grid;
  gap: 16px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--slate);
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

.list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 18px;
  border-radius: 18px;
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card:not(.soon):hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--tone) 26%, transparent);
}

/* 아직 안 만든 것은 눌리지 않는다는 걸 흐림으로 알린다 */
.card.soon {
  opacity: 0.55;
}

.face {
  flex: none;
}

.body {
  display: grid;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.tag {
  justify-self: start;
  padding: 2px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tone) 16%, transparent);
  color: var(--tone);
  font-size: 10.5px;
  font-weight: 700;
}

.body b {
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}

.body small {
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.6;
}

.go {
  flex: none;
  color: var(--tone);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
</style>
