<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { cardBack, tarotCards } from '../data/tarotCards'
import { SPREAD, buildLocalReading, streamReadingViaProxy } from '../data/tarotReading'

/**
 * 오늘의 운세 — 78장에서 세 장을 뽑아 AI 해석을 받는다.
 *
 *   1번 카드  오늘의 전반적 흐름
 *   2번 카드  오늘 마주할 변수 또는 주의점
 *   3번 카드  오늘의 조언
 *
 * 카드는 data/tarotCards.js, 해석은 data/tarotReading.js 가 맡는다.
 * 이 파일은 "무엇을 언제 보여줄지"만 정한다.
 */
/* ── 덱 ─────────────────────────────────────────────────────────── */
const makeShuffledDeck = () => [...tarotCards].sort(() => Math.random() - 0.5)
const shuffledCards = ref(makeShuffledDeck())
const deckVersion = ref(0)

const allowReversed = ref(true)
const isShuffling = ref(false)

/** 뽑은 카드 — [{ card, reversed }, ...] 최대 세 장 */
const picks = ref([])
const isComplete = computed(() => picks.value.length === SPREAD.length)
const pickedIds = computed(() => new Set(picks.value.map((pick) => pick.card.id)))

/** 지금 몇 번째 자리를 고르는 중인지 */
const currentSlot = computed(() => SPREAD[picks.value.length] ?? null)

/**
 * 머리말 아래 안내 한 줄.
 *
 * 카드를 뽑는 순간 문구가 사라지면 그 자리가 비어 어색하다.
 * 자리는 그대로 두고 내용만 지금 상태에 맞게 바꾼다.
 */
const introMessage = computed(() => {
  const left = SPREAD.length - picks.value.length

  if (!picks.value.length) {
    return '아래 78장 중 세 장을 고르면 오늘의 흐름 · 변수 · 조언을 읽어 드립니다.'
  }
  if (left > 0) {
    return `${picks.value.length}장을 골랐습니다. ${left}장을 더 고르면 해석이 시작됩니다.`
  }
  if (reading.value.status === 'loading') {
    return '세 장이 모두 놓였습니다. 카드를 읽는 중입니다…'
  }
  return '세 장이 모두 놓였습니다. 아래에서 오늘의 흐름 · 변수 · 조언을 확인해 보세요.'
})

const formattedDate = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

/* ── 셔플 연출 ──────────────────────────────────────────────────── */
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

let shuffleTimer = 0

const shuffleCards = () => {
  if (isShuffling.value) return
  isShuffling.value = true
  resetReading()
  picks.value = []
  shuffleTimer = window.setTimeout(() => {
    shuffledCards.value = makeShuffledDeck()
    deckVersion.value += 1
    isShuffling.value = false
  }, SHUFFLE_MS)
}

onBeforeUnmount(() => window.clearTimeout(shuffleTimer))

/* ── 해석 ───────────────────────────────────────────────────────── */
const reading = ref({ status: 'idle', text: '', source: '', error: '' })

const resetReading = () => {
  reading.value = { status: 'idle', text: '', source: '', error: '' }
}

/** 기본 해설로 내려앉는다 — 화면이 비는 것만은 막는다 */
const fallBackToLocal = () => {
  reading.value = {
    status: 'done',
    text: buildLocalReading(picks.value),
    source: 'local',
    error: '',
  }
}

/**
 * 세 장이 모이면 해석을 받는다.
 *
 * AI 해석은 서버(api/tarot.js)가 자기 키로 받아 온다. 브라우저는 뽑은 카드
 * 세 장만 보낸다 — 브라우저는 비밀을 가질 수 없으니 키를 여기 두지 않는다.
 *
 * 서버가 없든, 키가 아직 없든, 모델이 답을 못 하든 — 이유를 따지지 않고
 * 카드에 딸린 기본 해설로 넘어간다. 운세를 보러 온 사람에게 API 사정을
 * 설명하는 화면은 아무 쓸모가 없다.
 */
const requestReading = async () => {
  if (!isComplete.value) return

  reading.value = { status: 'loading', text: '', source: 'ai', error: '' }

  try {
    await streamReadingViaProxy({
      picks: picks.value,
      onText: (chunk) => {
        reading.value.text += chunk
      },
    })
    if (!reading.value.text.trim()) throw new Error('빈 응답')
    reading.value.status = 'done'
  } catch (error) {
    // 원인은 콘솔에만 남긴다. 화면에는 읽을 거리가 있으면 된다.
    console.warn('[tarot] AI 해석을 받지 못해 기본 해설로 대신합니다.', error)
    fallBackToLocal()
  }
}

const chooseCard = (card) => {
  if (isShuffling.value || isComplete.value) return
  if (pickedIds.value.has(card.id)) return

  picks.value = [
    ...picks.value,
    { card, reversed: allowReversed.value && Math.random() >= 0.5 },
  ]

  if (isComplete.value) requestReading()
}

const drawAgain = () => {
  resetReading()
  picks.value = []
  shuffledCards.value = makeShuffledDeck()
  deckVersion.value += 1
}

</script>

<template>
  <!-- 뒷면 그림은 여러 곳에서 쓰므로 CSS 변수로 한 번만 넘겨 준다 -->
  <main class="tarot-page" :style="{ '--card-back': `url(${cardBack})` }">
    <section class="tarot-intro">
      <p class="tarot-eyebrow">DAILY TAROT · 3 CARD SPREAD</p>
      <h1>오늘의 운세</h1>
      <p>{{ formattedDate }} · 잠시 숨을 고르고, 지금 가장 궁금한 것을 떠올려 보세요.</p>
      <p class="tarot-cta">{{ introMessage }}</p>
    </section>

    <!-- 세 자리 -->
    <section class="spread">
      <article
        v-for="(slot, index) in SPREAD"
        :key="slot.no"
        class="slot"
        :class="{ filled: picks[index], active: !picks[index] && currentSlot?.no === slot.no }"
      >
        <p class="slot-label"><b>{{ slot.no }}</b> {{ slot.label }}</p>

        <div class="slot-frame">
          <img
            v-if="picks[index]"
            :src="picks[index].card.image"
            :alt="`${picks[index].card.name} 타로 카드`"
            class="slot-image"
            :class="{ reversed: picks[index].reversed }"
          />
          <!--
            뽑기 전에는 카드 뒷면을 깔지 않는다. 뒷면을 두면 "이미 놓인 카드"처럼
            보여서 고를 마음이 들지 않는다. 빈 자리로 두고 여기가 채워질 곳임을 알린다.
          -->
          <div v-else class="slot-empty">
            <span class="slot-mark" aria-hidden="true">{{ slot.no }}</span>
            <span class="slot-wait">
              {{ currentSlot?.no === slot.no ? '이 자리를 고르는 중' : '비어 있음' }}
            </span>
          </div>
        </div>

        <p class="slot-title">{{ slot.title }}</p>
        <p v-if="picks[index]" class="slot-card">
          {{ picks[index].card.name }}
          <span :class="picks[index].reversed ? 'rev' : 'up'">
            {{ picks[index].reversed ? '역방향' : '정방향' }}
          </span>
        </p>
        <p v-else class="slot-card empty">아직 뽑지 않았습니다</p>
      </article>
    </section>

    <!-- 해석 -->
    <section v-if="isComplete" class="reading" aria-live="polite">
      <header class="reading-head">
        <p class="tarot-kind">
          READING
          <span v-if="reading.source === 'ai'" class="tag ai">AI 해석</span>
          <span v-else-if="reading.source === 'local'" class="tag local">카드 기본 해설</span>
        </p>
        <button type="button" class="ghost-button" @click="drawAgain">다시 뽑기</button>
      </header>

      <p v-if="reading.status === 'loading' && !reading.text" class="reading-wait">
        카드를 읽는 중입니다…
      </p>

      <p v-if="reading.text" class="reading-text">{{ reading.text }}</p>


      <p v-if="reading.source === 'local'" class="reading-hint">
        카드에 딸린 기본 해설입니다. 세 장을 함께 읽는 AI 해석은 지금 잠시 쉬고 있습니다.
      </p>
    </section>

    <!-- 카드 고르기 -->
    <section v-if="!isComplete" class="tarot-deck" aria-label="타로 카드 선택">
      <div>
        <p class="tarot-kind">78 CARDS SHUFFLED</p>
        <h2 v-if="currentSlot">{{ currentSlot.no }}번 — {{ currentSlot.title }}</h2>
        <p class="deck-guide">
          <template v-if="!picks.length">마음이 가는 카드를 골라 보세요. 정답은 없습니다.</template>
          <template v-else>{{ SPREAD.length - picks.length }}장 남았습니다. 이어서 골라 주세요.</template>
        </p>

        <div class="tarot-deck-controls">
          <label class="reverse-toggle">
            <input v-model="allowReversed" type="checkbox" />
            <span aria-hidden="true"></span>
            역방향 포함
          </label>
          <button
            type="button"
            class="tarot-shuffle-button"
            :disabled="isShuffling"
            @click="shuffleCards"
          >
            {{ isShuffling ? '섞는 중…' : '카드 섞기' }}
          </button>
          <span class="progress">{{ picks.length }} / {{ SPREAD.length }}</span>
        </div>
      </div>

      <div class="tarot-card-grid" :class="{ shuffling: isShuffling }">
        <button
          v-for="(card, index) in shuffledCards"
          :key="`${deckVersion}-${card.id}`"
          type="button"
          class="tarot-choice"
          :class="{ taken: pickedIds.has(card.id) }"
          :style="{ '--deal-delay': `${index * 5}ms` }"
          :aria-label="`${index + 1}번째 카드 뽑기`"
          :disabled="isShuffling || pickedIds.has(card.id)"
          @click="chooseCard(card)"
        ></button>
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
            <i class="shuffle-card-face"></i>
          </span>
        </div>
      </div>
    </section>

  </main>
</template>

<style scoped>
/*
 * 이 화면만 색을 달리 쓴다. 날씨는 초록(--accent)이 어울리지만,
 * 타로에는 카드 뒷면의 남보라·금빛과 이어지는 색이 맞다.
 * 사이트 토큰을 건드리지 않도록 여기서만 변수를 새로 정의한다.
 */
.tarot-page {
  --mystic: #6b4fa1;
  --mystic-soft: color-mix(in srgb, var(--mystic) 12%, transparent);
  --mystic-line: color-mix(in srgb, var(--mystic) 32%, transparent);
  --gold: #b58b3c;

  display: grid;
  gap: 12px;
}
.tarot-intro, .spread, .reading, .tarot-deck { border: 1px solid color-mix(in srgb, var(--surface) 75%, transparent); border-radius: 22px; background: color-mix(in srgb, var(--surface) 82%, transparent); backdrop-filter: blur(12px); }
.tarot-intro { padding: 28px; }
.tarot-eyebrow, .tarot-kind { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 8px; color: var(--mystic); font-family: var(--font-mono); font-size: 11px; letter-spacing: .1em; }
h1, h2 { margin: 0; color: var(--ink); font-weight: 600; }
h1 { font-size: 34px; line-height: 1.15; }
h2 { font-size: 24px; line-height: 1.25; }
.tarot-intro p { margin: 12px 0 0; color: var(--ink-soft); line-height: 1.65; }
.tarot-cta { display: inline-block; margin-top: 14px !important; padding: 10px 16px; border-radius: 12px; background: var(--mystic-soft); color: var(--ink-soft); font-size: 13px; }
.tarot-cta b { color: var(--mystic); }

/* ── 세 자리 ── */
.spread { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; padding: 24px; }
.slot { display: grid; gap: 8px; align-content: start; }
.slot-label { display: flex; gap: 6px; align-items: center; margin: 0; color: var(--faint); font-family: var(--font-mono); font-size: 11px; }
.slot-label b { display: grid; width: 18px; height: 18px; place-items: center; border-radius: 50%; color: var(--on-accent); background: var(--line-strong); font-size: 10.5px; }
.slot.filled .slot-label b, .slot.active .slot-label b { background: var(--mystic); }
.slot-frame { width: 100%; aspect-ratio: 1144 / 1919; overflow: hidden; border-radius: 12px; box-shadow: 0 12px 24px #17132530; transition: transform .3s ease; }
.slot.active .slot-frame { transform: translateY(-4px); }
.slot-image { display: block; width: 100%; height: 100%; object-fit: cover; }
.slot-image.reversed { transform: rotate(180deg); }
.slot-empty { display: grid; width: 100%; height: 100%; gap: 8px; place-content: center; place-items: center; border: 1.5px dashed var(--line-strong); border-radius: 12px; background: color-mix(in srgb, var(--paper) 60%, transparent); transition: border-color .25s ease, background .25s ease; }
.slot-mark { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 50%; color: var(--faint); background: color-mix(in srgb, var(--surface) 70%, transparent); font-family: var(--font-mono); font-size: 14px; font-weight: 700; }
.slot-wait { color: var(--faint); font-size: 11px; }
.slot.active .slot-empty { border-color: var(--mystic-line); border-style: solid; background: var(--mystic-soft); animation: breathe 2.2s ease-in-out infinite; }
.slot.active .slot-mark { color: #fff; background: var(--mystic); }
.slot.active .slot-wait { color: var(--mystic); font-weight: 700; }
@keyframes breathe { 50% { opacity: .72; } }
@media (prefers-reduced-motion: reduce) { .slot.active .slot-empty { animation: none; } }
.slot-title { margin: 0; color: var(--ink); font-size: 13px; font-weight: 600; line-height: 1.4; }
.slot-card { margin: 0; color: var(--muted); font-size: 12px; }
.slot-card.empty { color: var(--faint); }
.slot-card .up { color: var(--mystic); font-weight: 700; }
.slot-card .rev { color: var(--signal); font-weight: 700; }

/* ── 해석 ── */
.reading { display: grid; gap: 12px; padding: 26px 28px; }
.reading-head { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
.reading-head .tarot-kind { margin: 0; }
.tag { padding: 2px 9px; border-radius: 999px; font-size: 10.5px; font-weight: 700; letter-spacing: 0; }
.tag.ai { color: #fff; background: var(--mystic); }
.tag.local { color: var(--slate); background: var(--slate-tint); }
.reading-text { margin: 0; color: var(--ink-soft); font-size: 14.5px; line-height: 1.9; white-space: pre-wrap; }
.reading-wait { margin: 0; color: var(--muted); font-size: 13.5px; }
.reading-wait::after { content: ''; display: inline-block; width: 7px; height: 7px; margin-left: 6px; border-radius: 50%; background: var(--mystic); animation: pulse 1.1s ease-in-out infinite; vertical-align: middle; }
@keyframes pulse { 50% { opacity: .25; } }
.reading-hint { margin: 0; padding: 11px 14px; border-radius: 10px; background: var(--paper); color: var(--muted); font-size: 12.5px; line-height: 1.7; }

/* ── 카드 고르기 ── */
.tarot-deck { position: relative; display: grid; gap: 18px; padding: 26px 28px; }
.deck-guide { margin: 10px 0 0; color: var(--muted); font-size: 13px; }
.tarot-deck-controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 14px; }
.reverse-toggle { display: inline-flex; gap: 8px; align-items: center; color: var(--ink-soft); cursor: pointer; font-size: 13px; }
.reverse-toggle input { position: absolute; opacity: 0; }
.reverse-toggle span { width: 34px; height: 20px; padding: 2px; border-radius: 999px; background: var(--line-strong); transition: background .2s ease; }
.reverse-toggle span::after { display: block; width: 16px; height: 16px; border-radius: 50%; background: #fff; content: ''; transition: transform .2s ease; }
.reverse-toggle input:checked + span { background: var(--mystic); }
.reverse-toggle input:checked + span::after { transform: translateX(14px); }
.reverse-toggle input:focus-visible + span { outline: 2px solid var(--ink); outline-offset: 2px; }
.tarot-shuffle-button { padding: 7px 12px; border: 1px solid var(--line-strong); border-radius: 999px; color: var(--ink-soft); background: transparent; cursor: pointer; font: inherit; font-size: 13px; }
.tarot-shuffle-button:disabled { cursor: wait; opacity: .6; }
.progress { margin-left: auto; color: var(--faint); font-family: var(--font-mono); font-size: 12px; }
.tarot-card-grid { display: grid; grid-template-columns: repeat(13, 1fr); gap: 7px; overflow: hidden; transition: opacity .4s ease, transform .4s ease, filter .4s ease; }
.tarot-card-grid.shuffling { opacity: .1; transform: scale(.97); filter: blur(1.5px); }
.tarot-choice { aspect-ratio: 5 / 8; padding: 0; border: 1px solid #e7c978; border-radius: 5px; background: var(--card-back) center / 100% 100% no-repeat; cursor: pointer; transition: transform .18s ease, box-shadow .18s ease, opacity .25s ease; animation: deal-in .42s cubic-bezier(.22, 1, .36, 1) backwards; animation-delay: var(--deal-delay, 0ms); }
.tarot-choice:hover:not(:disabled), .tarot-choice:focus-visible { z-index: 1; outline: 0; box-shadow: 0 6px 15px #17132555; transform: translateY(-8px) scale(1.12); }
.tarot-choice.taken { cursor: default; opacity: .18; }
@keyframes deal-in { from { opacity: 0; transform: translateY(14px) scale(.86); } to { opacity: 1; transform: none; } }

/* 리플 셔플: 한 덱 → 두 갈래 → 카드가 교차로 낙하 → 정렬. */
.tarot-shuffle-overlay { position: absolute; display: grid; place-items: center; inset: 0; pointer-events: none; }
.tarot-shuffle-stage { position: relative; width: 78px; height: 124px; animation: square-up 1.3s ease both; }
.shuffle-card { position: absolute; inset: 0; will-change: transform; }
.shuffle-card.left { animation: half-left 1.3s cubic-bezier(.3, 0, .18, 1) both; }
.shuffle-card.right { animation: half-right 1.3s cubic-bezier(.3, 0, .18, 1) both; }
.shuffle-card-face { display: grid; width: 100%; height: 100%; place-items: center; border: 2px solid #e7c978; border-radius: 7px; background: var(--card-back) center / 100% 100% no-repeat; box-shadow: 0 4px 10px #1713253d; will-change: transform; }
.left .shuffle-card-face { animation: drop-left .34s cubic-bezier(.3, 1.35, .5, 1) calc(500ms + var(--slot) * 22ms) backwards; }
.right .shuffle-card-face { animation: drop-right .34s cubic-bezier(.3, 1.35, .5, 1) calc(500ms + var(--slot) * 22ms) backwards; }
@keyframes half-left { 0% { transform: translate3d(0, 4px, 0) rotate(0deg); } 28%, 100% { transform: translate3d(-63px, -6px, 0) rotate(-7deg); } }
@keyframes half-right { 0% { transform: translate3d(0, 4px, 0) rotate(0deg); } 28%, 100% { transform: translate3d(63px, -6px, 0) rotate(7deg); } }
@keyframes drop-left { from { transform: translate3d(0, calc(var(--order) * -3px), 0) rotate(calc(var(--order) * -.6deg)); } to { transform: translate3d(63px, calc(7.6px + var(--slot) * -1.4px), 0) rotate(7deg); } }
@keyframes drop-right { from { transform: translate3d(0, calc(var(--order) * -3px), 0) rotate(calc(var(--order) * .6deg)); } to { transform: translate3d(-63px, calc(7.6px + var(--slot) * -1.4px), 0) rotate(-7deg); } }
@keyframes square-up { 0%, 88% { transform: scale(1); } 94% { transform: scale(.955); } 100% { transform: scale(1); } }

/* ── API 키 ── */

.ghost-button { padding: 7px 14px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); background: var(--surface); cursor: pointer; font: inherit; font-size: 12.5px; }
.ghost-button:hover { border-color: var(--mystic); color: var(--mystic); }

@media (max-width: 640px) {
  .spread { grid-template-columns: 1fr; }
  .slot-frame { max-width: 220px; }
}
@media (max-width: 540px) {
  .tarot-card-grid { grid-template-columns: repeat(10, 1fr); gap: 4px; }
}
</style>
