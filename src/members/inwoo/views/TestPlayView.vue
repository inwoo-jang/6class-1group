<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
// 아이콘은 Ant Design 의 Vue 판을 쓴다 (@ant-design/icons 는 React 전용)
import { PictureFilled, RedoOutlined } from '@ant-design/icons-vue'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import { calculateResult, findTest, tests } from '../data/personalityTests'
import { useAuthStore } from '../stores/authStore'
import { useRecordStore } from '../stores/recordStore'
import { downloadBlob, drawResultCard } from '../utils/resultCard'
import { link } from '../routes'

/**
 * 테스트 진행 — /final/tests/:testId
 *
 * 한 화면에서 문항 → 결과까지 끝난다. 서버가 없으므로 새로고침하면 처음부터다.
 * 대신 뒤로 가기(이전 문항)를 두어 잘못 고른 답을 고칠 수 있게 했다.
 */
const route = useRoute()

const test = computed(() => findTest(route.params.testId))

/** 문항 순서대로 고른 선택지 인덱스. 아직 안 고른 자리는 undefined */
const picks = ref([])
const step = ref(0)

/** 다른 테스트로 옮겨가면 처음부터 다시 */
watch(
  () => route.params.testId,
  () => {
    picks.value = []
    step.value = 0
  },
)

const total = computed(() => test.value?.questions.length ?? 0)
const current = computed(() => test.value?.questions[step.value] ?? null)
const isDone = computed(() => picks.value.filter((p) => p !== undefined).length === total.value)

/** 결과는 다 고른 뒤에만 계산한다 */
const outcome = computed(() =>
  isDone.value && test.value ? calculateResult(test.value, picks.value) : null,
)

const progress = computed(() => (total.value ? Math.round((step.value / total.value) * 100) : 0))

const choose = (optionIndex) => {
  // 배열을 새로 만들어 담는다. 자리만 바꾸면 반응성이 늦게 따라오는 경우가 있다.
  const next = [...picks.value]
  next[step.value] = optionIndex
  picks.value = next

  // 마지막 문항이면 total 로 넘겨 결과 화면을 띄운다
  step.value = step.value < total.value - 1 ? step.value + 1 : total.value
}

const goBack = () => {
  if (step.value > 0) step.value -= 1
}

const restart = () => {
  picks.value = []
  step.value = 0
}

/* ── 그림으로 저장 ─────────────────────────────────────────────
 *
 * 화면을 그대로 찍지 않고 공유용 카드를 새로 그린다.
 * 버튼·메뉴가 같이 찍히지 않고, 어느 브라우저에서 눌러도 같은 그림이 나온다.
 * 그리는 일은 utils/resultCard.js 가 맡는다.
 */
const isMakingImage = ref(false)

const saveImage = async () => {
  const result = outcome.value?.result
  if (!result || isMakingImage.value) return

  isMakingImage.value = true
  try {
    const blob = await drawResultCard({ test: test.value, result })
    if (!blob) throw new Error('no blob')
    downloadBlob(blob, `${result.title}_${test.value.short}.png`)
    ElMessage.success({ message: '이미지로 저장했어요!', duration: 1600 })
  } catch {
    ElMessage.error('그림을 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.')
  } finally {
    isMakingImage.value = false
  }
}

/*
 * 결과 그림 미리 받아 두기.
 *
 * 결과 화면에 닿고 나서야 그림을 받으면, 동그란 자리가 잠깐 하얗게 비어 있다.
 * 문항을 푸는 동안 미리 받아 두면 결과와 그림이 같이 나타난다.
 */
const preload = () => {
  if (!test.value) return
  for (const result of Object.values(test.value.results)) {
    if (result.image) new Image().src = result.image
  }
}

onMounted(preload)
watch(() => route.params.testId, preload)

/** '86%' 처럼 퍼센트면 숫자만 꺼낸다. 아니면 null — 막대를 그리지 않는다 */
const percentOf = (value) => {
  const matched = String(value).match(/^(\d{1,3})\s*%$/)
  if (!matched) return null
  return Math.min(100, Number(matched[1]))
}

/** 이 테스트가 아닌 다른 테스트들 */
const others = computed(() => tests.filter((item) => item.id !== route.params.testId))

/* ── 기록 남기기 ────────────────────────────────────────────────── */

/**
 * 운세와 같은 기록함에 담는다. 저장되는 모양만 다르다.
 *   운세  kind: 'tarot' — 카드 세 장 + 해석
 *   테스트 kind: 'test'  — 어떤 테스트에서 어떤 결과가 나왔는지
 *
 * 그림 주소(빌드마다 해시가 바뀐다)는 저장하지 않는다. testId·resultId 만
 * 남겨 두면 기록 화면이 지금 번들의 그림을 다시 찾아 쓴다.
 */
const auth = useAuthStore()
const { isLoggedIn } = storeToRefs(auth)

const recordStore = useRecordStore()
const { isSaving } = storeToRefs(recordStore)

/** 0 이면 아직 저장 전 */
const savedRecordId = ref(0)

// 다시 풀면 저장 표시도 지운다
watch([() => route.params.testId, step], () => {
  if (step.value < total.value) savedRecordId.value = 0
})

const saveResult = async () => {
  const result = outcome.value?.result
  if (!result) return

  const saved = await recordStore.add({
    kind: 'test',
    type: test.value.short,
    reading: `${result.title} — ${result.subtitle}\n${result.description}`,
    meta: {
      testId: test.value.id,
      resultId: outcome.value.id,
      title: result.title,
      subtitle: result.subtitle,
      emoji: result.emoji,
    },
  })

  if (!saved) {
    ElMessage.error(recordStore.errorMessage)
    return
  }

  savedRecordId.value = saved.id
  ElMessage.success({ message: 'My 에 저장했어요!', duration: 1600 })
}

/*
 * 로그인해 있으면 알아서 남긴다 (운세와 같은 규칙).
 * 결과를 보고 나서 저장 버튼을 또 눌러야 하는 것은 군더더기다.
 * 이미 저장했거나 저장 중이면 건너뛴다.
 */
watch(
  [outcome, isLoggedIn],
  ([result, loggedIn]) => {
    if (!result?.result || !loggedIn) return
    if (savedRecordId.value || isSaving.value) return
    saveResult()
  },
  { immediate: true },
)
</script>

<template>
  <BaseDashboardCard v-if="!test">
    <p class="missing">그런 테스트는 없습니다. <RouterLink :to="link('tests')">목록으로</RouterLink></p>
  </BaseDashboardCard>

  <BaseDashboardCard v-else>
    <div class="play" :style="{ '--tone': outcome?.result?.tone ?? test.accent }">
      <!-- ── 머리말 ── -->
      <header class="head">
        <div>
          <p class="eyebrow">
            <img v-if="test.chip" :src="test.chip" alt="" />
            <span v-else aria-hidden="true">{{ test.emoji }}</span>
            <span>{{ test.short }}</span>
          </p>
          <h3>{{ test.title }}</h3>
        </div>
        <RouterLink class="quit" :to="link('tests')">목록</RouterLink>
      </header>

      <!-- ── 진행 중 ── -->
      <template v-if="step < total">
        <div class="progress" role="progressbar" :aria-valuenow="step" :aria-valuemax="total">
          <span class="bar" :style="{ width: `${progress}%` }" />
        </div>
        <p class="count">{{ step + 1 }} / {{ total }}</p>

        <p class="question">{{ current.text }}</p>

        <ul class="options">
          <li v-for="(option, index) in current.options" :key="option.text">
            <button
              type="button"
              :class="{ picked: picks[step] === index }"
              @click="choose(index)"
            >
              <span class="mark" aria-hidden="true">{{ 'ABCD'[index] }}</span>
              <span>{{ option.text }}</span>
            </button>
          </li>
        </ul>

        <button v-if="step > 0" type="button" class="back" @click="goBack">← 이전 문항</button>
      </template>

      <!-- ── 결과 ── -->
      <template v-else-if="outcome?.result">
        <!-- ① 히어로 — 그림과 이름만. 결과를 "받았다"는 느낌이 먼저다 -->
        <section class="hero" aria-live="polite">
          <p class="hero-top">내 결과는</p>

          <figure v-if="outcome.result.image" class="portrait">
            <img :src="outcome.result.image" :alt="`${outcome.result.title} 그림`" />
            <span class="glitter glitter-a" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
            <span class="glitter glitter-b" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
          </figure>
          <p v-else class="portrait-emoji" aria-hidden="true">{{ outcome.result.emoji }}</p>

          <h4>{{ outcome.result.title }}</h4>
          <p class="hero-sub">{{ outcome.result.subtitle }}</p>

          <ul v-if="outcome.result.keywords" class="tags">
            <li v-for="word in outcome.result.keywords" :key="word">#{{ word }}</li>
          </ul>

          <!--
            숫자 하나가 흰 상자에 덩그러니 놓이면 무슨 뜻인지 와닿지 않는다.
            퍼센트는 채워진 막대로, 그 외 값은 그대로 크게 적는다.
          -->
          <ul v-if="outcome.result.facts" class="stats">
            <!-- 클래스 이름은 stat-* 로 묶는다. 아래 점수 막대가 이미 .gauge 를 쓰고 있어
                 같은 이름을 붙이면 그 규칙(height: 7px)이 이 칸에 걸린다 -->
            <li
              v-for="fact in outcome.result.facts"
              :key="fact.label"
              :class="{ 'stat-wide': percentOf(fact.value) !== null }"
            >
              <span class="stat-top">
                <small>{{ fact.label }}</small>
                <b>{{ fact.value }}</b>
              </span>
              <span v-if="percentOf(fact.value) !== null" class="stat-bar" aria-hidden="true">
                <i :style="{ width: `${percentOf(fact.value)}%` }" />
              </span>
            </li>
          </ul>
        </section>

        <!-- ② 설명 — 말풍선으로 -->
        <section class="bubble">
          <p>{{ outcome.result.description }}</p>
        </section>

        <!-- ③ 강점 · 주의 -->
        <div class="pair">
          <section class="mini good">
            <p class="mini-head"><span aria-hidden="true">💪</span> 이런 걸 잘해요</p>
            <ul>
              <li v-for="item in outcome.result.strengths" :key="item">{{ item }}</li>
            </ul>
          </section>
          <section class="mini warn">
            <p class="mini-head"><span aria-hidden="true">🫣</span> 이건 조심</p>
            <ul>
              <li v-for="item in outcome.result.cautions" :key="item">{{ item }}</li>
            </ul>
          </section>
        </div>

        <!-- ④ 궁합 — 이름만 적으면 "그래서 뭐" 가 된다. 왜 맞는지까지 -->
        <section class="match">
          <span class="match-face" aria-hidden="true">💞</span>
          <span class="match-body">
            <small>이런 사람이랑 잘 맞아요</small>
            <b>{{ outcome.result.match.who }}</b>
            <em v-if="outcome.result.match.why">{{ outcome.result.match.why }}</em>
          </span>
        </section>

        <!-- ⑤ 한마디 -->
        <blockquote>{{ outcome.result.shareText }}</blockquote>

        <!-- ⑥ 점수 — 접어 둔다. 궁금한 사람만 편다 -->
        <details class="scores">
          <summary>내 점수 몇 점이었지? 👀</summary>
          <ul>
            <li v-for="row in outcome.ranking" :key="row.id" :class="{ top: row.id === outcome.id }">
              <span class="who">{{ row.emoji }} {{ row.title }}</span>
              <span class="gauge" aria-hidden="true">
                <i :style="{ width: `${(row.score / outcome.ranking[0].score) * 100}%` }" />
              </span>
              <b>{{ row.score }}</b>
            </li>
          </ul>
        </details>

        <!-- ⑦ 버튼 -->
        <div class="actions">
          <button type="button" class="primary" :disabled="isMakingImage" @click="saveImage">
            <PictureFilled aria-hidden="true" />
            {{ isMakingImage ? '만드는 중…' : '이미지로 저장' }}
          </button>

          <!-- 로그인해 있으면 알아서 저장된다. 저장된 뒤에는 보러 가는 길만 둔다 -->
          <RouterLink v-if="savedRecordId" class="saved" :to="link('records')">
            My 에서 보기 →
          </RouterLink>
          <RouterLink v-else class="saved ghost" :to="link('login')">
            로그인하고 저장하기
          </RouterLink>

          <button type="button" @click="restart"><RedoOutlined aria-hidden="true" /> 다시</button>
        </div>

        <!-- ⑧ 다른 테스트 -->
        <section v-if="others.length" class="others">
          <p class="label">이것도 해볼래요?</p>
          <RouterLink
            v-for="other in others"
            :key="other.id"
            :to="link('test', { testId: other.id })"
            @click="restart"
          >
            <img v-if="other.cover?.[0]" :src="other.cover[0]" alt="" />
            <span>
              <b>{{ other.short }}</b>
              <small>{{ other.questions.length }}문항 · 결과 {{ Object.keys(other.results).length }}종</small>
            </span>
            <span class="go" aria-hidden="true">→</span>
          </RouterLink>
        </section>
      </template>
    </div>
  </BaseDashboardCard>
</template>

<style scoped>
.play {
  display: grid;
  gap: 14px;
}

.missing {
  margin: 0;
  padding: 30px 0;
  color: var(--muted);
  text-align: center;
}

.missing a {
  color: var(--accent);
  font-weight: 600;
}

/* ── 머리말 ── */
.head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.eyebrow img {
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  object-fit: cover;
}


/* 그림·아이콘·글자를 한 줄에 가운데로 세운다 */
.eyebrow {
  display: flex;
  gap: 5px;
  align-items: center;
  margin: 0 0 4px;
  color: var(--tone);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
}

h3 {
  margin: 0;
  color: var(--ink);
  font-size: 17px;
}

.quit {
  flex: none;
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

.quit:hover {
  border-color: var(--tone);
  color: var(--tone);
}

/* ── 진행 ── */
.progress {
  height: 4px;
  border-radius: 999px;
  background: var(--surface-sunken);
  overflow: hidden;
}

.bar {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--tone);
  transition: width 0.3s ease;
}

.count {
  margin: 0;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11.5px;
}

.question {
  margin: 0;
  color: var(--ink);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.6;
}

.options {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.options button {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel-strong);
  color: var(--ink-soft);
  cursor: pointer;
  font: inherit;
  font-size: 13.5px;
  line-height: 1.6;
  text-align: left;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.options button:hover {
  border-color: var(--tone);
  background: color-mix(in srgb, var(--tone) 6%, transparent);
}

.options button.picked {
  border-color: var(--tone);
  background: color-mix(in srgb, var(--tone) 10%, transparent);
}

.mark {
  flex: none;
  color: var(--tone);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
}

.back {
  justify-self: start;
  padding: 6px 12px;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
}

.back:hover {
  color: var(--tone);
}

/* ══ 결과 ══════════════════════════════════════════════════════════
   또박또박한 설명서가 아니라 "결과 받았다!" 하는 화면이 되도록,
   블록을 잘게 나누고 각 블록에 표정(이모지)과 색을 준다.
   ══════════════════════════════════════════════════════════════════ */

/* ── ① 히어로 ── */
.hero {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 26px 20px 22px;
  border-radius: 26px;
  background:
    radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--tone) 18%, transparent), transparent 70%),
    linear-gradient(160deg, color-mix(in srgb, var(--tone) 9%, transparent), color-mix(in srgb, var(--tone) 3%, transparent));
  /*
   * clip 은 넘치는 것만 자르고 자리는 그대로 잡아 준다.
   * hidden 으로 두면 이 상자가 스크롤 컨테이너가 되어, 안에 든 것이 길어졌을 때
   * 늘어나지 않고 아래가 잘린다 (생존 확률 막대가 잘려 보이던 이유).
   */
  overflow: clip;
  text-align: center;
}

/* 결과 그림을 감싸는 여백에서 계속 반짝이는 별빛. */
.glitter {
  position: absolute;
  z-index: 2;
  width: 64px;
  height: 64px;
  pointer-events: none;
}

.glitter i {
  position: absolute;
  display: block;
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #fff, #fff6dc);
  clip-path: polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%);
  filter: drop-shadow(0 0 5px rgb(255 255 255 / 0.95));
  animation: star-twinkle 2.3s ease-in-out infinite alternate;
}

.glitter i:nth-child(1) { top: 3px; left: 26px; width: 12px; height: 12px; }
.glitter i:nth-child(2) { top: 25px; left: 3px; width: 7px; height: 7px; background: #fffdf6; animation-delay: 0.35s; }
.glitter i:nth-child(3) { right: 4px; bottom: 8px; width: 9px; height: 9px; background: #f3edff; animation-delay: 0.7s; }
.glitter i:nth-child(4) { bottom: 1px; left: 22px; width: 6px; height: 6px; background: #fff1d6; animation-delay: 1.05s; }
.glitter i:nth-child(5) { top: 13px; right: 1px; width: 5px; height: 5px; background: #e7f6ff; animation-delay: 1.4s; }
.glitter i:nth-child(6) { top: 42px; left: 12px; width: 5px; height: 5px; background: #fff; animation-delay: 1.75s; }
.glitter i:nth-child(7) { top: 18px; left: 14px; width: 4px; height: 4px; background: #f7efff; animation-delay: 0.2s; }
.glitter i:nth-child(8) { right: 16px; bottom: 20px; width: 6px; height: 6px; background: #fff9e8; animation-delay: 1.15s; }
.glitter i:nth-child(9) { right: 17px; bottom: 2px; width: 4px; height: 4px; background: #eef9ff; animation-delay: 1.9s; }

.portrait .glitter-a { top: -25px; left: -32px; }
.portrait .glitter-b { right: -32px; bottom: -25px; transform: scale(0.9) rotate(24deg); }

@keyframes star-twinkle {
  from { opacity: 0.22; transform: scale(0.55) rotate(0); }
  to { opacity: 1; transform: scale(1.2) rotate(35deg); }
}

.hero-top {
  margin: 0;
  color: var(--tone);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.portrait {
  position: relative;
  width: 176px;
  height: 176px;
  margin: 2px 0 4px;
  border-radius: 50%;
  overflow: visible;
}

.portrait img {
  display: block;
  width: 100%;
  height: 100%;
  border: 4px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 12px 30px color-mix(in srgb, var(--tone) 32%, transparent);
}

.portrait-emoji {
  margin: 0;
  font-size: 64px;
  line-height: 1;
}

h4 {
  margin: 0;
  color: var(--ink);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.hero-sub {
  margin: 0;
  max-width: 26em;
  color: var(--tone);
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.6;
}

/* 해시태그 */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}

.tags li {
  padding: 6px 13px;
  border-radius: 999px;
  background: #fff;
  color: var(--tone);
  font-size: 12.5px;
  font-weight: 700;
}

/* 숫자 자랑 (생존 확률 등) */
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  width: 100%;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.stats li {
  display: grid;
  gap: 6px;
  min-width: 96px;
  padding: 10px 16px;
  border-radius: 16px;
  background: rgb(255 255 255 / 0.9);
}

.stats li.stat-wide {
  min-width: 240px;
}

.stat-top {
  display: flex;
  gap: 10px;
  align-items: baseline;
  justify-content: space-between;
}

.stat-bar {
  display: block;
  overflow: hidden;
  height: 7px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--tone) 16%, transparent);
}

.stat-bar i {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: var(--tone);
  transition: width 0.8s cubic-bezier(0.2, 0.8, 0.3, 1);
}

.stats b {
  color: var(--tone);
  font-size: 19px;
  font-weight: 800;
}

.stats small {
  color: var(--muted);
  font-size: 11px;
}

/* ── ② 말풍선 ── */
.bubble {
  position: relative;
  padding: 16px 18px;
  border-radius: 18px;
  background: var(--surface-sunken);
}

/* 위쪽 히어로에서 이어지는 꼬리 */
.bubble::before {
  content: '';
  position: absolute;
  top: -7px;
  left: 32px;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background: var(--surface-sunken);
  transform: rotate(45deg);
}

.bubble p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.95;
}

/* ── ③ 강점 · 주의 ── */
.pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.mini {
  padding: 14px 16px;
  border-radius: 18px;
}

.mini.good { background: var(--accent-tint); }
.mini.warn { background: var(--signal-tint); }

.mini-head {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0 0 8px;
  font-size: 12.5px;
  font-weight: 800;
}

.mini.good .mini-head { color: var(--accent); }
.mini.warn .mini-head { color: var(--signal); }

.mini ul {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.mini li {
  padding: 5px 11px;
  border-radius: 999px;
  background: #fff;
  font-size: 12.5px;
  line-height: 1.5;
}

.mini.good li { color: var(--accent); }
.mini.warn li { color: var(--signal); }

/* ── ④ 궁합 ── */
.match {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border: 2px dashed color-mix(in srgb, var(--tone) 34%, transparent);
  border-radius: 18px;
}

.match-face { font-size: 22px; }

.match-body {
  display: grid;
  gap: 3px;
}

.match em {
  color: var(--muted);
  font-size: 12.5px;
  font-style: normal;
  line-height: 1.6;
}

.match small {
  color: var(--muted);
  font-size: 11.5px;
}

.match b {
  color: var(--ink);
  font-size: 14.5px;
  font-weight: 700;
}

/* ── ⑤ 한마디 ── */
blockquote {
  position: relative;
  margin: 0;
  padding: 20px 20px 20px 44px;
  border-radius: 18px;
  background: var(--tone);
  color: #fff;
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.7;
}

blockquote::before {
  content: '“';
  position: absolute;
  top: 6px;
  left: 16px;
  font-size: 44px;
  line-height: 1;
  opacity: 0.5;
}

/* ── ⑥ 점수 ── */
.scores {
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--panel-strong);
}

.scores summary {
  color: var(--muted);
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 700;
}

.scores ul {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.scores li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 84px 28px;
  gap: 10px;
  align-items: center;
  padding: 5px 0;
  color: var(--muted);
  font-size: 12px;
}

.who {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gauge {
  height: 7px;
  border-radius: 999px;
  background: var(--surface-sunken);
  overflow: hidden;
}

.gauge i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tone) 45%, transparent);
}

.scores li b {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.scores li.top {
  color: var(--tone);
  font-weight: 800;
}

.scores li.top .gauge i { background: var(--tone); }

/* ── ⑦ 버튼 ── */
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.actions button,
.actions .saved {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 12px 20px;
  border: 0;
  border-radius: 999px;
  background: var(--surface-sunken);
  color: var(--ink-soft);
  cursor: pointer;
  font: inherit;
  font-size: 13.5px;
  font-weight: 700;
  text-decoration: none;
}

.actions .primary {
  flex: 1;
  justify-content: center;
  min-width: 140px;
  background: var(--tone);
  color: #fff;
}

.actions .save {
  background: var(--accent);
  color: var(--on-accent);
}

.actions .saved {
  background: var(--accent-tint);
  color: var(--accent);
}

.actions .saved.ghost {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
}

.actions button:hover,
.actions .saved:hover { opacity: 0.88; }

.actions button:disabled { cursor: progress; opacity: 0.6; }

/* ── ⑧ 다른 테스트 ── */
.others {
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.label {
  margin: 0 0 8px;
  color: var(--faint);
  font-size: 12px;
  font-weight: 700;
}

.others a {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 14px 10px 10px;
  border-radius: 16px;
  background: var(--surface-sunken);
  color: var(--ink-soft);
  text-decoration: none;
}

.others a + a { margin-top: 8px; }

.others img {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
}

.others span {
  display: grid;
  gap: 1px;
}

.others b { font-size: 13.5px; font-weight: 700; }
.others small { color: var(--faint); font-size: 11.5px; }

.others .go {
  margin-left: auto;
  color: var(--faint);
}

.others a:hover { background: var(--accent-tint); color: var(--accent); }

@media (prefers-reduced-motion: reduce) {
  .glitter,
  .glitter i { animation: none; }
}
</style>
