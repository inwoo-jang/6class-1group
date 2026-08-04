<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { tarotCards } from '../data/tarotCards'

const selectedCard = ref(null)
const isReversed = ref(false)
const allowReversed = ref(false)
const isShuffling = ref(false)

const makeShuffledDeck = () => [...tarotCards].sort(() => Math.random() - 0.5)
const shuffledCards = ref(makeShuffledDeck())
const deckVersion = ref(0)

// 리플 셔플 연출용 더미. slot 짝/홀로 좌우를 나눠 두면 그대로 교차 순서가 된다.
const SHUFFLE_MS = 1300
const shuffleDeck = Array.from({ length: 18 }, (_, slot) => ({
  slot,
  side: slot % 2 === 0 ? 'left' : 'right',
  order: Math.floor(slot / 2),
}))

const shuffleCardStyle = (card) => ({
  '--slot': card.slot,
  '--order': card.order,
  zIndex: card.slot,
})

const formattedDate = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

let shuffleTimer = 0

const shuffleCards = () => {
  if (isShuffling.value) return
  isShuffling.value = true
  selectedCard.value = null
  isReversed.value = false
  shuffleTimer = window.setTimeout(() => {
    shuffledCards.value = makeShuffledDeck()
    deckVersion.value += 1
    isShuffling.value = false
  }, SHUFFLE_MS)
}

onBeforeUnmount(() => window.clearTimeout(shuffleTimer))

const chooseCard = (card) => {
  selectedCard.value = card
  isReversed.value = allowReversed.value && Math.random() >= 0.5
}

const cardLabel = computed(() => selectedCard.value?.name ?? '오늘의 카드를 뽑아 보세요')
const readingMessage = computed(() => {
  if (!selectedCard.value) return ''
  return isReversed.value
    ? `${selectedCard.value.message} 다만 오늘은 서두르기보다, 막힌 부분을 천천히 풀어가는 데 집중해 보세요.`
    : selectedCard.value.message
})
</script>

<template>
  <main class="tarot-page">
    <section class="tarot-intro">
      <p class="tarot-eyebrow">DAILY TAROT · 78 CARDS</p>
      <h1>오늘의 운세</h1>
      <p>{{ formattedDate }} · 잠시 숨을 고르고, 지금 가장 궁금한 것을 떠올려 보세요.</p>
    </section>

    <section class="tarot-reading">
      <div class="tarot-card-frame">
        <img
          v-if="selectedCard"
          :src="selectedCard.image"
          :alt="`${selectedCard.name} 타로 카드`"
          class="tarot-card-image"
        />
        <div v-else class="tarot-card-back" aria-hidden="true"><span>✶</span></div>
      </div>

      <div class="tarot-copy" aria-live="polite">
        <template v-if="selectedCard">
          <p class="tarot-kind">
            {{ selectedCard.arcana }} · {{ selectedCard.number }}{{ isReversed ? ' · 역방향' : '' }}
          </p>
          <h2>{{ cardLabel }}</h2>
          <strong>{{ selectedCard.keyword }}</strong>
          <p>{{ readingMessage }}</p>
        </template>
        <template v-else>
          <p class="tarot-kind">마음을 고르면</p>
          <h2>{{ cardLabel }}</h2>
          <p>메이저 아르카나 22장과 마이너 아르카나 56장 중 한 장이 당신에게 도착합니다.</p>
        </template>

        <button v-if="selectedCard" type="button" class="tarot-draw-button" @click="shuffleCards">
          다시 섞기
        </button>
      </div>
    </section>

    <section v-if="!selectedCard" class="tarot-deck" aria-label="타로 카드 선택">
      <div>
        <p class="tarot-kind">78 CARDS SHUFFLED</p>
        <h2>마음이 가는 카드 한 장을 골라 보세요.</h2>
        <div class="tarot-deck-controls">
          <label class="reverse-toggle">
            <input v-model="allowReversed" type="checkbox" />
            <span aria-hidden="true"></span>
            역방향 포함
          </label>
          <button type="button" class="tarot-shuffle-button" :disabled="isShuffling" @click="shuffleCards">
            {{ isShuffling ? '섞는 중…' : '카드 섞기' }}
          </button>
        </div>
      </div>
      <div class="tarot-card-grid" :class="{ shuffling: isShuffling }">
        <button
          v-for="(card, index) in shuffledCards"
          :key="`${deckVersion}-${card.id}`"
          type="button"
          class="tarot-choice"
          :style="{ '--deal-delay': `${index * 5}ms` }"
          :aria-label="`${index + 1}번째 카드 뽑기`"
          :disabled="isShuffling"
          @click="chooseCard(card)"
        >
          <span>✶</span>
        </button>
      </div>
      <div v-if="isShuffling" class="tarot-shuffle-overlay" aria-label="카드를 섞는 중">
        <div class="tarot-shuffle-stage">
          <span
            v-for="card in shuffleDeck"
            :key="card.slot"
            class="shuffle-card"
            :class="card.side"
            :style="shuffleCardStyle(card)"
          >
            <i class="shuffle-card-face">✶</i>
          </span>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.tarot-page { display: grid; gap: 12px; }
.tarot-intro, .tarot-reading { border: 1px solid color-mix(in srgb, var(--surface) 75%, transparent); border-radius: 22px; background: color-mix(in srgb, var(--surface) 82%, transparent); backdrop-filter: blur(12px); }
.tarot-intro { padding: 28px; }
.tarot-eyebrow, .tarot-kind { margin: 0 0 8px; color: var(--accent); font-family: var(--font-mono); font-size: 11px; letter-spacing: .1em; }
h1, h2 { margin: 0; color: var(--ink); font-weight: 600; }
h1 { font-size: 34px; line-height: 1.15; }
h2 { font-size: 28px; line-height: 1.2; }
.tarot-intro > p:last-child, .tarot-copy > p:not(.tarot-kind) { margin: 12px 0 0; color: var(--ink-soft); line-height: 1.65; }
.tarot-reading { display: grid; grid-template-columns: minmax(180px, 230px) 1fr; gap: 30px; align-items: center; min-height: 390px; padding: 28px; }
.tarot-card-frame { width: 100%; aspect-ratio: 5 / 8; overflow: hidden; border-radius: 15px; box-shadow: 0 18px 32px #17132540; transform: rotate(-2deg); transition: transform .35s ease; }
.tarot-card-image { display: block; width: 100%; height: 100%; object-fit: cover; }
.tarot-card-back { display: grid; width: 100%; height: 100%; place-items: center; border: 4px solid #e7c978; color: #fff4cc; background: repeating-radial-gradient(circle at center, #262044 0 9px, #16142c 10px 22px); }
.tarot-card-back span { display: grid; width: 72px; height: 72px; place-items: center; border: 2px solid #e7c978; border-radius: 50%; font-size: 34px; }
.tarot-copy { display: grid; align-content: center; justify-items: start; }
.tarot-copy strong { display: inline-block; margin-top: 16px; padding: 6px 10px; border-radius: 999px; color: var(--accent); background: var(--accent-tint); font-size: 13px; }
.tarot-draw-button { margin-top: 26px; padding: 11px 17px; border: 0; border-radius: 999px; color: #fff; background: #352b5b; cursor: pointer; font: inherit; transition: transform .2s ease, opacity .2s ease; }
.tarot-draw-button:hover:not(:disabled) { transform: translateY(-2px); }
.tarot-deck { position: relative; display: grid; gap: 18px; padding: 28px; border: 1px solid color-mix(in srgb, var(--surface) 75%, transparent); border-radius: 22px; background: color-mix(in srgb, var(--surface) 82%, transparent); backdrop-filter: blur(12px); }
.tarot-deck-controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 14px; }
.reverse-toggle { display: inline-flex; gap: 8px; align-items: center; margin-top: 14px; color: var(--ink-soft); cursor: pointer; font-size: 13px; }
.tarot-deck-controls .reverse-toggle { margin-top: 0; }
.reverse-toggle input { position: absolute; opacity: 0; }
.reverse-toggle span { width: 34px; height: 20px; padding: 2px; border-radius: 999px; background: var(--line-strong); transition: background .2s ease; }
.reverse-toggle span::after { display: block; width: 16px; height: 16px; border-radius: 50%; background: #fff; content: ''; transition: transform .2s ease; }
.reverse-toggle input:checked + span { background: var(--accent); }
.reverse-toggle input:checked + span::after { transform: translateX(14px); }
.reverse-toggle input:focus-visible + span { outline: 2px solid var(--ink); outline-offset: 2px; }
.tarot-shuffle-button { padding: 7px 12px; border: 1px solid var(--line-strong); border-radius: 999px; color: var(--ink-soft); background: transparent; cursor: pointer; font: inherit; font-size: 13px; }
.tarot-shuffle-button:disabled { cursor: wait; opacity: .6; }
.tarot-card-grid { display: grid; grid-template-columns: repeat(13, 1fr); gap: 7px; overflow: hidden; transition: opacity .4s ease, transform .4s ease, filter .4s ease; }
.tarot-card-grid.shuffling { opacity: .1; transform: scale(.97); filter: blur(1.5px); }
.tarot-choice { aspect-ratio: 5 / 8; padding: 0; border: 2px solid #e7c978; border-radius: 5px; color: #fff4cc; background: repeating-radial-gradient(circle at center, #262044 0 3px, #16142c 4px 8px); cursor: pointer; font-size: clamp(9px, 1.8vw, 17px); transition: transform .18s ease, box-shadow .18s ease; animation: deal-in .42s cubic-bezier(.22, 1, .36, 1) backwards; animation-delay: var(--deal-delay, 0ms); }
.tarot-choice:hover, .tarot-choice:focus-visible { z-index: 1; outline: 0; box-shadow: 0 6px 15px #17132555; transform: translateY(-8px) scale(1.12); }
@keyframes deal-in { from { opacity: 0; transform: translateY(14px) scale(.86); } to { opacity: 1; transform: none; } }

/* 리플 셔플: 한 덱 → 두 갈래 → 카드가 교차로 낙하 → 정렬.
   바깥 .shuffle-card 는 "손에 쥔 반 덱"의 움직임, 안쪽 .shuffle-card-face 는 낱장의 낙하를 맡는다.
   반 덱이 ±63px 벌어진 상태에서 낱장이 중앙으로 되돌아오므로,
   안쪽 transform 은 바깥의 이동/회전(±7deg)을 상쇄하는 값(7.6px 보정)을 갖는다. */
.tarot-shuffle-overlay { position: absolute; display: grid; place-items: center; inset: 0; pointer-events: none; }
.tarot-shuffle-stage { position: relative; width: 78px; height: 124px; animation: square-up 1.3s ease both; }
.shuffle-card { position: absolute; inset: 0; will-change: transform; }
.shuffle-card.left { animation: half-left 1.3s cubic-bezier(.3, 0, .18, 1) both; }
.shuffle-card.right { animation: half-right 1.3s cubic-bezier(.3, 0, .18, 1) both; }
.shuffle-card-face { display: grid; width: 100%; height: 100%; place-items: center; border: 2px solid #e7c978; border-radius: 7px; color: #fff4cc; background: repeating-radial-gradient(circle at center, #262044 0 4px, #16142c 5px 10px); box-shadow: 0 4px 10px #1713253d; font-size: 18px; font-style: normal; will-change: transform; }
.left .shuffle-card-face { animation: drop-left .34s cubic-bezier(.3, 1.35, .5, 1) calc(500ms + var(--slot) * 22ms) backwards; }
.right .shuffle-card-face { animation: drop-right .34s cubic-bezier(.3, 1.35, .5, 1) calc(500ms + var(--slot) * 22ms) backwards; }
@keyframes half-left { 0% { transform: translate3d(0, 4px, 0) rotate(0deg); } 28%, 100% { transform: translate3d(-63px, -6px, 0) rotate(-7deg); } }
@keyframes half-right { 0% { transform: translate3d(0, 4px, 0) rotate(0deg); } 28%, 100% { transform: translate3d(63px, -6px, 0) rotate(7deg); } }
@keyframes drop-left { from { transform: translate3d(0, calc(var(--order) * -3px), 0) rotate(calc(var(--order) * -.6deg)); } to { transform: translate3d(63px, calc(7.6px + var(--slot) * -1.4px), 0) rotate(7deg); } }
@keyframes drop-right { from { transform: translate3d(0, calc(var(--order) * -3px), 0) rotate(calc(var(--order) * .6deg)); } to { transform: translate3d(-63px, calc(7.6px + var(--slot) * -1.4px), 0) rotate(-7deg); } }
@keyframes square-up { 0%, 88% { transform: scale(1); } 94% { transform: scale(.955); } 100% { transform: scale(1); } }

@media (prefers-reduced-motion: reduce) {
  .tarot-card-grid.shuffling { transform: none; filter: none; }
  .tarot-choice { animation: none; }
  .tarot-shuffle-stage, .shuffle-card, .left .shuffle-card-face, .right .shuffle-card-face { animation-duration: .01ms; animation-delay: 0ms; }
  .tarot-shuffle-overlay { animation: fade-pulse 1.3s ease-in-out infinite; }
  @keyframes fade-pulse { 50% { opacity: .45; } }
}
@media (max-width: 540px) { .tarot-card-grid { grid-template-columns: repeat(10, 1fr); gap: 4px; } }
@media (max-width: 540px) { .tarot-reading { grid-template-columns: 1fr; } .tarot-card-frame { width: 180px; margin: 0 auto; } .tarot-copy { justify-items: center; text-align: center; } }
</style>
