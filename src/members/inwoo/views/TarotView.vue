<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { cardBack, tarotCards } from '../data/tarotCards'
import { READINGS, READING_TYPES, buildReading, composeReading } from '../data/tarotReading'
import { useAuthStore } from '../stores/authStore'
import { useRecordStore } from '../stores/recordStore'
import { downloadBlob, drawTarotCard } from '../utils/resultCard'
import { link } from '../routes'

/**
 * 오늘의 운세 — 78장에서 세 장을 뽑아 오늘의 흐름을 읽는다.
 *
 *   1번 카드  오늘의 전반적 흐름
 *   2번 카드  오늘 마주할 변수 또는 주의점
 *   3번 카드  오늘의 조언
 *
 * 카드는 data/tarotCards.js, 해석은 data/tarotReading.js 가 맡는다.
 * 이 파일은 "무엇을 언제 보여줄지"만 정한다.
 */
/* ── 무엇을 물을지 ──────────────────────────────────────────────── */

/**
 * 탭이 바뀌면 묻는 것 자체가 달라진다.
 * 세 자리의 뜻도, 해석의 말투도, 서버에 저장될 종류 이름도 여기서 갈린다.
 */
const activeType = ref(READING_TYPES[0])
const route = useRoute()
const config = computed(() => READINGS[activeType.value])
const spread = computed(() => config.value.spread)

/**
 * 탭을 옮기면 뽑아 둔 카드를 비운다.
 * '오늘의 흐름' 자리에 놓았던 카드가 '다가올 인연' 자리에 그대로 남아 있으면
 * 물음과 답이 어긋난 글이 나온다.
 */
const selectType = (type) => {
  if (type === activeType.value) return
  activeType.value = type
  drawAgain()
}

/* ── 덱 ─────────────────────────────────────────────────────────── */
const makeShuffledDeck = () => [...tarotCards].sort(() => Math.random() - 0.5)
const shuffledCards = ref(makeShuffledDeck())
const deckVersion = ref(0)

const allowReversed = ref(true)
const isShuffling = ref(false)

/** 뽑은 카드 — [{ card, reversed }, ...] 최대 세 장 */
const picks = ref([])
const isComplete = computed(() => picks.value.length === spread.value.length)
const pickedIds = computed(() => new Set(picks.value.map((pick) => pick.card.id)))

/** 지금 몇 번째 자리를 고르는 중인지 */
const currentSlot = computed(() => spread.value[picks.value.length] ?? null)

/**
 * 머리말 아래 안내 한 줄.
 *
 * 카드를 뽑는 순간 문구가 사라지면 그 자리가 비어 어색하다.
 * 자리는 그대로 두고 내용만 지금 상태에 맞게 바꾼다.
 */
const introMessage = computed(() => {
  const left = spread.value.length - picks.value.length

  if (!picks.value.length) {
    // 탭마다 세 자리의 이름이 다르므로 안내도 거기에 맞춘다
    const labels = spread.value.map((slot) => slot.label).join(' · ')
    return `아래 78장 중 세 장을 고르면 ${labels}을 읽어 드립니다.`
  }
  if (left > 0) {
    return `${picks.value.length}장을 골랐습니다. ${left}장을 더 고르면 해석이 시작됩니다.`
  }
  const labels = spread.value.map((slot) => slot.label).join(' · ')
  return `세 장이 모두 놓였습니다. 아래에서 ${labels}을 확인해 보세요.`
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

/**
 * 세 장이 모이면 그 자리에서 글이 나온다.
 *
 * 카드마다 가진 뜻을 놓인 자리(흐름 · 변수 · 조언)에 맞춰 엮는다.
 * 기다릴 것도, 실패할 것도 없어서 상태를 따로 들고 있지 않는다.
 */
/**
 * 화면에 뿌릴 조각 — 자리 제목 · 카드 이름 · 본문이 따로 온다.
 * 제목에 색을, 카드 이름에 굵기를 주려면 통짜 문자열로는 안 되기 때문이다.
 */
const reading = computed(() =>
  isComplete.value ? composeReading(activeType.value, picks.value) : null,
)

/** 서버에 남길 때 쓰는 통짜 글 (화면과 같은 내용) */
const readingText = computed(() =>
  isComplete.value ? buildReading(activeType.value, picks.value) : '',
)

const resetReading = () => {
  // 새로 뽑으면 방금 저장한 기록과는 다른 운세다. 저장 표시도 함께 지운다.
  savedRecordId.value = 0
}

const copyPrompt = async () => {
  const prompt = `[타로 리딩 요청]\n주제: ${activeType.value}\n${picks.value
    .map((pick, index) => `${spread.value[index].label}: ${pick.card.name} (${pick.reversed ? '역방향' : '정방향'})`)
    .join('\n')}\n\n세 카드의 흐름을 차분하고 구체적으로 해석해 주세요.`
  try {
    await navigator.clipboard.writeText(prompt)
    ElMessage.success({ message: 'AI 해석 프롬프트를 복사했어요!', duration: 1600 })
  } catch {
    ElMessage.warning('브라우저가 복사를 막았습니다.')
  }
}

/* ── 그림으로 저장 ───────────────────────────────────────────── */
const isMakingImage = ref(false)

const saveImage = async () => {
  if (!isComplete.value || isMakingImage.value) return
  isMakingImage.value = true
  try {
    const composed = reading.value
    const blob = await drawTarotCard({
      type: activeType.value,
      picks: picks.value.map((pick, i) => ({
        label: composed?.paragraphs?.[i]?.title ?? '',
        name: pick.card.name,
        reversed: pick.reversed,
        image: pick.card.image,
      })),
      // 화면에 적힌 해석을 그대로 담는다 (조각을 한 줄로 이어 붙인다)
      // body 는 이미 한 문장으로 이어진 글이다
      paragraphs: (composed?.paragraphs ?? []).map((para) => para.body),
      closing: composed?.closing ?? '',
    })
    if (!blob) throw new Error('no blob')
    downloadBlob(blob, `${activeType.value}_${new Date().toLocaleDateString('ko-KR')}.png`)
    ElMessage.success({ message: '이미지로 저장했어요!', duration: 1600 })
  } catch (error) {
    // 무엇 때문에 실패했는지 남겨 둔다 — 토스트만 뜨면 원인을 알 수 없다
    console.error('[tarot] 그림 만들기 실패', error)
    ElMessage.error('그림을 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.')
  } finally {
    isMakingImage.value = false
  }
}

/* ── 기록 남기기 ────────────────────────────────────────────────── */

/**
 * 해석이 끝나면 서버에 남길 수 있다.
 *
 * 기록은 "내 것"이라 로그인해야 한다. 로그인하지 않았다고 화면을 막지는 않는다 —
 * 운세는 그대로 보고, 저장 자리에만 로그인 안내를 둔다.
 */
const auth = useAuthStore()
const { isLoggedIn } = storeToRefs(auth)

const recordStore = useRecordStore()
const { isSaving } = storeToRefs(recordStore)

/** 0 이면 아직 저장 전, 값이 있으면 그 기록의 id */
const savedRecordId = ref(0)
const isReplay = ref(false)

const restoreReplay = (raw) => {
  if (!raw) return
  try {
    const replay = JSON.parse(raw)
    if (!READINGS[replay.type] || !Array.isArray(replay.cards) || replay.cards.length !== 3) return
    const restored = replay.cards
      .map((saved) => {
        const card = tarotCards.find((item) => item.id === saved.id)
        return card ? { card, reversed: Boolean(saved.reversed) } : null
      })
      .filter(Boolean)
    if (restored.length !== 3) return
    activeType.value = replay.type
    isReplay.value = true
    savedRecordId.value = Number(route.query.recordId) || 0
    picks.value = restored
  } catch {
    // 오래된 링크나 잘못된 쿼리는 새 운세를 시작하면 된다
  }
}

watch(
  () => route.query.replay,
  (replay) => restoreReplay(replay),
  { immediate: true },
)

const saveReading = async () => {
  if (!isComplete.value || !readingText.value.trim()) return

  const saved = await recordStore.add({
    // 기록함에는 운세와 테스트가 함께 담긴다. 어느 쪽인지 밝혀 둔다.
    kind: 'tarot',
    // 고를 필요가 없다 — 지금 보고 있는 탭이 곧 이 기록의 종류다
    type: activeType.value,
    // 서버는 세 장을 그대로 보관한다. 나중에 목록에서 다시 보여 줘야 하므로
    // 이미지 경로 대신 "무슨 카드가 어느 방향이었는지"만 담는다.
    cards: picks.value.map((pick) => ({
      id: pick.card.id,
      name: pick.card.name,
      reversed: pick.reversed,
    })),
    reading: readingText.value.trim(),
  })

  if (!saved) {
    ElMessage.error(recordStore.errorMessage)
    return
  }

  savedRecordId.value = saved.id
  ElMessage.success({ message: '운세를 기록했습니다.', duration: 1800 })
}

/*
 * 로그인해 있으면 알아서 남긴다.
 *
 * 세 장을 다 뽑고 해석까지 본 사람이 "기록하기"를 한 번 더 눌러야 남는 것은
 * 군더더기다. 로그인은 이미 "내 것으로 모으겠다"는 뜻이므로, 해석이 갖춰지는
 * 순간 조용히 저장한다. 버튼은 로그인하지 않은 사람에게만 뜬다.
 *
 * 이미 저장했거나 저장 중이면 건너뛴다 — 탭을 옮길 때마다 또 남으면 안 된다.
 */
watch(
  [isComplete, readingText, isLoggedIn],
  ([complete, text, loggedIn]) => {
    if (!complete || !loggedIn || isReplay.value) return
    if (!text.trim() || savedRecordId.value || isSaving.value) return
    saveReading()
  },
  { immediate: true },
)

const chooseCard = (card) => {
  if (isShuffling.value || isComplete.value) return
  if (pickedIds.value.has(card.id)) return

  picks.value = [
    ...picks.value,
    { card, reversed: allowReversed.value && Math.random() >= 0.5 },
  ]

}

/**
 * 아직 안 채운 자리를 누르면 카드 뽑는 곳으로 데려간다.
 *
 * 자리와 덱이 세로로 떨어져 있어서, 자리를 눌러 놓고 "그래서 어디서 고르지?"
 * 하고 다시 스크롤을 내리게 된다. 눌린 자리가 곧 지금 고를 자리이므로
 * 그대로 덱까지 따라가 준다.
 */
const deckRef = ref(null)

const goToDeck = () => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  deckRef.value?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

const drawAgain = () => {
  isReplay.value = false
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
      <!--
        무엇을 물을지 고르는 자리 — 머리말과 한 장으로 붙여 둔다.
        고르는 것과 그 결과가 떨어져 있으면 무엇을 바꾼 것인지 눈에 덜 들어온다.
        role="tablist" 를 적어 두면 화면 낭독기가 "3개 중 1번째 탭"처럼 읽어 준다.
      -->
      <nav class="kind-tabs" role="tablist" aria-label="운세 종류">
        <button
          v-for="type in READING_TYPES"
          :key="type"
          type="button"
          role="tab"
          :aria-selected="activeType === type"
          :class="{ on: activeType === type }"
          @click="selectType(type)"
        >
          {{ type }}
          <small>{{ READINGS[type].tabHint }}</small>
        </button>
      </nav>

      <p class="tarot-eyebrow">{{ config.eyebrow }}</p>
      <h1>{{ config.heading }}</h1>
      <p>{{ formattedDate }} · {{ config.lead }}</p>
      <p class="tarot-cta">{{ introMessage }}</p>
    </section>

    <!-- 세 자리 -->
    <section class="spread">
      <article
        v-for="(slot, index) in spread"
        :key="slot.no"
        class="slot"
        :class="{ filled: picks[index], active: !picks[index] && currentSlot?.no === slot.no }"
      >
        <!-- 빈 자리를 누르면 아래 덱으로 데려간다 -->
        <button
          v-if="!picks[index] && !isComplete"
          type="button"
          class="slot-jump"
          :aria-label="`${slot.no}번 자리 — 카드 뽑는 곳으로 이동`"
          @click="goToDeck"
        ></button>
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
        <p class="tarot-kind">READING</p>
        <button type="button" class="ghost-button" @click="drawAgain">다시 뽑기</button>
      </header>


      <div v-if="reading" class="reading-text">
        <article v-for="(para, index) in reading.paragraphs" :key="index" class="para">
          <p class="para-head">
            <!-- 자리 이름은 색으로, 뽑힌 카드는 굵게 — 물음과 답이 한눈에 갈린다 -->
            <span class="para-title">{{ para.title }}</span>
            <span class="para-card">
              <b>{{ para.card }}</b>
              <em :class="para.reversed ? 'rev' : 'up'">{{ para.direction }}</em>
            </span>
          </p>
          <p class="para-body">{{ para.body }}</p>
        </article>

        <p class="reading-closing">{{ reading.closing }}</p>
      </div>



      <div class="save-row">
        <!-- 뽑은 세 장을 그림 한 장으로 -->
        <button type="button" class="tarot-act" :disabled="isMakingImage" @click="saveImage">
          <DownloadOutlined /> {{ isMakingImage ? '만드는 중…' : '이미지로 저장' }}
        </button>
        <button type="button" class="tarot-act quiet" @click="copyPrompt">
          <CopyOutlined /> 프롬프트 복사
        </button>

        <template v-if="!isLoggedIn">
          <p class="save-hint">
            <RouterLink :to="link('login')">로그인</RouterLink>하면 이 운세를 기록으로 남길 수 있습니다.
          </p>
        </template>

        <template v-else-if="savedRecordId">
          <p class="save-hint done">
            <RouterLink :to="link('records')">My 에서 보기 →</RouterLink>
          </p>
        </template>

        <template v-else>
          <!-- 로그인해 있으면 알아서 저장된다. 그 사이의 짧은 순간만 이 줄이 보인다 -->
          <p class="save-hint">
            <b>{{ activeType }}</b> 으로 남기는 중…
          </p>
        </template>
      </div>
    </section>

    <!-- 카드 고르기 -->
    <section v-if="!isComplete" ref="deckRef" class="tarot-deck" aria-label="타로 카드 선택">
      <div>
        <p class="tarot-kind">78 CARDS SHUFFLED</p>
        <h2 v-if="currentSlot">{{ currentSlot.no }}번 — {{ currentSlot.title }}</h2>
        <p class="deck-guide">
          <template v-if="!picks.length">마음이 가는 카드를 골라 보세요. 정답은 없습니다.</template>
          <template v-else>{{ spread.length - picks.length }}장 남았습니다. 이어서 골라 주세요.</template>
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
          <span class="progress">{{ picks.length }} / {{ spread.length }}</span>
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
  /*
   * 해질녘 색조.
   * 원색 보라(#6b4fa1)는 채도가 높아 화면이 소란스러웠다.
   * 회보라로 낮추고, 짝이 되는 남빛과 노을빛을 두어 단색 대신 흐름을 만든다.
   */
  --mystic: #6a5c8a;
  --mystic-deep: #453a5e;
  --mystic-dusk: #7a86ab;
  --mystic-glow: #c9a68a;
  --mystic-soft: color-mix(in srgb, var(--mystic) 11%, transparent);
  --mystic-line: color-mix(in srgb, var(--mystic) 26%, transparent);
  --gold: #ac8b52;

  display: grid;
  gap: 12px;
}
.tarot-intro, .spread, .reading, .tarot-deck { border: 0; border-radius: 22px; box-shadow: 0 1px 2px rgb(30 26 40 / 0.04), 0 10px 30px rgb(30 26 40 / 0.05); background: var(--panel); backdrop-filter: blur(12px); }
/* 머리말에만 아주 옅은 노을을 깐다. 이 화면이 다른 화면과 다른 시간대에 있다는 표시 */
.tarot-intro {
  padding: 28px;
  background:
    radial-gradient(120% 90% at 12% 0%, color-mix(in srgb, var(--mystic-dusk) 16%, transparent), transparent 62%),
    radial-gradient(90% 70% at 95% 8%, color-mix(in srgb, var(--mystic-glow) 15%, transparent), transparent 60%),
    color-mix(in srgb, var(--surface) 84%, transparent);
}
.tarot-eyebrow, .tarot-kind { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 8px; color: var(--mystic); font-family: var(--font-mono); font-size: 11px; letter-spacing: .1em; }
h1, h2 { margin: 0; color: var(--ink); font-weight: 600; }
h1 { font-size: 34px; line-height: 1.15; }
h2 { font-size: 24px; line-height: 1.25; }
.tarot-intro p { margin: 12px 0 0; color: var(--muted); font-size: 13.5px; line-height: 1.65; }
/*
 * "지금 무엇을 하면 되는지" 한 줄. 이 화면에서 가장 중요한 안내라
 * 날짜 줄보다 크고 진하게 두고, 옅은 띠로 감싸 눈이 먼저 닿게 한다.
 */
.tarot-cta {
  display: flex;
  gap: 9px;
  align-items: center;
  margin-top: 18px !important;
  padding: 13px 16px;
  border-radius: 14px;
  background: linear-gradient(100deg, color-mix(in srgb, var(--mystic-dusk) 15%, transparent), color-mix(in srgb, var(--mystic-glow) 12%, transparent));
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.6;
}

/* 앞에 작은 점 하나 — 읽어야 할 줄이라는 표시 */
.tarot-cta::before {
  content: '';
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--mystic);
}
.tarot-cta b { color: var(--mystic); }

/* ── 세 자리 ── */
.spread { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; padding: 18px 20px; }
.slot { position: relative; display: grid; gap: 8px; align-content: start; }
.slot-label { display: flex; gap: 6px; align-items: center; margin: 0; color: var(--faint); font-family: var(--font-mono); font-size: 11px; }
.slot-label b { display: grid; width: 18px; height: 18px; place-items: center; border: 1px solid var(--line-strong); border-radius: 50%; color: var(--muted); background: transparent; font-size: 10px; font-weight: 600; }
.slot.active .slot-label b, .slot.filled .slot-label b { border-color: var(--mystic-line); color: var(--mystic); }
/* 자리 카드는 작게 — 이게 크면 아래 '카드 뽑는 곳'이 화면 밖으로 밀려난다 */
.slot-frame { position: relative; width: 100%; max-width: 132px; margin: 0 auto; aspect-ratio: 1144 / 1919; overflow: hidden; border-radius: 12px; box-shadow: 0 8px 18px #17132528; transition: transform .3s ease; }
/* 빈 자리를 덮는 투명 버튼 — 누르면 덱으로 내려간다 */
.slot-jump { position: absolute; inset: 0; z-index: 2; border: 0; border-radius: 12px; background: transparent; cursor: pointer; }
.slot-jump:focus-visible { outline: 2px solid var(--mystic); outline-offset: 2px; }
.slot.active .slot-frame { transform: translateY(-4px); }
.slot-image { display: block; width: 100%; height: 100%; object-fit: cover; }
.slot-image.reversed { transform: rotate(180deg); }
.slot-empty { display: grid; width: 100%; height: 100%; gap: 8px; place-content: center; place-items: center; border: 1.5px dashed var(--line-strong); border-radius: 12px; background: color-mix(in srgb, var(--paper) 60%, transparent); transition: border-color .25s ease, background .25s ease; }
.slot-mark { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 50%; color: var(--faint); background: var(--panel); font-family: var(--font-mono); font-size: 14px; font-weight: 700; }
.slot-wait { color: var(--faint); font-size: 11px; }
.slot.active .slot-empty { border-color: var(--mystic-line); border-style: solid; background: var(--mystic-soft); animation: breathe 2.2s ease-in-out infinite; }
.slot.active .slot-mark { color: #fff; background: var(--mystic); }
.slot.active .slot-wait { color: var(--mystic); font-weight: 700; }
@keyframes breathe { 50% { opacity: .72; } }
@media (prefers-reduced-motion: reduce) { .slot.active .slot-empty { animation: none; } }
.slot-title { margin: 0; color: var(--ink); font-size: 12.5px; font-weight: 600; line-height: 1.4; }
.slot-card { margin: 0; color: var(--muted); font-size: 12px; }
.slot-card.empty { color: var(--faint); }
.slot-card .up { color: var(--mystic); font-weight: 700; }
.slot-card .rev { color: var(--signal); font-weight: 700; }

/* ── 해석 ── */
.reading { display: grid; gap: 12px; padding: 26px 28px; }
.reading-head { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
.reading-head .tarot-kind { margin: 0; }
.tag { padding: 2px 9px; border-radius: 999px; font-size: 10.5px; font-weight: 700; letter-spacing: 0; }
/* 이제 조각으로 나뉘어 들어오므로 pre-wrap 으로 줄을 세지 않는다 */
.reading-text { display: grid; gap: 18px; margin: 0; color: var(--ink-soft); font-size: 14.5px; line-height: 1.9; }
.para { display: grid; gap: 4px; }
.para-head { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; margin: 0; }
/* 물음(자리 이름)은 색으로 */
.para-title { color: var(--mystic); font-size: 12.5px; font-weight: 700; letter-spacing: .01em; }
/* 답(뽑힌 카드)은 굵게 */
.para-card b { color: var(--ink); font-size: 14.5px; font-weight: 700; }
.para-card em { margin-left: 6px; padding: 1px 7px; border-radius: 999px; font-size: 11px; font-style: normal; font-weight: 600; }
.para-card em.up { background: var(--mystic-soft); color: var(--mystic); }
.para-card em.rev { background: color-mix(in srgb, var(--gold) 16%, transparent); color: var(--gold); }
.para-body { margin: 0; }
/* 맺음말은 선 대신 옅은 띠 위에 앉힌다 — 선은 잘라내고, 띠는 감싼다 */
.reading-closing { margin: 4px 0 0; padding: 13px 16px; border-radius: 14px; background: linear-gradient(100deg, color-mix(in srgb, var(--mystic-dusk) 12%, transparent), color-mix(in srgb, var(--mystic-glow) 12%, transparent)); color: var(--ink-soft); font-size: 13px; line-height: 1.7; }
@keyframes pulse { 50% { opacity: .25; } }

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
/*
 * overflow: hidden 이면 hover 로 떠오른 윗줄 카드의 머리가 잘린다.
 * 대신 사방에 여백을 두르고 같은 크기의 음수 마진으로 되돌린다 —
 * 카드가 움직일 자리는 생기고, 바깥에서 보이는 크기는 그대로다.
 */
.tarot-card-grid { display: grid; grid-template-columns: repeat(13, 1fr); gap: 7px; padding: 14px 10px; margin: -14px -10px; transition: opacity .4s ease, transform .4s ease, filter .4s ease; }
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


.ghost-button { padding: 7px 14px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); background: var(--panel-strong); cursor: pointer; font: inherit; font-size: 12.5px; }
.ghost-button:hover { border-color: var(--mystic); color: var(--mystic); }

/* ── 무엇을 물을지 고르는 탭 ── */
/*
 * 머리말 카드 안에 얹힌 세 칸.
 *
 * 카드의 padding(28px) 을 좌우·위로 밀어내 카드 폭을 그대로 쓰고,
 * 아래에 실선을 그어 "여기서 고른 것이 아래 내용"임을 보인다.
 * 세 칸은 아래 .spread 와 같은 3등분이라 세로선이 맞아떨어진다.
 */
/*
 * 탭 줄과 본문 사이에만 선 하나를 남긴다.
 * 이 선이 없으면 탭이 그냥 굵은 글씨처럼 보여 눌러야 하는 줄 모른다.
 * 대신 아주 옅게 — 칸을 나누는 선이 아니라 층을 나누는 선이다.
 */
.kind-tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin: -28px -28px 18px; padding: 10px 10px 0; border-bottom: 1px solid color-mix(in srgb, var(--mystic) 16%, transparent); }
/* 고른 탭은 그 선 위에 얹혀 선을 살짝 덮는다 — 탭처럼 보이는 핵심 */
.kind-tabs button { position: relative; margin-bottom: -1px; }
.kind-tabs button { display: grid; gap: 2px; padding: 11px 16px; border: 0; border-radius: 14px; background: transparent; color: var(--muted); cursor: pointer; font: inherit; font-size: 13.5px; font-weight: 700; text-align: left; transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease; }
.kind-tabs button small { color: var(--faint); font-size: 11px; font-weight: 500; }
.kind-tabs button:hover { background: color-mix(in srgb, var(--mystic) 7%, transparent); color: var(--mystic); }

/*
 * 고른 탭 — 채워서 알린다.
 *
 * 옅은 보라만 깔아 두었더니 안 고른 탭과 구별이 잘 안 됐다.
 * 이 앱은 '지금 여기'를 늘 채워서 알린다(위 메뉴의 초록 탭). 같은 말투로,
 * 다만 초록 대신 이 화면의 보라로 채운다. 위아래 두 톤을 섞어 납작하지 않게.
 */
.kind-tabs button.on { border-radius: 14px 14px 0 0; background: linear-gradient(170deg, #7b6ba0, var(--mystic-deep)); color: #fff; box-shadow: 0 4px 12px color-mix(in srgb, var(--mystic-deep) 30%, transparent); }
.kind-tabs button.on small { color: rgb(255 255 255 / 0.78); }
.kind-tabs button.on:hover { background: linear-gradient(170deg, #7b6ba0, var(--mystic-deep)); color: #fff; }


/* ── 기록 남기기 ── */
.save-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 18px; }
.tarot-act { display: inline-flex; gap: 6px; align-items: center; padding: 7px 14px; border: 1px solid var(--mystic-line); border-radius: 999px; background: transparent; color: var(--mystic); cursor: pointer; font: inherit; font-size: 12.5px; font-weight: 600; }
.tarot-act:hover:not(:disabled) { background: var(--mystic-soft); }
.tarot-act:disabled { cursor: default; opacity: 0.6; }
.save-hint { margin: 0; color: var(--muted); font-size: 12.5px; }
.save-hint.done { color: var(--mystic); font-weight: 600; }
.save-hint a { color: var(--mystic); font-weight: 600; }
.save-type select { padding: 7px 12px; border: 1px solid var(--line); border-radius: 999px; background: var(--panel-strong); color: var(--ink-soft); cursor: pointer; font: inherit; font-size: 12.5px; }
.save-button { padding: 7px 16px; border: 1px solid var(--mystic); border-radius: 999px; background: var(--mystic); color: var(--on-accent); cursor: pointer; font: inherit; font-size: 12.5px; font-weight: 600; }
.save-button:disabled { opacity: 0.6; cursor: progress; }
/* 화면 낭독기에만 읽히는 라벨 */
.sr-only { position: absolute; overflow: hidden; width: 1px; height: 1px; clip-path: inset(50%); white-space: nowrap; }

/*
 * 좁은 화면.
 *
 * 예전에는 세 자리를 한 줄에 하나씩 쌓았는데, 그러면 '세 장을 나란히 놓고 본다'는
 * 스프레드의 모양이 사라지고 스크롤만 길어졌다. 세 칸을 그대로 두고 카드와 글자를
 * 줄여 한 줄에 들어오게 한다.
 */
@media (max-width: 720px) {
  .spread { gap: 8px; padding: 14px 12px; }
  .slot { gap: 6px; }
  .slot-frame { max-width: none; }
  .slot-label { font-size: 10px; }
  .slot-label b { width: 15px; height: 15px; font-size: 9px; }
  .slot-mark { width: 26px; height: 26px; font-size: 12px; }
  .slot-wait { font-size: 9.5px; }
  .slot-title { font-size: 11.5px; }
  .slot-card { font-size: 11px; }

  /* 탭도 같은 3등분이라 함께 좁힌다 */
  .kind-tabs { margin: -22px -22px 14px; padding: 8px 8px 0; }
  .kind-tabs button { padding: 9px 8px; font-size: 12px; }
  .kind-tabs button small { font-size: 10px; }

  .tarot-intro, .reading, .tarot-deck { padding: 20px 22px; }
}
@media (max-width: 540px) {
  .tarot-card-grid { grid-template-columns: repeat(10, 1fr); gap: 4px; }
}
</style>
