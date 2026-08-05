<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { MEMBERS } from '../data/members'
import { hasWork } from '../members'
import SiteHeader from '../components/SiteHeader.vue'
import WorkPreview from '../components/WorkPreview.vue'

/**
 * 표지 — 여섯 사람의 결과물.
 * ------------------------------------------------------------------
 * 격자로 세우지 않는다. 같은 크기 판이 줄 맞춰 서면 표처럼 읽히고,
 * 회색 판이 회색 판 옆에 붙어 경계만 남는다.
 *
 * 대신 필름 한 롤처럼 옆으로 흘려보낸다.
 *   · 칸마다 폭과 높이가 다르다 — 줄이 맞지 않아야 훑게 된다
 *   · 위아래로도 조금씩 어긋나 있다
 *   · 가만히 둬도 아주 천천히 흐르고, 손을 대면 멈춘다
 *
 * 끊기지 않고 도는 것처럼 보이려고 목록을 두 번 그린다.
 * 절반을 지나면 스크롤 값에서 절반을 빼서 제자리로 돌린다.
 * 사람 눈에는 같은 자리라 이어져 보인다.
 */

/**
 * 칸의 생김새. 여섯 개가 서로 다르되 되풀이했을 때 규칙이 보이지 않을 만큼만 다르다.
 * 다들 데스크톱 화면을 만들 테니 전부 가로로 눕힌 비율이다.
 *
 * 크기는 거의 같게 둔다. 어떤 칸이 눈에 띄게 크면 그 사람 것이 더
 * 중요하다는 뜻이 되어 버린다. 여섯이 나란한 자리여야 한다.
 * 어긋남은 위아래로만 준다 — 높낮이는 서열로 읽히지 않는다.
 *
 * w = 폭(px), h = 높이(뷰포트 높이 대비 %), y = 위아래 어긋남(px)
 */
const SHAPES = [
  { w: 520, h: 37, y: 0 },
  { w: 480, h: 35, y: 54 },
  { w: 540, h: 38, y: 16 },
  { w: 490, h: 35, y: 64 },
  { w: 510, h: 37, y: 6 },
  { w: 470, h: 34, y: 46 },
]

const members = computed(() =>
  MEMBERS.map((member, index) => ({
    ...member,
    no: index + 1,
    ready: hasWork(member.slug),
    shape: SHAPES[index % SHAPES.length],
  })),
)

/** 앞뒤로 같은 목록을 한 벌 더 — 뒤쪽은 화면 낭독기와 키보드에서 숨긴다 */
const reel = computed(() => [
  ...members.value.map((m) => ({ ...m, key: `a-${m.slug}`, clone: false })),
  ...members.value.map((m) => ({ ...m, key: `b-${m.slug}`, clone: true })),
])

// ── 흐름 ──
const strip = ref(null)
let raf = null

/**
 * 창 끝에 바짝 붙였을 때의 최고 속도(한 프레임에 밀 거리).
 * 60fps 기준 초당 360px 남짓.
 * 아래 세제곱 때문에 구간 앞쪽은 훨씬 느리다 — 이 값은 맨 끝에서만 나온다.
 */
const RUSH = 6

/**
 * 화면을 세로로 三등분한다.
 *
 *   왼쪽 1/3   되감긴다. 왼쪽 끝에 가까울수록 빠르다
 *   가운데 1/3 멈춘다. 여기가 보고 · 누르는 자리다
 *   오른쪽 1/3 감긴다. 오른쪽 끝에 가까울수록 빠르다
 *
 * 가운데를 기준으로 -1~1 로 환산하면 가운데 1/3 은 |t| < 1/3 이다.
 */
const DEAD = 1 / 3

/** 띠 위에서 마우스가 가로로 어디쯤인지 (0 왼쪽 ~ 1 오른쪽). 없으면 null */
const at = ref(null)

/** 화살표로 밀고 있는 동안에는 아무 것도 흐르지 않는다 */
const locked = ref(false)

/** 붙잡고 끌고 있는 중인지 */
const dragging = ref(false)

/**
 * 지금 흘러야 할 방향과 속도.
 * 손을 대지 않으면 아무 일도 일어나지 않는다 — 가만히 있는 사진이다.
 * 움직임은 전부 사용자가 시킨 것이어야 한다.
 *
 *   마우스 없음   → 멈춤
 *   왼쪽에 대면   → 되감긴다
 *   가운데        → 멈춤. 보려던 칸이 도망가지 않는다
 *   오른쪽에 대면 → 감긴다. 끝에 붙일수록 빨라진다
 */
const speed = computed(() => {
  if (dragging.value || locked.value || at.value === null) return 0

  const t = (at.value - 0.5) * 2 // -1 ~ 1
  if (Math.abs(t) < DEAD) return 0

  // 멈춤 구간을 벗어난 만큼만 세제곱으로 붙는다 — 가장자리로 갈수록 확 빨라진다
  const strength = (Math.abs(t) - DEAD) / (1 - DEAD)
  return Math.sign(t) * strength ** 3 * RUSH
})

/**
 * 두 벌 중 어디에 있든 같은 그림이므로, 절반을 넘거나 앞으로 넘치면
 * 반대쪽 같은 자리로 옮긴다. 사람 눈에는 아무 일도 일어나지 않는다.
 * 이 덕분에 왼쪽 끝에서도 막히지 않고 계속 넘길 수 있다.
 */
const wrap = () => {
  const el = strip.value
  if (!el) return
  const half = el.scrollWidth / 2
  if (!half) return
  if (el.scrollLeft >= half) el.scrollLeft -= half
  else if (el.scrollLeft <= 0) el.scrollLeft += half
}

const tick = () => {
  const el = strip.value
  if (el && speed.value) {
    el.scrollLeft += speed.value
    wrap()
  }
  raf = requestAnimationFrame(tick)
}

/**
 * 마우스가 화면 가로로 어디쯤인지 기록한다. 이 값이 곧 흐름을 정한다.
 * 카드 위든 여백이든 가리지 않는다 — 양쪽 1/3 은 전부 흐르는 자리다.
 *
 * 띠가 아니라 창(innerWidth)을 기준으로 잰다.
 * 눈에 보이는 것은 화면이지 띠의 스크롤 폭이 아니다.
 */
const track = (event) => {
  at.value = event.clientX / window.innerWidth
}

// ── 손으로 넘기기 ──

/** 세로로 굴린 휠도 옆으로 흐르게 받는다 — 트랙패드 위아래도 그대로 통한다 */
const onWheel = (event) => {
  const el = strip.value
  if (!el) return
  const delta =
    Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX
  if (!delta) return
  el.scrollLeft += delta
  wrap()
}

/** 붙잡고 끌기 */
let startX = 0
let startScroll = 0
let moved = 0

/*
 * setPointerCapture 는 쓰지 않는다.
 * 포인터를 붙잡으면 뒤따르는 마우스·클릭 이벤트까지 이 띠로 넘어와서,
 * 안에 있는 링크가 클릭을 받지 못한다 — 카드가 하나도 안 눌리게 된다.
 * 대신 창 전체의 pointerup 을 들어 두면 띠 밖에서 손을 떼도 끌기가 풀린다.
 */
const onDown = (event) => {
  const el = strip.value
  if (!el || event.button !== 0) return
  dragging.value = true
  moved = 0
  startX = event.clientX
  startScroll = el.scrollLeft
}

const onMove = (event) => {
  // 끌고 있지 않을 때는 "지금 어디에 있는지"만 본다 — 그 위치가 흐름을 정한다
  if (!dragging.value) {
    track(event)
    return
  }
  const el = strip.value
  const dx = event.clientX - startX
  moved = Math.max(moved, Math.abs(dx))
  el.scrollLeft = startScroll - dx
  wrap()
}

const onUp = () => (dragging.value = false)

/** 띠 밖으로 나가면 다시 저절로 흐른다 */
const onLeave = () => {
  at.value = null
  dragging.value = false
}

/**
 * 끌고 나서 손을 뗄 때까지 눌린 것으로 쳐서 링크가 열리면 안 된다.
 * 6px 넘게 움직였으면 "넘기려던 것"으로 본다.
 */
const onClickCapture = (event) => {
  if (moved > 6) {
    event.preventDefault()
    event.stopPropagation()
  }
}

/** 화살표 · 방향키 — 한 칸씩 */
const STEP = 540

const nudge = (direction) => {
  const el = strip.value
  if (!el) return
  locked.value = true
  el.scrollBy({ left: direction * STEP, behavior: 'smooth' })
  // 부드럽게 미는 동안에는 저절로 흐르는 것을 멈춰 둔다
  setTimeout(() => {
    wrap()
    locked.value = false
  }, 500)
}

/*
 * 저절로 흐르는 것이 없으므로 이 고리는 늘 돌려 둔다.
 * 움직임은 전부 사용자가 시킨 것이라, 움직임 줄이기를 켠 사용자에게도 막지 않는다.
 */
onMounted(() => {
  raf = requestAnimationFrame(tick)
  // 띠 밖에서 손을 떼도 끌기가 풀리도록
  window.addEventListener('pointerup', onUp)
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  window.removeEventListener('pointerup', onUp)
})
</script>

<template>
  <div class="index">
    <SiteHeader />

    <!-- 필름 -->
    <section
      ref="strip"
      class="reel"
      :class="{ dragging }"
      aria-label="팀 결과물"
      tabindex="0"
      @wheel.prevent="onWheel"
      @pointermove="onMove"
      @pointerdown="onDown"
      @pointerup="onUp"
      @pointercancel="onUp"
      @pointerleave="onLeave"
      @click.capture="onClickCapture"
      @keydown.left.prevent="nudge(-1)"
      @keydown.right.prevent="nudge(1)"
    >
      <RouterLink
        v-for="item in reel"
        :key="item.key"
        class="frame-cell"
        :class="{ empty: !item.ready }"
        :to="`/m/${item.slug}`"
        :style="{
          '--w': `${item.shape.w}px`,
          '--h': `${item.shape.h}vh`,
          '--y': `${item.shape.y}px`,
        }"
        :tabindex="item.clone ? -1 : undefined"
        :aria-hidden="item.clone ? 'true' : undefined"
      >
        <WorkPreview
          :slug="item.slug"
          :name="item.name"
          :accent="item.accent"
          :ready="item.ready"
          free
        />

        <p class="label">
          <span class="no">{{ String(item.no).padStart(2, '0') }}</span>
          <span class="who">{{ item.name }}</span>
          <span class="what">{{ item.ready ? item.title || item.role : '준비 중' }}</span>
        </p>
      </RouterLink>
    </section>

    <footer class="foot">SKALA</footer>

    <!-- 인화지 결. 아주 옅게 깔아 화면이 매끈하게 비어 보이지 않게 한다 -->
    <div class="grain" aria-hidden="true" />
  </div>
</template>

<style scoped>
.index {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: var(--edge);
}

/* ── 필름 띠 ── */
.reel {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 26px;
  overflow-x: auto;
  overflow-y: hidden;
  /* 스크롤 막대는 보이지 않게 — 띠 자체가 안내다 */
  scrollbar-width: none;
  /* 양 끝을 흐리게 잘라 "어딘가에서 와서 어딘가로 간다"는 느낌을 준다 */
  mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
}

.reel::-webkit-scrollbar {
  display: none;
}

.reel:focus-visible {
  outline: none;
}

/* 여백은 "넘기는 곳", 카드는 "누르는 곳" — 커서로 구분해 준다 */
.reel {
  cursor: grab;
}

.frame-cell {
  cursor: pointer;
}

.reel.dragging,
.reel.dragging .frame-cell {
  cursor: grabbing;
}

.reel.dragging .frame-cell {
  /* 끄는 동안에는 칸이 따라 들썩이지 않게 */
  transition: none;
}

/* ── 한 칸 ── */
.frame-cell {
  flex: 0 0 auto;
  width: var(--w);
  /* 칸마다 다른 높이로 어긋나게 세운다 */
  transform: translateY(var(--y));
  transition: transform 0.7s var(--ease);
  animation: rise 0.9s var(--ease) both;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(calc(var(--y) + 20px));
  }
}

.frame-cell:hover,
.frame-cell:focus-visible {
  outline: none;
  transform: translateY(calc(var(--y) - 8px));
}

/*
 * 판(카드 배경)을 없앴다. 회색 위에 회색이 얹히면 경계선만 남는다.
 *
 * 그림자는 평소에도 떠 있다. 빛이 왼쪽 위에서 온다고 보고
 * 오른쪽 아래 한쪽으로만 떨군다 — 사방으로 퍼뜨리면 붕 뜬 것처럼 보인다.
 * 두 겹인 이유는, 가까운 그늘이 두께를 만들고 먼 그늘이 높이를 만들기 때문이다.
 */
.frame-cell :deep(.poster) {
  height: var(--h);
  aspect-ratio: auto;
  border-radius: 3px;
  box-shadow:
    2px 3px 5px -2px rgb(0 0 0 / 14%),
    6px 14px 26px -12px rgb(0 0 0 / 26%);
  transition: box-shadow 0.7s var(--ease);
}

/* 아직 안 낸 사람의 칸 — 빈 인화지처럼 조용히, 그림자도 한 겹 얕게 */
.frame-cell.empty :deep(.poster) {
  background: color-mix(in srgb, var(--fg) 4%, var(--page));
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--fg) 7%, transparent),
    2px 3px 5px -2px rgb(0 0 0 / 8%),
    5px 10px 18px -10px rgb(0 0 0 / 14%);
}

/*
 * 얹으면 8px 떠오른다(위의 transform). 그림자도 그만큼만 자란다.
 * 없던 그림자가 갑자기 생기는 게 아니라, 있던 그림자가 조금 길어지는 것이다.
 */
.frame-cell:hover :deep(.poster),
.frame-cell:focus-visible :deep(.poster) {
  box-shadow:
    3px 5px 8px -3px rgb(0 0 0 / 16%),
    10px 22px 38px -14px rgb(0 0 0 / 32%);
}

.frame-cell.empty:hover :deep(.poster) {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--fg) 7%, transparent),
    3px 5px 8px -3px rgb(0 0 0 / 10%),
    8px 18px 30px -12px rgb(0 0 0 / 18%);
}

/* 어두운 화면에서는 검은 그늘이 묻히므로 더 진하게 떨군다 */
@media (prefers-color-scheme: dark) {
  .frame-cell :deep(.poster) {
    box-shadow:
      2px 3px 6px -2px rgb(0 0 0 / 45%),
      7px 16px 30px -12px rgb(0 0 0 / 60%);
  }

  .frame-cell:hover :deep(.poster),
  .frame-cell:focus-visible :deep(.poster) {
    box-shadow:
      3px 6px 10px -3px rgb(0 0 0 / 50%),
      11px 24px 44px -14px rgb(0 0 0 / 70%);
  }
}

.frame-cell:hover :deep(.poster.live) {
  --zoom: 1.03;
}

/* ── 이름표 — 필름 아래 여백에 손으로 적어 둔 것처럼 ── */
.label {
  display: flex;
  gap: 9px;
  align-items: baseline;
  margin: 12px 2px 0;
  color: var(--fg-muted);
}

.no {
  font-family: var(--font-mono);
  font-size: 11px;
}

.who {
  color: var(--fg);
}

.what {
  overflow: hidden;
  font-family: var(--font-display);
  font-size: 17px;
  font-style: italic;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.frame-cell.empty .who {
  color: var(--fg-muted);
}

/* ── 바닥 ── */
.foot {
  padding: 10px 2px 2px;
  color: var(--fg-muted);
  letter-spacing: 0.14em;
}

/* ── 인화지 결 ──
   난수 무늬 한 장을 화면에 덮는다. 색은 건드리지 않고 밝기만 아주 조금 흔든다. */
.grain {
  position: fixed;
  z-index: 100;
  inset: 0;
  opacity: 0.4;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.32'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
  pointer-events: none;
}

@media (prefers-color-scheme: dark) {
  .grain {
    opacity: 0.22;
  }
}

/* 좁은 화면 — 폭을 화면에 맞추고 어긋남을 줄인다 */
@media (max-width: 700px) {
  .reel {
    gap: 18px;
  }

  .frame-cell {
    width: min(78vw, var(--w));
    --y: 0px;
  }

  .what {
    display: none;
  }
}
</style>
