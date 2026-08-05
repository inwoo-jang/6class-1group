<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import { useAuthStore } from '../stores/authStore'
import { useRecordStore } from '../stores/recordStore'
import { downloadBlob, drawLottoCard } from '../utils/resultCard'
import { shuffled } from '../utils/random'
import { link } from '../routes'

/**
 * 로또 번호 뽑기 — /final/games/lotto
 *
 * 전부 무작위다. 고를 것도 정할 것도 없이 누르면 된다.
 * 대신 추첨기가 돌아가고 공이 아래로 하나씩 떨어지는 걸 보여 준다 —
 * 결과만 툭 뜨는 것과 기다렸다 받는 것은 재미가 다르다.
 */
const MAX_NUMBER = 45
const PICK = 6
/** 세트는 A 부터 J 까지 */
const MAX_SETS = 10

const ALL_NUMBERS = Array.from({ length: MAX_NUMBER }, (_, i) => i + 1)

/**
 * 번호 색.
 *
 * 실제 로또 공의 색 구간(1-10 노랑 · 11-20 파랑 · 21-30 빨강 · 31-40 검정~회색 ·
 * 41-45 초록)을 그대로 쓴다. 게임 화면이라 채도만 한 톤 올려 둔다.
 */
const toneOf = (n) => {
  if (n <= 10) return '#f5bf35'
  if (n <= 20) return '#3d8fdd'
  if (n <= 30) return '#e8564c'
  if (n <= 40) return '#4b525c'
  return '#3fa870'
}

/* ── 추첨기 안에서 굴러다니는 공 (장식) ────────────────────────── */
const drumBalls = Array.from({ length: 18 }, (_, i) => ({
  n: ((i * 7 + 3) % MAX_NUMBER) + 1,
  angle: (i * 137.5) % 360, // 황금각 — 겹치지 않게 고르게 퍼진다
  // 통 안쪽 반지름에 대한 비율(%). px 로 적으면 화면이 좁을 때 통 밖으로 나간다
  radius: 24 + ((i * 17) % 68),
  delay: -(i * 0.31).toFixed(2), // 음수라 처음부터 제각각인 상태로 보인다
}))

/* ── 뽑기 ──────────────────────────────────────────────────────── */
/**
 * 세트는 한 번에 하나씩 쌓인다.
 * 뽑을 때마다 A · B · C … 로 아래 목록에 붙고, 열 개까지 모을 수 있다.
 */
const sets = ref([])
/** 지금 뽑는 중인 세트에서 아래로 떨어져 나온 공의 수 */
const dropped = ref(0)
const isDrawing = ref(false)
/** 뽑을 때마다 바뀌는 값. :key 에 넣어 등장 애니메이션을 다시 태운다 */
const runId = ref(0)

/** 한 세트에서 나오는 공 — 본 번호 여섯 + 보너스 하나 */
const PER_SET = PICK + 1

const isFull = computed(() => sets.value.length >= MAX_SETS)

/** 한 세트 뽑기 — 전부 무작위 */
const drawSet = () => {
  // 피셔-예이츠 + 암호용 난수. sort(() => Math.random() - 0.5) 는 고르게 섞이지 않는다
  const pool = shuffled(ALL_NUMBERS)
  return {
    numbers: pool.slice(0, PICK).sort((a, b) => a - b),
    bonus: pool[PICK], // 본 번호로 안 쓴 것 중 하나
  }
}

/** 공 하나가 나오는 간격 (한 번에 뽑기) */
const STEP_MS = 420

/** 'auto' 한 번에 다 뽑기 · 'manual' 한 개씩 내가 뽑기 */
const mode = ref('auto')

let timer = 0

/** 한 개씩 뽑는 중이라 아직 안 끝난 세트가 있는가 */
const isPending = computed(
  () => mode.value === 'manual' && sets.value.length > 0 && dropped.value < PER_SET,
)

/** 지금 뽑기 버튼을 누를 수 없는 때 */
const isBusy = computed(() => isDrawing.value)

/**
 * 방금 나온 공을 관에서 자리까지 날려 보낸다.
 *
 * 자리(슬롯)와 관은 화면에서 서로 멀리 떨어져 있고, 세트가 쌓일수록 거리가
 * 달라진다. 그래서 두 위치를 그때그때 재서 그 차이만큼 밀어 둔 뒤 0 으로
 * 되돌린다 — 관에서 굴러 나와 제자리에 앉는 것처럼 보인다.
 */
const flyFromChute = async () => {
  await nextTick()
  const chute = document.querySelector('.machine .chute')
  const balls = document.querySelectorAll('.lines .ball')
  const ball = balls[balls.length - 1]
  if (!chute || !ball) return

  const from = chute.getBoundingClientRect()
  const to = ball.getBoundingClientRect()
  ball.style.setProperty('--dx', `${from.left + from.width / 2 - (to.left + to.width / 2)}px`)
  ball.style.setProperty('--dy', `${from.bottom - (to.top + to.height / 2)}px`)
  ball.classList.add('fly')
}

/** 새 세트를 하나 만들어 붙인다 */
const startSet = () => {
  savedId.value = 0
  runId.value += 1
  dropped.value = 0
  sets.value = [...sets.value, drawSet()]
}

const draw = () => {
  if (isBusy.value) return

  // 한 개씩 뽑는 중이면, 이번 누름은 '다음 공 하나' 다
  if (isPending.value) {
    dropped.value += 1
    flyFromChute()
    return
  }

  if (isFull.value) {
    ElMessage.warning(`세트는 ${MAX_SETS}개까지 모을 수 있어요.`)
    return
  }

  startSet()

  if (mode.value === 'manual') {
    // 통만 한 번 흔들어 주고, 공은 사람이 누를 때마다 나온다
    return
  }

  isDrawing.value = true
  window.clearInterval(timer)
  // 추첨기가 한 바퀴 돌 시간을 준 뒤부터 하나씩 내보낸다
  window.setTimeout(() => {
    timer = window.setInterval(() => {
      dropped.value += 1
      flyFromChute()
      if (dropped.value >= PER_SET) {
        window.clearInterval(timer)
        isDrawing.value = false
      }
    }, STEP_MS)
  }, 700)
}

/** 뽑는 방식을 바꾸면 진행 중이던 세트는 접는다 */
const setMode = (next) => {
  if (isDrawing.value || mode.value === next) return
  if (isPending.value) sets.value = sets.value.slice(0, -1)
  mode.value = next
  dropped.value = PER_SET
}

const removeSet = (index) => {
  if (isBusy.value) return
  sets.value = sets.value.filter((_, i) => i !== index)
  savedId.value = 0
}

const clearAll = () => {
  if (isBusy.value || !sets.value.length) return
  sets.value = []
  dropped.value = PER_SET
  savedId.value = 0
  ElMessage.success({ message: '뽑은 세트를 모두 지웠어요.', duration: 1400 })
}

onBeforeUnmount(() => window.clearInterval(timer))

/**
 * 이 공이 이미 나왔는지.
 * 앞서 뽑아 둔 세트는 전부 나온 상태고, 마지막 세트만 하나씩 채워진다.
 */
const isOut = (setIndex, ballIndex) =>
  setIndex < sets.value.length - 1 || ballIndex < dropped.value

const letterOf = (index) => String.fromCharCode(65 + index) // A, B, C…

/* ── 기록 남기기 ───────────────────────────────────────────────── */
const auth = useAuthStore()
const { isLoggedIn } = storeToRefs(auth)
const recordStore = useRecordStore()

const savedId = ref(0)

/*
 * 로그인해 있으면 한 세트가 다 나올 때마다 알아서 남긴다.
 *
 * 세트를 더 뽑을 때마다 전체를 다시 저장하면 같은 번호가 여러 번 쌓인다.
 * 그래서 "방금 나온 한 세트"만 한 건으로 남긴다 — 기록에서 보기에도 그 편이 맞다.
 */
const savedCount = ref(0)

watch([sets, isDrawing, isPending, isLoggedIn], () => {
  if (!isLoggedIn.value || isDrawing.value || isPending.value) return
  if (sets.value.length <= savedCount.value) {
    // 지웠다면 센 값도 되돌린다
    savedCount.value = sets.value.length
    return
  }
  saveLatest()
})

const saveLatest = async () => {
  const set = sets.value[sets.value.length - 1]
  if (!set) return
  const index = sets.value.length - 1
  savedCount.value = sets.value.length

  const saved = await recordStore.add({
    kind: 'game',
    type: '로또 번호',
    reading: `${letterOf(index)} 세트를 뽑았어요.`,
    meta: {
      gameId: 'lotto',
      result: set.numbers.join('·'),
      lines: [set.numbers],
      bonus: [set.bonus],
    },
  })
  if (!saved) {
    savedCount.value = index // 실패했으면 다음에 다시 시도한다
    return
  }
  savedId.value = saved.id
}

/* 뽑은 번호를 그림 한 장으로 */
const isMakingImage = ref(false)

const saveImage = async () => {
  if (!sets.value.length || isMakingImage.value) return
  isMakingImage.value = true
  try {
    const blob = await drawLottoCard({
      sets: sets.value.map((set, i) => ({ letter: letterOf(i), ...set })),
    })
    if (!blob) throw new Error('no blob')
    downloadBlob(blob, `로또번호_${new Date().toLocaleDateString('ko-KR')}.png`)
    ElMessage.success({ message: '그림으로 저장했어요!', duration: 1600 })
  } catch {
    ElMessage.error('그림을 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.')
  } finally {
    isMakingImage.value = false
  }
}

</script>

<template>
  <BaseDashboardCard>
    <div class="lotto">
      <header class="head">
        <div>
          <p class="eyebrow">GAME · LOTTO</p>
          <h3>로또 번호 뽑기</h3>
        </div>
        <RouterLink class="quit" :to="link('games')">게임 목록</RouterLink>
      </header>

      <!-- ── 추첨기 ── -->
      <div class="machine" :class="{ on: isDrawing || isPending }">
        <div class="drum">
          <div class="tumble">
            <!-- 가운데에서 바깥으로 뻗은 줄(.chip) 위에, 비율만큼 떨어뜨려 얹는다 -->
            <span v-for="(ball, i) in drumBalls" :key="i" class="chip" :style="{ transform: `rotate(${ball.angle}deg)` }">
              <i
                :style="{
                  background: toneOf(ball.n),
                  left: `${ball.radius}%`,
                  animationDelay: `${ball.delay}s`,
                }"
                >{{ ball.n }}</i
              >
            </span>
          </div>
          <span class="drum-gloss" aria-hidden="true" />
        </div>

        <!-- 공이 빠져나오는 관 -->
        <span class="chute" aria-hidden="true" />
      </div>

      <!-- ── 뽑기 ── -->
      <section class="draw">
        <div class="modes">
          <button type="button" :class="{ on: mode === 'auto' }" :disabled="isDrawing" @click="setMode('auto')">
            한 번에 뽑기
          </button>
          <button type="button" :class="{ on: mode === 'manual' }" :disabled="isDrawing" @click="setMode('manual')">
            한 개씩 뽑기
          </button>
        </div>

        <div class="acts">
          <button type="button" class="clear" :disabled="!sets.length || isBusy" @click="clearAll">
            전체 삭제
          </button>
          <button
            type="button"
            class="go"
            :disabled="isBusy || (isFull && !isPending)"
            @click="draw"
          >
            {{
              isDrawing
                ? '뽑는 중…'
                : isPending
                  ? `공 뽑기 ${dropped + 1} / ${PER_SET}`
                  : sets.length
                    ? '세트 더 뽑기'
                    : '번호 뽑기'
            }}
          </button>
        </div>

        <p class="count">모은 세트 <b>{{ sets.length }}</b> / {{ MAX_SETS }}</p>
      </section>

      <!-- ── 결과 ── -->
      <section v-if="sets.length" class="result" aria-live="polite">
        <ul class="lines">
          <li v-for="(set, si) in sets" :key="si">
            <span class="letter">{{ letterOf(si) }}</span>

            <span class="balls">
              <!-- 아직 안 나온 자리는 빈 칸으로 남겨 둔다. 자리가 밀리면 어수선하다 -->
              <span
                v-for="(n, bi) in set.numbers"
                :key="`${runId}-${si}-${bi}`"
                class="slot"
                :class="{ out: isOut(si, bi) }"
              >
                <span v-if="isOut(si, bi)" class="ball" :style="{ background: toneOf(n) }">
                  {{ n }}
                </span>
              </span>

              <span class="plus" aria-hidden="true">+</span>
              <span class="slot small" :class="{ out: isOut(si, PICK) }">
                <span
                  v-if="isOut(si, PICK)"
                  class="ball bonus"
                  :style="{ background: toneOf(set.bonus) }"
                >
                  {{ set.bonus }}
                </span>
              </span>
            </span>

            <button
              type="button"
              class="drop"
              :disabled="isDrawing"
              aria-label="이 세트 지우기"
              @click="removeSet(si)"
            >
              ×
            </button>
          </li>
        </ul>

        <p class="hint">마지막 한 칸은 보너스 번호예요.</p>

        <div v-if="!isDrawing && !isPending" class="result-acts">
          <button type="button" class="save" :disabled="isMakingImage" @click="saveImage">
            {{ isMakingImage ? '만드는 중…' : '그림으로 저장' }}
          </button>

          <!-- 로그인해 있으면 알아서 저장된다. 아니면 로그인 안내만 -->
          <RouterLink v-if="savedId" class="saved" :to="link('records')">
            My 에서 보기 →
          </RouterLink>
          <RouterLink v-else-if="!isLoggedIn" class="saved ghost" :to="link('login')">
            로그인하면 기록에 남아요
          </RouterLink>
        </div>
      </section>

    </div>
  </BaseDashboardCard>
</template>

<style scoped>
.lotto {
  display: grid;
  gap: 18px;
}

.head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.eyebrow {
  margin: 0 0 4px;
  color: var(--slate);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
}

h3 {
  margin: 0;
  color: var(--ink);
  font-size: 20px;
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
  border-color: var(--slate);
  color: var(--slate);
}

.section-label {
  margin: 0;
  color: var(--faint);
  font-size: 12px;
  font-weight: 700;
}

.section-label b {
  color: var(--ink-soft);
}

/* ── 추첨기 ── */
.machine {
  position: relative;
  justify-self: center;
  padding-bottom: 26px; /* 아래 관이 놓일 자리 */
}

.drum {
  position: relative;
  width: min(230px, 68vw);
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: radial-gradient(circle at 32% 28%, #fdfefe, #dfe7ee 62%, #c3ced9);
  box-shadow:
    inset 0 -14px 26px rgb(90 110 130 / 0.28),
    inset 0 10px 20px rgb(255 255 255 / 0.7),
    0 0 0 7px #2b3038,
    0 16px 32px rgb(40 46 56 / 0.24);
}

/* 뽑는 동안 통이 흔들린다 */
.machine.on .drum {
  animation: shake 0.42s ease-in-out infinite;
}

@keyframes shake {
  25% {
    transform: rotate(-1.6deg);
  }

  75% {
    transform: rotate(1.6deg);
  }
}

/* 안쪽 공 뭉치. 통과 따로 돌아야 굴러다니는 것처럼 보인다 */
.tumble {
  position: absolute;
  inset: 12%;
  animation: churn 7s linear infinite;
}

.machine.on .tumble {
  animation-duration: 1.1s;
}

@keyframes churn {
  to {
    transform: rotate(360deg);
  }
}

/* 통 가운데에서 바깥으로 뻗은 줄 — 여기 위에 공을 얹는다 */
.chip {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 0;
  transform-origin: 0 0;
}

/* 공마다 제각각 통통 튄다 */
.chip i {
  position: absolute;
  top: -14px;
  display: grid;
  width: 28px;
  height: 28px;
  margin-left: -14px;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  font-size: 11.5px;
  font-style: normal;
  font-weight: 800;
  animation: bob 1.4s ease-in-out infinite alternate;
  box-shadow:
    inset 0 -2px 4px rgb(0 0 0 / 0.2),
    inset 0 2px 4px rgb(255 255 255 / 0.32);
}

@keyframes bob {
  to {
    transform: translateY(-3px) scale(1.08);
  }
}

.drum-gloss {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(60% 40% at 30% 16%, rgb(255 255 255 / 0.85), transparent 70%);
  pointer-events: none;
}

/* 공이 빠져나오는 관 */
.chute {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 44px;
  height: 30px;
  border-radius: 0 0 12px 12px;
  background: linear-gradient(#2b3038, #3c434e);
  transform: translateX(-50%);
  box-shadow: 0 6px 14px rgb(40 46 56 / 0.28);
}

/* ── 뽑기 ── */
.draw {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-radius: 18px;
  background: var(--surface-sunken);
}

.modes {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgb(0 0 0 / 0.05);
}

.modes button {
  padding: 8px 14px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
}

.modes button.on {
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 2px 6px rgb(40 46 56 / 0.12);
}

.modes button:disabled {
  cursor: default;
  opacity: 0.5;
}

.count {
  flex-basis: 100%;
  margin: 0;
  color: var(--faint);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.count b {
  color: var(--ink-soft);
}

.acts {
  display: flex;
  gap: 8px;
  align-items: center;
}

.clear {
  padding: 9px 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
}

.clear:hover:not(:disabled) {
  border-color: var(--danger);
  color: var(--danger);
}

.clear:disabled {
  cursor: default;
  opacity: 0.4;
}

.go {
  flex: none;
  padding: 12px 26px;
  border: 0;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.01em;
  box-shadow: 0 6px 16px rgb(30 34 42 / 0.24);
  transition: transform 0.2s ease;
}

.go:hover:not(:disabled) {
  transform: translateY(-2px);
}

.go:disabled {
  cursor: default;
  opacity: 0.55;
}

/* ── 결과 ── */
.result {
  display: grid;
  gap: 10px;
  padding: 20px 18px;
  border-radius: 20px;
  background: linear-gradient(
    120deg,
    color-mix(in srgb, var(--slate) 14%, transparent),
    color-mix(in srgb, var(--accent) 10%, transparent)
  );
}

.lines {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.lines li {
  display: flex;
  gap: 10px;
  align-items: center;
}

.letter {
  flex: none;
  width: 18px;
  color: var(--slate);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
}

.balls {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

/* 아직 안 나온 자리 — 빈 동그라미로 남겨 둔다 */
.slot {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 50%;
  background: rgb(0 0 0 / 0.05);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.05);
}

.slot.small {
  width: 32px;
  height: 32px;
}

.slot.out {
  background: transparent;
  box-shadow: none;
}

.ball {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  /* 관에서 떨어져 제자리에 툭 놓이는 움직임 */
  animation: drop 0.42s cubic-bezier(0.2, 1.5, 0.4, 1) both;
  box-shadow:
    inset 0 -3px 6px rgb(0 0 0 / 0.18),
    inset 0 3px 6px rgb(255 255 255 / 0.3),
    0 4px 10px rgb(40 46 56 / 0.2);
}

.ball.bonus {
  font-size: 12.5px;
  opacity: 0.92;
}

.drop {
  display: grid;
  width: 20px;
  height: 20px;
  margin-left: auto;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgb(0 0 0 / 0.06);
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  line-height: 1;
}

.drop:hover:not(:disabled) {
  background: var(--danger-tint);
  color: var(--danger);
}

.drop:disabled {
  cursor: default;
  opacity: 0.35;
}

.plus {
  color: var(--faint);
  font-size: 13px;
  font-weight: 700;
}

@keyframes drop {
  from {
    opacity: 0;
    transform: translateY(-26px) scale(0.5);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

/* 관에서 굴러 나와 제자리에 앉는 공 — 거리는 자바스크립트가 재서 넣어 준다 */
.ball.fly {
  animation: fly 0.62s cubic-bezier(0.22, 0.9, 0.3, 1) both;
}

@keyframes fly {
  from {
    opacity: 0.85;
    transform: translate(var(--dx, 0), var(--dy, 0)) scale(1.25);
  }

  60% {
    opacity: 1;
  }

  to {
    transform: none;
  }
}

.hint {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.result-acts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.result-acts button,
.result-acts .saved {
  padding: 10px 18px;
  border: 0;
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink-soft);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.result-acts .save {
  background: var(--accent);
  color: var(--on-accent);
}

.result-acts .saved {
  background: var(--accent-tint);
  color: var(--accent);
}

.result-acts .saved.ghost {
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--line);
  color: var(--muted);
}

.result-acts button:hover:not(:disabled),
.result-acts .saved:hover {
  opacity: 0.88;
}

@media (prefers-reduced-motion: reduce) {
  .ball {
    animation-duration: 0.01s;
  }

  .go:hover:not(:disabled) {
    transform: none;
  }

  .tumble,
  .machine.on .drum {
    animation: none;
  }
}
</style>
