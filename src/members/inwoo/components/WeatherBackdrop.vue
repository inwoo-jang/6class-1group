<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * 날씨 배경.
 * ------------------------------------------------------------------
 * 사진 한 장을 그대로 깔지 않는다. 사진은 "무대"만 맡고,
 * 그 위에 날씨에 맞는 움직이는 층을 겹쳐 장면을 만든다.
 *
 *   사진(느린 확대) + 효과층(비 · 눈 · 안개 · 구름 · 햇살 · 번개) + 어둡게 덮개
 *
 * 눈과 안개는 사진이 없어서 흐린 하늘 사진 위에 효과층만으로 만들어 냈다.
 */
const props = defineProps({
  /** 한글 날씨 문자열. 없으면 기본 배경 */
  status: { type: String, default: '' },
})

/**
 * 사진은 필요할 때 한 장씩 불러온다.
 * eager로 8장(약 2MB)을 한꺼번에 받으면 첫 화면이 눈에 띄게 느려진다.
 */
const loaders = Object.fromEntries(
  Object.entries(import.meta.glob('../../../assets/photos/*.jpg', { import: 'default' })).map(
    ([path, load]) => [path.split('/').pop().replace('.jpg', ''), load],
  ),
)

const cache = {}

const loadPhoto = async (name) => {
  if (!cache[name]) cache[name] = await loaders[name]?.()
  return cache[name]
}

/**
 * 날씨 → { photo: 배경 사진, effect: 겹칠 움직임 }
 * 위에서부터 검사하므로 좁은 말이 먼저 와야 한다.
 */
const SCENES = [
  ['뇌우', { photo: 'storm', effect: 'storm' }],
  ['번개', { photo: 'lightning', effect: 'lightning' }],
  ['폭설', { photo: 'overcast', effect: 'snow-heavy' }],
  ['눈보라', { photo: 'overcast', effect: 'snow-heavy' }],
  ['싸락눈', { photo: 'overcast', effect: 'snow' }],
  ['눈', { photo: 'overcast', effect: 'snow' }],
  ['한파', { photo: 'overcast', effect: 'snow' }],
  ['소나기', { photo: 'rain', effect: 'shower' }],
  ['호우', { photo: 'rain', effect: 'rain-heavy' }],
  ['이슬비', { photo: 'rain', effect: 'drizzle' }],
  ['어는 비', { photo: 'rain', effect: 'rain' }],
  ['비', { photo: 'rain', effect: 'rain' }],
  ['안개', { photo: 'overcast', effect: 'fog' }],
  ['미세먼지', { photo: 'overcast', effect: 'fog' }],
  ['흐림', { photo: 'overcast', effect: 'clouds-slow' }],
  ['구름조금', { photo: 'partly-cloudy', effect: 'clouds' }],
  ['구름많', { photo: 'cloudy', effect: 'clouds' }],
  ['구름', { photo: 'cloudy', effect: 'clouds' }],
  ['대체로 맑', { photo: 'mostly-sunny', effect: 'sun-clouds' }],
  ['맑', { photo: 'sunny', effect: 'sun' }],
]

const DEFAULT_SCENE = { photo: 'partly-cloudy', effect: 'clouds' }

const scene = computed(() => {
  if (!props.status) return DEFAULT_SCENE
  const found = SCENES.find(([word]) => props.status.includes(word))
  return found ? found[1] : DEFAULT_SCENE
})

/**
 * 사진을 겹 두 개로 번갈아 깔고 투명도만 바꿔 부드럽게 넘긴다.
 * <Transition>은 out-in 도중 상태가 엉키는 경우가 있어 직접 관리한다.
 */
const layers = ref(['', ''])
const front = ref(0)

// 늦게 도착한 사진이 나중에 고른 사진을 덮어쓰지 않도록 순번을 확인한다
let requestId = 0

watch(
  () => scene.value.photo,
  async (name) => {
    const id = ++requestId
    const url = await loadPhoto(name)
    if (!url || id !== requestId) return
    if (layers.value[front.value] === url) return
    const back = 1 - front.value
    layers.value[back] = url
    front.value = back
  },
  { immediate: true },
)

const rootEl = ref(null)
const fieldCount = ref(1)

let observer = null

onMounted(() => {
  const measure = () => {
    const height = rootEl.value?.offsetHeight ?? 0
    // 너무 많이 쌓으면 무거워지므로 6개까지만
    fieldCount.value = Math.min(4, Math.max(1, Math.ceil(height / window.innerHeight)))
  }
  observer = new ResizeObserver(measure)
  if (rootEl.value) observer.observe(rootEl.value)
  window.addEventListener('resize', measure)
  measure()
  onBeforeUnmount(() => window.removeEventListener('resize', measure))
})

onBeforeUnmount(() => observer?.disconnect())

/**
 * 빗방울을 낱개로 만든다.
 * 줄무늬를 통째로 밀면 "사선 무늬가 미끄러지는" 느낌만 나고 비처럼 보이지 않는다.
 *
 * 시작 시각(delay)은 반드시 "그 방울 자신의 주기"에 대한 비율로 흩어야 한다.
 * 공통 최대값으로 흩으면 주기가 짧은 방울들이 같은 구간에 몰려서
 * 위쪽에만 비가 오는 것처럼 보인다.
 *
 * 값은 황금비로 흩는다. Math.random을 쓰면 다시 그릴 때마다 튀어서 끊겨 보인다.
 */
const GOLDEN = 0.618033988749895

const makeDrops = (count, { minDur, maxDur, minLen, maxLen, minOp, maxOp, width }) =>
  Array.from({ length: count }, (_, i) => {
    const phase = (i * GOLDEN) % 1 // 낙하 위상 — 고르게 흩어진다
    const a = ((i * 37) % 100) / 100 // 가로 위치
    const b = ((i * 61) % 100) / 100 // 속도
    const c = ((i * 83) % 100) / 100 // 길이
    const dur = minDur + b * (maxDur - minDur)
    return {
      left: a * 106 - 3,
      dur,
      len: minLen + c * (maxLen - minLen),
      delay: -phase * dur,
      opacity: minOp + c * (maxOp - minOp),
      width: c > 0.7 ? width + 0.6 : width,
    }
  })

/* 네 가지 비는 굵기 · 길이 · 속도 · 개수를 확실히 갈라 놓아야 구분된다 */
const DRIZZLE = makeDrops(95, {
  minDur: 1.8, maxDur: 2.9, minLen: 8, maxLen: 22, minOp: 0.16, maxOp: 0.4, width: 1,
})
const RAIN = makeDrops(150, {
  minDur: 0.7, maxDur: 1.1, minLen: 28, maxLen: 70, minOp: 0.3, maxOp: 0.75, width: 1.3,
})
const SHOWER = makeDrops(200, {
  minDur: 0.5, maxDur: 0.78, minLen: 42, maxLen: 100, minOp: 0.34, maxOp: 0.85, width: 1.6,
})
const RAIN_HEAVY = makeDrops(280, {
  minDur: 0.28, maxDur: 0.46, minLen: 75, maxLen: 175, minOp: 0.4, maxOp: 0.95, width: 2.2,
})

/**
 * 눈송이. 비와 달리 좌우로 흔들리며 떨어져야 눈처럼 보인다.
 * 흔들림과 낙하는 transform 이 충돌하므로 겉/속 두 겹으로 나눈다.
 */
const makeFlakes = (count, { minDur, maxDur, minSize, maxSize, swayMin, swayMax }) =>
  Array.from({ length: count }, (_, i) => {
    const phase = (i * GOLDEN) % 1
    const a = ((i * 41) % 100) / 100
    const b = ((i * 67) % 100) / 100
    const c = ((i * 89) % 100) / 100
    const dur = minDur + b * (maxDur - minDur)
    return {
      left: a * 106 - 3,
      dur,
      size: minSize + c * (maxSize - minSize),
      delay: -phase * dur,
      opacity: 0.45 + c * 0.5,
      sway: swayMin + a * (swayMax - swayMin),
      swayDur: 1.8 + c * 2.6,
    }
  })

const SNOW = makeFlakes(120, {
  minDur: 4.5, maxDur: 8, minSize: 3, maxSize: 8, swayMin: 24, swayMax: 70,
})
const SNOW_HEAVY = makeFlakes(230, {
  minDur: 1.6, maxDur: 3.2, minSize: 4, maxSize: 13, swayMin: 60, swayMax: 150,
})

const flakes = computed(() => {
  const base = scene.value.effect === 'snow-heavy' ? SNOW_HEAVY : SNOW
  if (fieldCount.value >= 3) return base.filter((_, i) => i % 2 === 0)
  return base
})

const drops = computed(() => {
  const base =
    ({ drizzle: DRIZZLE, shower: SHOWER, 'rain-heavy': RAIN_HEAVY })[scene.value.effect] ?? RAIN
  // 층이 여러 개면 방울 수가 곱해지므로, 층이 많을 때는 층당 개수를 줄인다
  if (fieldCount.value >= 3) return base.filter((_, i) => i % 2 === 0)
  return base
})

/**
 * 목록이 길어지면 배경도 그만큼 길어진다.
 * 비는 화면 높이(vh)를 기준으로 떨어지므로, 그대로 두면 맨 위 한 화면에만 내린다.
 * 배경 높이를 재서 "화면 한 개 분량"의 비를 필요한 만큼 세로로 쌓는다.
 */
/** 어두운 사진 위에서는 글자가 잘 보이도록 덮개를 더 진하게 */
const isDark = computed(() =>
  ['storm', 'lightning', 'rain-heavy', 'rain', 'shower'].includes(scene.value.effect),
)
</script>

<template>
  <div
    ref="rootEl"
    class="backdrop"
    :class="[`fx-${scene.effect}`, { dark: isDark }]"
    aria-hidden="true"
  >
    <!-- 사진은 천천히 확대되며 살아 있는 느낌만 준다 -->
    <div
      v-for="(url, i) in layers"
      :key="i"
      class="photo"
      :class="{ on: i === front }"
      :style="url ? { backgroundImage: `url(${url})` } : null"
    />

    <!-- ── 효과층 ── -->

    <!-- 햇살: 은은한 빛무리 + 아주 느리게 도는 빛살 -->
    <template v-if="scene.effect === 'sun' || scene.effect === 'sun-clouds'">
      <div class="glow" />
      <div class="rays" />
    </template>

    <!-- 구름: 크고 부드러운 덩어리가 옆으로 흐른다 -->
    <template
      v-if="['clouds', 'clouds-slow', 'sun-clouds', 'fog', 'overcast'].includes(scene.effect)"
    >
      <div class="cloud-layer a" />
      <div class="cloud-layer b" />
    </template>

    <!-- 비: 빗방울을 낱개로 뿌리고, 바닥에는 물안개를 깐다 -->
    <template v-if="['rain', 'rain-heavy', 'drizzle', 'shower', 'storm'].includes(scene.effect)">
      <!-- 클래스 이름은 시간별 패널의 .rain 과 겹치지 않게 rain-field 로 둔다 -->
      <div
        v-for="k in fieldCount"
        :key="k"
        class="rain-field"
        :style="{ top: (k - 1) * 100 + 'vh' }"
      >
        <span
          v-for="(d, i) in drops"
          :key="i"
          class="drop"
          :style="{
            left: d.left + '%',
            height: d.len + 'px',
            width: d.width + 'px',
            opacity: d.opacity,
            animationDuration: d.dur + 's',
            animationDelay: d.delay + 's',
          }"
        />
      </div>
      <div v-if="scene.effect !== 'drizzle'" class="mist" />
    </template>

    <!-- 눈: 크기가 다른 눈송이가 좌우로 흔들리며 내린다 -->
    <template v-if="['snow', 'snow-heavy'].includes(scene.effect)">
      <div
        v-for="k in fieldCount"
        :key="k"
        class="snow-field"
        :style="{ top: (k - 1) * 100 + 'vh' }"
      >
        <span
          v-for="(f, i) in flakes"
          :key="i"
          class="flake-fall"
          :style="{
            left: f.left + '%',
            animationDuration: f.dur + 's',
            animationDelay: f.delay + 's',
          }"
        >
          <span
            class="flake"
            :style="{
              width: f.size + 'px',
              height: f.size + 'px',
              opacity: f.opacity,
              animationDuration: f.swayDur + 's',
              '--sway': f.sway + 'px',
            }"
          />
        </span>
      </div>
      <!-- 폭설은 앞을 가리는 눈보라까지 -->
      <div v-if="scene.effect === 'snow-heavy'" class="blizzard" />
    </template>

    <!-- 안개: 뿌연 띠가 좌우로 천천히 밀린다 -->
    <template v-if="scene.effect === 'fog'">
      <div class="fog-layer a" />
      <div class="fog-layer b" />
    </template>

    <!-- 번개: 하늘이 번쩍인 뒤 갈래가 잠깐 그어진다 -->
    <template v-if="['storm', 'lightning'].includes(scene.effect)">
      <div class="flash" />
      <svg
        v-for="n in 2"
        :key="n"
        class="bolt"
        :class="n === 1 ? 'a' : 'b'"
        viewBox="0 0 200 300"
        preserveAspectRatio="xMidYMin meet"
      >
        <!-- 바깥 후광 -->
        <path
          d="M96 0 78 96 112 88 66 210"
          fill="none"
          stroke="#bfe0ff"
          stroke-width="11"
          stroke-linejoin="round"
          stroke-linecap="round"
          opacity="0.55"
        />
        <!-- 몸통 -->
        <path d="M96 0 78 96 112 88 66 210 90 128 58 138Z" fill="#f2f9ff" />
        <!-- 하얗게 타는 심지 -->
        <path
          d="M96 0 78 96 112 88 66 210"
          fill="none"
          stroke="#fff"
          stroke-width="2.4"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <!-- 잔가지 -->
        <path
          d="M84 62 46 104M104 108 142 142M74 150 44 188"
          fill="none"
          stroke="#eaf5ff"
          stroke-width="2.2"
          stroke-linecap="round"
        />
      </svg>
    </template>

    <!-- 글자가 읽히도록 덮는 층 -->
    <div class="veil" />
  </div>
</template>

<style scoped>
.backdrop {
  position: absolute;
  z-index: 0;
  overflow: hidden;
  inset: 0;
  pointer-events: none;
}

/* ── 사진 ── */
.photo {
  position: absolute;
  background-position: center;
  background-size: cover;
  inset: 0;
  opacity: 0;
  transition: opacity 0.9s ease;
  animation: drift 40s ease-in-out infinite alternate;
}

.photo.on {
  opacity: 1;
}

/* 맑음 사진은 아래쪽에 옅은 구름이 깔려 있다. 파란 하늘 쪽을 보여 준다 */
.fx-sun .photo {
  background-position: 50% 22%;
}

@keyframes drift {
  from {
    transform: scale(1.06) translate(0, 0);
  }
  to {
    transform: scale(1.14) translate(-1.5%, -1%);
  }
}

/* ── 덮개 — 카드 글씨가 읽히도록 ── */
.veil {
  position: absolute;
  background: linear-gradient(
    180deg,
    rgb(255 255 255 / 22%),
    rgb(255 255 255 / 38%) 45%,
    rgb(255 255 255 / 52%)
  );
  inset: 0;
}

.backdrop.dark .veil {
  background: linear-gradient(
    180deg,
    rgb(255 255 255 / 34%),
    rgb(255 255 255 / 50%) 45%,
    rgb(255 255 255 / 62%)
  );
}

/* ── 햇살 ── */
.glow {
  position: absolute;
  top: -18%;
  right: -8%;
  width: 46%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(255 236 160 / 85%), rgb(255 236 160 / 0%) 68%);
  animation: pulse 6s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.12);
  }
}

.rays {
  position: absolute;
  top: -60%;
  right: -30%;
  width: 110%;
  aspect-ratio: 1;
  background: conic-gradient(
    from 0deg,
    rgb(255 244 200 / 0%) 0deg,
    rgb(255 244 200 / 30%) 10deg,
    rgb(255 244 200 / 0%) 20deg,
    rgb(255 244 200 / 0%) 45deg,
    rgb(255 244 200 / 24%) 55deg,
    rgb(255 244 200 / 0%) 65deg,
    rgb(255 244 200 / 0%) 360deg
  );
  animation: spin 90s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── 구름 ── */
.cloud-layer {
  position: absolute;
  width: 220%;
  inset: 0 auto 0 0;
  /* 배경이 길어져도 구름이 아래까지 이어지도록 세로로도 반복한다 */
  background-repeat: repeat;
  background-size: 100% 100vh;
}

.cloud-layer.a {
  background-image:
    radial-gradient(ellipse 220px 90px at 12% 26%, rgb(255 255 255 / 70%), transparent 70%),
    radial-gradient(ellipse 300px 110px at 45% 18%, rgb(255 255 255 / 55%), transparent 72%),
    radial-gradient(ellipse 190px 80px at 76% 32%, rgb(255 255 255 / 62%), transparent 70%);
  animation: slide-left 70s linear infinite;
}

.cloud-layer.b {
  background-image:
    radial-gradient(ellipse 260px 95px at 25% 55%, rgb(255 255 255 / 42%), transparent 72%),
    radial-gradient(ellipse 200px 78px at 62% 66%, rgb(255 255 255 / 36%), transparent 70%);
  animation: slide-left 110s linear infinite;
}

.fx-clouds-slow .cloud-layer.a {
  animation-duration: 130s;
}

.fx-clouds-slow .cloud-layer.b {
  animation-duration: 190s;
}

@keyframes slide-left {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

/* ── 비 ── */
.rain-field {
  /* 층 하나가 화면 한 개 높이. 이것을 세로로 쌓아 배경 끝까지 채운다.
     위로 조금 올려 두어야 층과 층 사이가 비지 않는다 */
  position: absolute;
  right: 0;
  left: 0;
  height: 100vh;
  margin-top: -30vh;
}

/* 빗방울 하나. 위는 투명하고 아래로 갈수록 진해야 떨어지는 물줄기로 보인다 */
.drop {
  position: absolute;
  top: -12%;
  border-radius: 999px;
  background: linear-gradient(
    to bottom,
    rgb(214 232 246 / 0%),
    rgb(214 232 246 / 75%) 45%,
    rgb(236 246 255 / 95%)
  );
  animation-name: drop-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}

/* 바람에 조금 기울어 떨어진다.
   낙하 거리는 화면보다 넉넉해야 바닥까지 빈틈이 없다 */
@keyframes drop-fall {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    transform: translate3d(-60px, 130vh, 0);
  }
}

/* 바닥에 튀어 오르는 물안개 */
.mist {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 26%;
  background: linear-gradient(to top, rgb(226 238 248 / 55%), transparent);
  animation: mist-breathe 4.5s ease-in-out infinite;
}

@keyframes mist-breathe {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.9;
  }
}

/* 이슬비 — 가늘고 흐릿하게 흩날린다 */
.fx-drizzle .drop {
  filter: blur(0.7px);
  animation-name: drop-drift;
}

@keyframes drop-drift {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    transform: translate3d(-105px, 130vh, 0);
  }
}

/* 소나기 — 굵게 쏟아지되 세기가 물결친다 */
.fx-shower .rain-field {
  animation: shower-burst 6s ease-in-out infinite;
}

/* 층이 여러 개여도 같은 박자로 물결치게 한다 */
.fx-shower .rain-field:nth-child(n) {
  animation-delay: 0s;
}

@keyframes shower-burst {
  0%,
  100% {
    opacity: 0.55;
  }
  35%,
  65% {
    opacity: 1;
  }
}

/* 호우 — 굵고 빠르고 많이, 더 기울어 쏟아진다 */
.fx-rain-heavy .drop {
  animation-name: drop-fall-hard;
}

@keyframes drop-fall-hard {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    transform: translate3d(-140px, 130vh, 0);
  }
}

.fx-rain-heavy .mist {
  height: 34%;
}

/* ── 눈 (사진이 없어 효과층으로 만든 장면) ── */
.snow-field {
  position: absolute;
  right: 0;
  left: 0;
  height: 100vh;
  margin-top: -30vh;
}

/* 겉: 아래로 떨어지는 일만 한다 */
.flake-fall {
  position: absolute;
  top: 0;
  animation-name: flake-drop;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}

@keyframes flake-drop {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    transform: translate3d(0, 130vh, 0);
  }
}

/* 속: 좌우로 흔들리는 일만 한다 */
.flake {
  display: block;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff, rgb(226 240 255 / 85%) 60%, rgb(200 224 248 / 55%));
  box-shadow: 0 0 6px rgb(255 255 255 / 70%);
  animation-name: flake-sway;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

@keyframes flake-sway {
  from {
    transform: translateX(calc(var(--sway) * -1));
  }
  to {
    transform: translateX(var(--sway));
  }
}

/* 폭설 — 바람에 크게 쓸리고, 앞이 뿌옇게 가린다 */
.fx-snow-heavy .flake-fall {
  animation-name: flake-drop-hard;
}

@keyframes flake-drop-hard {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    transform: translate3d(-260px, 130vh, 0);
  }
}

.fx-snow-heavy .flake {
  box-shadow: 0 0 10px rgb(255 255 255 / 90%);
}

.blizzard {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(105deg, transparent 0 12px, rgb(255 255 255 / 22%) 12px 14px, transparent 14px 30px),
    linear-gradient(102deg, transparent 0 26px, rgb(255 255 255 / 14%) 26px 29px, transparent 29px 60px);
  animation: blizzard-rush 0.9s linear infinite;
}

@keyframes blizzard-rush {
  to {
    transform: translate3d(-30px, 60px, 0);
  }
}

/* ── 안개 (사진이 없어 효과층으로 만든 장면) ── */
.fog-layer {
  position: absolute;
  width: 200%;
  inset: 0 auto 0 0;
  background-repeat: repeat;
  background-size: 100% 100vh;
  filter: blur(2px);
}

.fog-layer.a {
  background: linear-gradient(
    180deg,
    transparent 4%,
    rgb(238 242 245 / 82%) 30%,
    transparent 52%,
    rgb(238 242 245 / 70%) 78%,
    transparent 96%
  );
  animation: slide-left 55s linear infinite;
}

.fog-layer.b {
  background: linear-gradient(
    180deg,
    rgb(246 248 250 / 55%) 10%,
    transparent 40%,
    rgb(246 248 250 / 62%) 66%,
    transparent 92%
  );
  animation: slide-left 85s linear infinite reverse;
}

/* ── 번개 ── */
/* 하늘 전체가 번쩍 — 짧고 불규칙하게 두 번 치는 것이 실제와 가깝다 */
.flash {
  position: absolute;
  background: radial-gradient(
    ellipse 80% 60% at 40% 0%,
    rgb(255 255 255 / 95%),
    rgb(214 234 255 / 60%) 55%,
    transparent 80%
  );
  inset: 0;
  opacity: 0;
  animation: flash 9s linear infinite;
}

/* 갈래는 섬광과 같은 박자로 잠깐만, 대신 아주 밝게 */
.bolt {
  position: absolute;
  opacity: 0;
  filter: drop-shadow(0 0 6px rgb(255 255 255 / 95%))
    drop-shadow(0 0 22px rgb(150 205 255 / 90%)) drop-shadow(0 0 52px rgb(120 185 255 / 70%));
  animation: bolt 9s linear infinite;
  will-change: opacity;
}

.bolt.a {
  top: -3%;
  left: 22%;
  width: 27%;
  height: 76%;
}

/* 두 번째 갈래는 반대쪽에서 시차를 두고 친다 */
.bolt.b {
  top: 2%;
  right: 16%;
  left: auto;
  width: 19%;
  height: 58%;
  animation-delay: 4.9s;
  transform: scaleX(-1);
}

.fx-lightning .flash,
.fx-lightning .bolt {
  animation-duration: 6.5s;
}

.fx-lightning .bolt.b {
  animation-delay: 3.4s;
}

@keyframes flash {
  0%,
  100% {
    opacity: 0;
  }
  1.4% {
    opacity: 0.85;
  }
  2.2% {
    opacity: 0.12;
  }
  2.9% {
    opacity: 0.7;
  }
  4.6% {
    opacity: 0;
  }
  /* 두 번째 갈래(4.9s ≒ 54%)와 같은 순간에 하늘도 번쩍인다 */
  53.5% {
    opacity: 0;
  }
  54.4% {
    opacity: 0.7;
  }
  55.2% {
    opacity: 0.1;
  }
  56% {
    opacity: 0.5;
  }
  57.6% {
    opacity: 0;
  }
}

@keyframes bolt {
  0%,
  100% {
    opacity: 0;
  }
  0.9% {
    opacity: 1;
  }
  1.4% {
    opacity: 0.1;
  }
  1.8% {
    opacity: 1;
  }
  2.3% {
    opacity: 0.25;
  }
  2.8% {
    opacity: 0.95;
  }
  3.3% {
    opacity: 0.15;
  }
  3.7% {
    opacity: 0.7;
  }
  4.6% {
    opacity: 0;
  }
}

/* 움직임을 줄여 달라고 설정한 사용자에게는 정지 화면으로 */
@media (prefers-reduced-motion: reduce) {
  .backdrop * {
    animation: none !important;
  }
}
</style>
