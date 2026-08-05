<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { CheckOutlined, CloseOutlined, EditFilled } from '@ant-design/icons-vue'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import { useAuthStore } from '../stores/authStore'
import { useRecordStore } from '../stores/recordStore'
import { MAX_ITEMS, MIN_ITEMS, defaultSet, rouletteSets, sliceTones } from '../data/rouletteSets'
import { randomBelow, shuffled } from '../utils/random'
import { link } from '../routes'

/**
 * 룰렛 — /final/games/roulette
 *
 * 멈추는 건 사람이 한다. START 를 누르면 계속 돌고, STOP 을 누른 그 순간에
 * 결과를 정한 뒤 그 칸이 바늘에 오도록 천천히 잦아들게 한다.
 *
 * 순서를 뒤집으면 안 된다. 멈춘 뒤에 각도를 읽어 결과를 정하면,
 * 브라우저가 프레임을 건너뛸 때 화면과 결과가 어긋난다.
 *
 *   도는 중  : CSS animation 이 계속 돌린다 (끝을 정할 수 없으므로 transition 이 아니다)
 *   멈출 때  : 지금 각도를 읽어 그 자리에 붙인 뒤, transition 으로 목표까지 보낸다
 */
const route = useRoute()

const items = ref([...defaultSet.items])
const activeSetId = ref(defaultSet.id)
const draft = ref('')

const slice = computed(() => 360 / Math.max(items.value.length, 1))
const canSpin = computed(() => items.value.length >= MIN_ITEMS)

/** 칸 색은 이웃끼리 겹치지 않게 돌려 쓴다 */
const toneOf = (index) => sliceTones[index % sliceTones.length]

/**
 * 이름을 바로 세우는 데 필요한 각도.
 *
 * 이름은 원판 중심에서 바깥으로 뻗은 줄(.label) 위에 얹혀 있고, 그 줄은
 * i번째 칸 가운데(-90도 보정)만큼 돌아가 있다. 그만큼 되돌려 두면 원판이
 * 안 돌 때 글자가 똑바로 선다. 원판이 도는 만큼은 CSS 가 따로 되돌린다.
 */
const labelOffset = (index) => -(index * slice.value + slice.value / 2 - 90)

/**
 * 원판 그리기.
 * conic-gradient 는 "몇 도부터 몇 도까지 무슨 색" 을 그대로 적으면 되므로
 * 칸을 그리려고 캔버스를 쓸 필요가 없다.
 */
const wheelBackground = computed(() => {
  if (!items.value.length) return 'var(--surface-sunken)'
  const stops = items.value.map((_, i) => {
    const from = (i * slice.value).toFixed(3)
    const to = ((i + 1) * slice.value).toFixed(3)
    return `${toneOf(i)} ${from}deg ${to}deg`
  })
  return `conic-gradient(from 0deg, ${stops.join(', ')})`
})

/* ── 돌리기 ────────────────────────────────────────────────────── */
/** 'idle' 멈춤 · 'running' 도는 중 · 'stopping' 잦아드는 중 */
const phase = ref('idle')
const angle = ref(0)
const winner = ref('')
const wheelEl = ref(null)
/** 각도를 그 자리에 '붙일' 한 프레임 동안만 켠다 */
const snapping = ref(false)

/** 편집을 막아야 하는 상태 — 도는 중에 항목이 바뀌면 결과가 어긋난다 */
const isSpinning = computed(() => phase.value !== 'idle')

/** 잦아드는 데 걸리는 시간. CSS 의 transition 과 같아야 한다 */
const SLOW_MS = 3400

const start = () => {
  if (phase.value !== 'idle' || !canSpin.value) return
  winner.value = ''
  savedId.value = 0
  angle.value = 0
  phase.value = 'running'
}

/** 지금 화면에 그려진 각도를 읽는다 (CSS animation 이 돌리는 중이라 ref 로는 알 수 없다) */
const readAngle = () => {
  const matrix = new DOMMatrixReadOnly(getComputedStyle(wheelEl.value).transform)
  const deg = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI
  return deg < 0 ? deg + 360 : deg
}

const stop = async () => {
  if (phase.value !== 'running') return

  // ① 결과를 먼저 정한다 (내기에 쓰이므로 치우침 없는 난수로)
  const index = randomBelow(items.value.length)

  /*
   * ② 그 칸이 위쪽 바늘에 오도록 각도를 정한다.
   *    칸 i 의 한가운데는 i*slice + slice/2 이고 바늘은 0도(12시)에 있으므로,
   *    원판을 그만큼 되돌려야 한다. 칸 안에서 조금 흔들어 매번 같은 자리에
   *    멈추지 않게 한다.
   */
  const center = index * slice.value + slice.value / 2
  const jitter = (Math.random() - 0.5) * slice.value * 0.6
  const want = (((360 - center - jitter) % 360) + 360) % 360

  const from = readAngle()
  let target = from - (from % 360) + want
  while (target < from + 720) target += 360 // 최소 두 바퀴는 더 돌고 멈춘다

  // ③ 도는 애니메이션을 끄고, 지금 각도에 그대로 붙인다
  angle.value = from
  snapping.value = true
  phase.value = 'stopping'
  await nextTick()

  // 붙인 각도를 브라우저가 확정하게 한 뒤에야 목표를 준다. 안 그러면 안 움직인다
  void wheelEl.value?.offsetWidth
  snapping.value = false
  angle.value = target

  // ④ 다 멈춘 뒤에 결과를 보여 준다
  window.setTimeout(() => {
    winner.value = items.value[index]
    phase.value = 'idle'
  }, SLOW_MS)
}

/** 가운데 버튼 한 개로 START / STOP 을 겸한다 */
const toggle = () => (phase.value === 'running' ? stop() : start())

/* ── 항목 편집 ─────────────────────────────────────────────────── */
const useSet = (set) => {
  if (isSpinning.value) return
  activeSetId.value = set.id
  items.value = [...set.items]
  winner.value = ''
}

const addItem = () => {
  const text = draft.value.trim()
  if (!text || isSpinning.value) return
  if (items.value.length >= MAX_ITEMS) {
    ElMessage.warning(`항목은 ${MAX_ITEMS}개까지만 넣을 수 있어요.`)
    return
  }
  if (items.value.includes(text)) {
    ElMessage.warning('이미 있는 항목이에요.')
    return
  }
  items.value = [...items.value, text]
  activeSetId.value = ''
  draft.value = ''
  winner.value = ''
}

const removeItem = (index) => {
  if (isSpinning.value) return
  items.value = items.value.filter((_, i) => i !== index)
  activeSetId.value = ''
  winner.value = ''
  editingIndex.value = -1
}

/* ── 항목 고치기 ───────────────────────────────────────────────── */
const editingIndex = ref(-1)
const editingText = ref('')
const editInput = ref(null)

const startEdit = async (index) => {
  if (isSpinning.value) return
  editingIndex.value = index
  editingText.value = items.value[index]
  await nextTick()
  // v-for 안의 ref 는 배열로 모인다. 고치는 칸은 늘 하나뿐이라 첫 번째다
  const field = Array.isArray(editInput.value) ? editInput.value[0] : editInput.value
  field?.focus()
  field?.select()
}

const cancelEdit = () => {
  editingIndex.value = -1
  editingText.value = ''
}

const commitEdit = () => {
  if (editingIndex.value < 0) return
  const text = editingText.value.trim()
  const index = editingIndex.value

  if (!text) {
    ElMessage.warning('내용을 적어 주세요.')
    return
  }
  // 자기 자신은 빼고 본다 — 안 그러면 안 고치고 확인만 눌러도 막힌다
  if (items.value.some((item, i) => i !== index && item === text)) {
    ElMessage.warning('이미 있는 항목이에요.')
    return
  }

  items.value = items.value.map((item, i) => (i === index ? text : item))
  activeSetId.value = ''
  winner.value = ''
  cancelEdit()
}

/**
 * 순서 섞기.
 *
 * 같은 사람이 늘 같은 칸에 있으면 "저 자리가 잘 걸린다" 같은 느낌이 생긴다.
 * 돌리기 전에 한 번 섞어 두면 그 찜찜함이 없어진다.
 */
const shuffleItems = () => {
  if (isSpinning.value || items.value.length < 2) return
  items.value = shuffled(items.value)
  activeSetId.value = ''
  winner.value = ''
  editingIndex.value = -1
}

/** 전체 삭제 — 되돌릴 수 없으니 비어 있으면 아무 일도 하지 않는다 */
const clearAll = () => {
  if (isSpinning.value || !items.value.length) return
  items.value = []
  activeSetId.value = ''
  winner.value = ''
  editingIndex.value = -1
  ElMessage.success({ message: '항목을 모두 지웠어요.', duration: 1400 })
}

/* ── 기록 남기기 ───────────────────────────────────────────────── */
const auth = useAuthStore()
const { isLoggedIn } = storeToRefs(auth)
const recordStore = useRecordStore()
const { isSaving } = storeToRefs(recordStore)

const savedId = ref(0)

const save = async () => {
  if (!winner.value) return
  const saved = await recordStore.add({
    kind: 'game',
    type: '룰렛',
    reading: `${items.value.length}개 중에서 "${winner.value}" 이(가) 나왔어요.`,
    meta: {
      gameId: 'roulette',
      result: winner.value,
      // 나중에 기록에서 "무엇들 중에 골랐는지" 를 보여 주려고 함께 남긴다
      items: items.value,
    },
  })
  if (!saved) {
    ElMessage.error(recordStore.errorMessage)
    return
  }
  savedId.value = saved.id
  ElMessage.success({ message: 'My 에 저장했어요!', duration: 1600 })
}

/*
 * 로그인해 있으면 알아서 남긴다 (운세·테스트와 같은 규칙).
 * 결과가 나오는 순간 한 번만 — 같은 결과를 두 번 남기지 않는다.
 */
watch([winner, isLoggedIn], ([result, loggedIn]) => {
  if (!result || !loggedIn || savedId.value || isSaving.value) return
  save()
})

/*
 * My 기록에서 "이 목록으로 다시" 를 누르면 그때 돌린 항목이 주소에 담겨 온다.
 * 그대로 받아 채워 두면, 기록을 보다가 곧장 다시 돌릴 수 있다.
 */
onMounted(() => {
  const raw = route.query.items
  if (typeof raw !== 'string') return
  try {
    const list = JSON.parse(raw)
    if (!Array.isArray(list) || list.length < MIN_ITEMS) return
    items.value = list.map(String).slice(0, MAX_ITEMS)
    activeSetId.value = ''
  } catch {
    // 주소가 잘못 붙어 온 경우 — 기본 세트로 그냥 시작한다
  }
})
</script>

<template>
  <BaseDashboardCard>
    <div class="roulette">
      <header class="head">
        <div>
          <p class="eyebrow">GAME · ROULETTE</p>
          <h3>돌려서 정하기</h3>
        </div>
        <RouterLink class="quit" :to="link('games')">게임 목록</RouterLink>
      </header>

      <!-- ── 원판 ── -->
      <div class="stage">
        <span class="pin" aria-hidden="true" />
        <div
          ref="wheelEl"
          class="wheel"
          :class="{ running: phase === 'running', snap: snapping }"
          :style="{
            background: wheelBackground,
            transform: `rotate(${angle}deg)`,
            '--slice': `${slice}deg`,
          }"
        >
          <!-- 칸 사이 흰 줄 — 색만으로 나눈 것보다 훨씬 원판답다 -->
          <span class="spokes" aria-hidden="true" />

          <!-- 글자는 원판과 함께 돌아야 하므로 안쪽에 얹는다 -->
          <span
            v-for="(item, i) in items"
            :key="`${item}-${i}`"
            class="label"
            :style="{ transform: `rotate(${i * slice + slice / 2 - 90}deg)` }"
          >
            <!--
              글자는 원판을 따라 눕지 않는다.
              rotate  : 줄이 돌아간 만큼 되돌려 세워 두고
              transform: 원판이 돈 만큼을 반대로 되돌린다 (도는 중엔 CSS 애니메이션)
            -->
            <b :style="{ rotate: `${labelOffset(i)}deg`, transform: `rotate(${-angle}deg)` }">
              {{ item }}
            </b>
          </span>

          <span v-if="!items.length" class="empty-wheel">항목을 넣어 주세요</span>
        </div>

        <span class="gloss" aria-hidden="true" />

        <div class="hub">
          <button
            type="button"
            :class="{ stop: phase === 'running' }"
            :disabled="!canSpin || phase === 'stopping'"
            @click="toggle"
          >
            {{ phase === 'running' ? 'STOP' : phase === 'stopping' ? '…' : 'START' }}
          </button>
        </div>
      </div>

      <p v-if="isSpinning" class="guide">
        {{ phase === 'running' ? '마음이 정해지면 STOP 을 눌러 주세요.' : '멈추는 중…' }}
      </p>

      <!-- ── 결과 ── -->
      <section v-if="winner" class="result" aria-live="polite">
        <p class="result-label">오늘의 선택</p>
        <p class="result-name">{{ winner }}</p>

        <div class="result-acts">
          <button type="button" class="again" :disabled="isSpinning" @click="start">
            다시 돌리기
          </button>


          <!-- 로그인해 있으면 알아서 저장된다 -->
          <RouterLink v-if="savedId" class="saved" :to="link('records')">
            My 에서 보기 →
          </RouterLink>
          <RouterLink v-else class="saved ghost" :to="link('login')">
            로그인하면 기록에 남아요
          </RouterLink>
        </div>
      </section>

      <!-- ── 세트 고르기 ── -->
      <section class="sets">
        <p class="section-label">미리 만들어 둔 세트</p>
        <div class="set-list">
          <button
            v-for="set in rouletteSets"
            :key="set.id"
            type="button"
            :class="{ on: activeSetId === set.id }"
            :disabled="isSpinning"
            @click="useSet(set)"
          >
            <span aria-hidden="true">{{ set.emoji }}</span> {{ set.title }}
          </button>
        </div>
      </section>

      <!-- ── 직접 넣기 ── -->
      <section class="editor">
        <div class="editor-head">
          <p class="section-label">
            항목 <b>{{ items.length }}</b> / {{ MAX_ITEMS }}
          </p>
          <span class="editor-acts">
            <button
              type="button"
              class="clear shuffle"
              :disabled="items.length < 2 || isSpinning"
              @click="shuffleItems"
            >
              순서 섞기
            </button>
            <button
              type="button"
              class="clear"
              :disabled="!items.length || isSpinning"
              @click="clearAll"
            >
              전체 삭제
            </button>
          </span>
        </div>

        <form class="add" @submit.prevent="addItem">
          <el-input
            v-model="draft"
            size="large"
            placeholder="직접 넣을 항목을 적어 주세요"
            maxlength="14"
            :disabled="isSpinning || items.length >= MAX_ITEMS"
            @keyup.enter="addItem"
          />
          <button type="submit" :disabled="!draft.trim() || isSpinning">추가</button>
        </form>

        <ul v-if="items.length" class="chips">
          <li v-for="(item, i) in items" :key="`${item}-${i}`" :class="{ editing: editingIndex === i }">
            <!-- 고치는 중 -->
            <template v-if="editingIndex === i">
              <input
                ref="editInput"
                v-model="editingText"
                class="edit-field"
                maxlength="14"
                @keyup.enter="commitEdit"
                @keyup.esc="cancelEdit"
              />
              <button type="button" class="ok" aria-label="확인" @click="commitEdit">
                <CheckOutlined />
              </button>
              <button type="button" aria-label="취소" @click="cancelEdit">
                <CloseOutlined />
              </button>
            </template>

            <!-- 평소 -->
            <template v-else>
              <span class="dot" :style="{ background: toneOf(i) }" aria-hidden="true" />
              {{ item }}
              <button type="button" :disabled="isSpinning" aria-label="수정" @click="startEdit(i)">
                <EditFilled />
              </button>
              <button type="button" :disabled="isSpinning" aria-label="지우기" @click="removeItem(i)">
                ×
              </button>
            </template>
          </li>
        </ul>

        <p v-else class="empty">
          항목이 없습니다. 위에서 세트를 고르거나 직접 넣어 주세요.
        </p>

        <p v-if="items.length === 1" class="warn">항목이 하나면 돌릴 수 없어요. 하나 더 넣어 주세요.</p>
      </section>
    </div>
  </BaseDashboardCard>
</template>

<style scoped>
.roulette {
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

/* ── 원판 ── */
.stage {
  position: relative;
  justify-self: center;
  width: min(320px, 82vw);
  aspect-ratio: 1 / 1;
}

.wheel {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow:
    0 0 0 7px #fff,
    0 0 0 12px #2b3038,
    0 16px 36px rgb(40 46 56 / 0.26);
  /* 멈출 때 천천히 잦아들도록 — 뒤로 튕기지 않는 곡선 (SLOW_MS 와 같은 값) */
  transition: transform 3.4s cubic-bezier(0.12, 0.72, 0.2, 1);
}

/* 도는 중 — 끝을 정할 수 없으니 transition 이 아니라 animation 이다 */
.wheel.running {
  animation: turn 0.85s linear infinite;
  transition: none;
}

/*
 * 글자는 원판이 도는 만큼 반대로 돈다.
 * 같은 시간·같은 곡선이라 두 회전이 정확히 상쇄되고, 글자는 제자리에 선 채로
 * 색칸만 돌아가는 것처럼 보인다.
 */
.wheel.running .label b {
  animation: turn-back 0.85s linear infinite;
  transition: none;
}

@keyframes turn-back {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(-360deg);
  }
}

/* 멈추기 직전, 지금 각도에 그대로 붙이는 한 프레임 */
.wheel.snap,
.wheel.snap .label b {
  transition: none;
}

/*
 * rotate 속성이 아니라 transform 으로 돌린다.
 * 멈출 때 getComputedStyle(...).transform 으로 지금 각도를 읽어야 하는데,
 * rotate 속성으로 돌리면 그 값이 transform 에 잡히지 않는다.
 */
@keyframes turn {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 칸 사이 흰 줄 */
.spokes {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    rgb(255 255 255 / 0.92) 0deg 0.55deg,
    transparent 0.55deg var(--slice, 45deg)
  );
  pointer-events: none;
}

/* 유리알 느낌 — 원판과 같이 돌면 어지러워서 바깥에 따로 둔다 */
.gloss {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: 50%;
  background:
    radial-gradient(120% 80% at 30% 12%, rgb(255 255 255 / 0.45), transparent 52%),
    radial-gradient(90% 60% at 70% 96%, rgb(0 0 0 / 0.14), transparent 55%);
  pointer-events: none;
}

/* 칸 이름 — 원판 중심에서 바깥으로 뻗은 줄 위에 얹는다 */
.label {
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  width: 50%;
  height: 0;
  transform-origin: 0 0;
}

.label b {
  display: block;
  width: 78px;
  margin-left: 30%;
  color: #fff;
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  text-shadow: 0 1px 4px rgb(0 0 0 / 0.35);
  /* 원판과 똑같은 곡선·시간으로 반대 방향으로 돈다 → 글자는 그 자리에 서 있다 */
  transition: transform 3.4s cubic-bezier(0.12, 0.72, 0.2, 1);
  transform-origin: 50% 50%;
  overflow-wrap: anywhere;
}

.empty-wheel {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--faint);
  font-size: 13px;
}

/* 위쪽 바늘 — 원판을 가리키도록 아래를 향한다 */
.pin {
  position: absolute;
  top: -14px;
  left: 50%;
  z-index: 3;
  width: 0;
  height: 0;
  border-top: 22px solid var(--ink);
  border-right: 12px solid transparent;
  border-left: 12px solid transparent;
  transform: translateX(-50%);
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.25));
}

/* 가운데 버튼 */
.hub {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  transform: translate(-50%, -50%);
}

.hub button {
  width: 86px;
  height: 86px;
  border: 5px solid #fff;
  border-radius: 50%;
  background: var(--ink);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  box-shadow: 0 6px 18px rgb(30 34 42 / 0.3);
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.hub button:hover:not(:disabled) {
  transform: scale(1.06);
}

/* 도는 중에는 '눌러서 멈추는 버튼'임이 바로 보여야 한다 */
.hub button.stop {
  background: #e2574c;
  animation: throb 0.9s ease-in-out infinite alternate;
  box-shadow: 0 0 0 0 rgb(226 87 76 / 0.45);
}

@keyframes throb {
  to {
    box-shadow: 0 0 0 12px rgb(226 87 76 / 0);
  }
}

.guide {
  margin: -4px 0 0;
  color: var(--muted);
  font-size: 12.5px;
  text-align: center;
}

.hub button:disabled {
  cursor: default;
  opacity: 0.55;
}

/* ── 결과 ── */
.result {
  display: grid;
  gap: 8px;
  padding: 20px;
  border-radius: 20px;
  background: linear-gradient(
    120deg,
    color-mix(in srgb, var(--slate) 14%, transparent),
    color-mix(in srgb, var(--accent) 10%, transparent)
  );
  text-align: center;
}

.result-label {
  margin: 0;
  color: var(--slate);
  font-size: 12px;
  font-weight: 700;
}

.result-name {
  margin: 0;
  color: var(--ink);
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.result-acts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 6px;
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

.result-acts button:hover,
.result-acts .saved:hover {
  opacity: 0.88;
}

/* ── 세트 ── */
.section-label {
  margin: 0 0 8px;
  color: var(--faint);
  font-size: 12px;
  font-weight: 700;
}

.section-label b {
  color: var(--ink-soft);
}

.set-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.set-list button {
  padding: 8px 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
}

.set-list button:hover:not(:disabled) {
  border-color: var(--slate);
  color: var(--slate);
}

.set-list button.on {
  border-color: transparent;
  background: color-mix(in srgb, var(--slate) 16%, transparent);
  color: var(--slate-deep);
}

/* ── 편집 ── */
.editor {
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.editor-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.editor-acts {
  display: inline-flex;
  gap: 6px;
}

/* 섞기는 지우기와 달리 되돌릴 수 있는 동작이라 빨강을 쓰지 않는다 */
.clear.shuffle:hover:not(:disabled) {
  border-color: var(--slate);
  color: var(--slate-deep);
}

.clear {
  padding: 5px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
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

.add {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.add button {
  flex: none;
  padding: 0 20px;
  border: 0;
  border-radius: 10px;
  background: var(--ink);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
}

.add button:disabled {
  cursor: default;
  opacity: 0.4;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chips li {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  padding: 7px 8px 7px 12px;
  border-radius: 999px;
  background: var(--surface-sunken);
  color: var(--ink-soft);
  font-size: 12.5px;
  font-weight: 600;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.chips button {
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgb(0 0 0 / 0.07);
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  line-height: 1;
}

/* 수정은 아이콘만 — 동그라미까지 두 개 나란히 있으면 지저분하다 */
.chips button[aria-label='수정'] {
  width: auto;
  height: auto;
  background: none;
  color: var(--faint);
  font-size: 12px;
}

.chips button[aria-label='수정']:hover:not(:disabled) {
  color: var(--slate-deep);
}

/* 지우기(×)만 빨강, 취소는 색으로 겁주지 않는다 */
.chips button[aria-label='지우기']:hover:not(:disabled) {
  background: var(--danger-tint);
  color: var(--danger);
}

.chips button[aria-label='취소']:hover:not(:disabled) {
  background: color-mix(in srgb, var(--slate) 20%, transparent);
  color: var(--slate-deep);
}

.chips button.ok {
  background: var(--accent-tint);
  color: var(--accent);
}

.chips li.editing {
  padding-left: 8px;
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--slate);
}

.edit-field {
  width: 96px;
  border: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  outline: none;
}

.empty,
.warn {
  margin: 0;
  color: var(--muted);
  font-size: 12.5px;
}

.warn {
  margin-top: 8px;
  color: var(--signal);
}

@media (prefers-reduced-motion: reduce) {
  .wheel {
    transition-duration: 0.8s;
  }

  .hub button.stop {
    animation: none;
  }
}
</style>
