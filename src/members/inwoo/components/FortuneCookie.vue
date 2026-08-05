<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import closedCookie from '../assets/cookie/closed.png'
import openCookie from '../assets/cookie/open.png'
import { anotherMessage, messageOfToday } from '../data/fortuneCookie'
import { downloadBlob, drawFortuneCard } from '../utils/resultCard'

/**
 * 포춘쿠키 — 눌러서 한 줄 받기
 *
 * 닫힌 쿠키를 누르면 화면 가운데로 모달이 떠오르고, 쿠키가 갈라지며
 * 그 사이의 종이에 오늘의 한 줄이 적힌다.
 *
 * 사진 두 장(닫힘 · 열림)을 그대로 쓰되, 열린 사진의 종이 위에는
 * 우리 종이를 덮는다. 원본 종이에 영어 문구가 인쇄되어 있기 때문이다.
 * 덮는 자리는 사진에서 종이가 차지하는 비율(30.5%~71% · 38.4%~67.9%)에
 * 맞춰 두었다 — 사진을 바꾸면 이 값도 같이 고쳐야 한다.
 */
const isOpen = ref(false)
// 첫 문구만 날짜로 정한다 — 열기 전 화면에서도 뭔가 정해져 있도록
const message = ref(messageOfToday())

/** 갈라지는 연출이 끝난 뒤에 종이를 보여 주려고 한 박자 늦춘다 */
const isCracked = ref(false)
let crackTimer = 0

/*
 * 열 때마다 다른 한 줄.
 *
 * 처음에는 날짜로 정해 하루 종일 같은 문구를 주었는데, 다시 눌러도 똑같아서
 * 두 번째부터는 열어 볼 맛이 없었다. 누를 때마다 새로 뽑되 방금 본 것만 피한다.
 */
const open = () => {
  message.value = anotherMessage(message.value)
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

/** 덤으로 한 줄 더 — 이건 무작위다 */
const again = () => {
  isCracked.value = false
  window.clearTimeout(crackTimer)
  crackTimer = window.setTimeout(() => {
    message.value = anotherMessage(message.value)
    isCracked.value = true
  }, 220)
}

/* 받은 한 줄을 그림 한 장으로 — 저장해 두거나 보내기 좋게 */
const isSaving = ref(false)

const saveImage = async () => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    // 열린 사진에는 영어 문구가 인쇄되어 있어 그대로 쓰면 두 문장이 겹친다.
    // 카드에서는 닫힌 쿠키를 놓고 우리 한 줄만 크게 적는다.
    const blob = await drawFortuneCard({ message: message.value, image: closedCookie })
    if (!blob) throw new Error('no blob')
    downloadBlob(blob, `오늘의포춘_${new Date().toLocaleDateString('ko-KR')}.png`)
    ElMessage.success({ message: '그림으로 저장했어요!', duration: 1600 })
  } catch {
    ElMessage.error('그림을 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.')
  } finally {
    isSaving.value = false
  }
}

/**
 * 모달이 열려 있는 동안에는 뒤 배경이 스크롤되지 않게 막고,
 * Esc 로 닫을 수 있게 한다. 둘 다 없으면 모달처럼 느껴지지 않는다.
 */
const onKey = (event) => {
  if (event.key === 'Escape') close()
}

watch(isOpen, (open) => {
  window.clearTimeout(crackTimer)
  if (open) {
    isCracked.value = false
    // 떠오르는 연출이 자리를 잡은 뒤에 쿠키를 가른다
    crackTimer = window.setTimeout(() => (isCracked.value = true), 320)
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
  } else {
    isCracked.value = false
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKey)
  }
})

onBeforeUnmount(() => {
  window.clearTimeout(crackTimer)
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="cookie">
    <!-- ── 닫힌 쿠키 ── -->
    <!--
      쿠키 자체가 버튼이다. 옆에 버튼을 따로 두면 "그림 + 버튼" 두 물건이 되고,
      정작 누르고 싶은 것(쿠키)은 장식처럼 보인다.
      대신 쿠키 위에 안내를 얹어 눌러야 하는 것임을 알린다.
    -->
    <button type="button" class="shell" @click="open">
      <img :src="closedCookie" alt="" />
      <span class="shine" aria-hidden="true" />
      <span class="label">🥠 오늘의 포춘 열기</span>
    </button>

    <!-- ── 모달 ── -->
    <Teleport to="body">
      <Transition name="pop">
        <div
          v-if="isOpen"
          class="cookie-veil"
          role="dialog"
          aria-modal="true"
          aria-label="오늘의 포춘쿠키"
          @click.self="close"
        >
          <div class="sheet" :class="{ cracked: isCracked }">
            <p class="eyebrow">TODAY'S FORTUNE COOKIE</p>

            <!-- 사진 위에 우리 종이를 덮는다 -->
            <div class="stage">
              <img :src="openCookie" alt="" aria-hidden="true" />
              <p class="slip">{{ message }}</p>
            </div>

            <p class="say">{{ message }}</p>

            <div class="acts">
              <button type="button" class="ghost" @click="again">하나 더</button>
              <button type="button" class="ghost" :disabled="isSaving" @click="saveImage">
                {{ isSaving ? '만드는 중…' : '그림으로 저장' }}
              </button>
              <button type="button" class="solid" @click="close">잘 받았어요</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ── 닫힌 쿠키 ── */
.shell {
  position: relative;
  display: block;
  width: 100%;
  margin: 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  /* 아래 안내가 겹쳐 앉을 자리를 비워 둔다 */
  padding-bottom: 26px;
  /* 살짝 기울여 두면 눌러 보고 싶은 물건처럼 보인다 */
  transform: rotate(-3deg);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 가만히 있어도 눈에 들어오도록 아주 느리게 떠 있는다 */
.shell img {
  animation: bob 4.5s ease-in-out infinite;
}

@keyframes bob {
  50% {
    transform: translateY(-6px);
  }
}

.shell:hover,
.shell:focus-visible {
  transform: rotate(0deg) scale(1.04);
}

.shell img {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: contain;
}

/*
 * 마우스를 올리면 표면을 스치는 빛.
 * -120% → 120% 는 화면 밖까지 크게 쓸어 과했고, -45% → 45% 는 쿠키를
 * 다 지나가기 전에 멈췄다. 쿠키 폭을 한 번 건너가는 정도로 맞췄다.
 */
/*
 * 쓸고 지나가는 빛줄기.
 *
 * 예전에는 투명도가 0 → 1 로만 올라가서, 줄기가 쿠키를 벗어나 배경 위에
 * 올라선 순간에도 가장 진했다. 그게 눈에 걸린다.
 * 그래서 두 겹으로 흐리게 한다.
 *   ① mask  — 줄기 자신의 좌우 끝을 먹인다 (자리로 흐리게)
 *   ② 애니메이션 — 양 끝에서 투명도를 0 으로 (시간으로 흐리게)
 * 결과적으로 쿠키 위를 지날 때만 밝고, 배경으로 넘어가기 전에 사라진다.
 */
.shine {
  position: absolute;
  inset: 8% 4% 18%;
  background: linear-gradient(112deg, transparent 40%, rgb(255 255 255 / 0.38) 50%, transparent 60%);
  transform: translateX(-70%);
  opacity: 0;
  mask-image: linear-gradient(90deg, transparent, #000 28%, #000 72%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 28%, #000 72%, transparent);
}

/*
 * 이름을 shine-sweep 으로 따로 둔다.
 * 아래 .label 이 쓰는 sweep 과 이름이 같으면, 같은 파일 안에서 나중에 적힌
 * 쪽이 이겨 이 규칙이 통째로 없어진 것처럼 동작한다 (투명도가 안 먹었다).
 */
.shell:hover .shine {
  animation: shine-sweep 0.75s ease-out;
}

@keyframes shine-sweep {
  0% {
    opacity: 0;
    transform: translateX(-70%);
  }

  30%,
  62% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateX(70%);
  }
}

/*
 * 쿠키 아래에 얹히는 안내 — 이게 곧 버튼 노릇을 한다.
 *
 * 단색 초록은 "확인" 버튼처럼 읽힌다. 여기서 원하는 건 누르기 전의 설렘이라,
 * 그레이 → 초록 → 하늘을 옅게 흘려 유리처럼 비치게 했다.
 * 배경을 반투명으로 두고 blur 를 걸어 뒤 배경이 은은히 배어 나오게 한다.
 */
.label {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  padding: 11px 12px;
  border: 1px solid rgb(255 255 255 / 0.55);
  border-radius: 999px;
  background:
    linear-gradient(
      110deg,
      rgb(122 132 138 / 0.42) 0%,
      rgb(74 132 108 / 0.42) 38%,
      rgb(96 148 176 / 0.44) 72%,
      rgb(150 166 176 / 0.40) 100%
    );
  backdrop-filter: blur(8px) saturate(1.25);
  -webkit-backdrop-filter: blur(8px) saturate(1.25);
  color: #fff;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
  text-shadow: 0 1px 6px rgb(20 30 34 / 0.45);
  box-shadow:
    0 8px 22px rgb(60 90 90 / 0.24),
    inset 0 1px 0 rgb(255 255 255 / 0.4);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

/* 빛 한 줄이 아주 천천히 지나간다 — 좋은 일이 생길 것 같은 기척 */
.label::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 38%,
    rgb(255 255 255 / 0.45) 50%,
    transparent 62%
  );
  transform: translateX(-130%);
  animation: sweep 4.2s ease-in-out infinite;
}

@keyframes sweep {
  0%,
  55% {
    transform: translateX(-130%);
  }
  85%,
  100% {
    transform: translateX(130%);
  }
}

.shell:hover .label,
.shell:focus-visible .label {
  transform: translateY(2px);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--accent) 38%, transparent);
}

/* ── 모달 ── */
.cookie-veil {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(24 20 14 / 0.55);
  backdrop-filter: blur(6px);
}

.sheet {
  display: grid;
  gap: 14px;
  width: min(460px, 100%);
  padding: 26px 24px 22px;
  border-radius: 26px;
  background: var(--surface);
  box-shadow: 0 30px 70px rgb(0 0 0 / 0.35);
  text-align: center;
}

.eyebrow {
  margin: 0;
  color: var(--signal);
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
}

/* ── 갈라지는 무대 ── */
.stage {
  position: relative;
  /* 사진 비율 그대로 (900 x 324) */
  aspect-ratio: 900 / 324;
  /* 원근을 주어야 쿠키가 앞으로 나오는 것처럼 보인다 */
  perspective: 700px;
  /* 종이 글씨가 이 폭을 기준으로 커지고 작아진다 (cqw) */
  container-type: inline-size;
}

.stage img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: rotateX(14deg) scale(0.92);
  transform-origin: 50% 80%;
  transition: transform 0.55s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.sheet.cracked .stage img {
  transform: rotateX(0deg) scale(1);
}

/*
 * 사진 속 종이를 덮는 우리 종이.
 * 원본에는 영어 문구가 인쇄되어 있어 그대로 두면 두 문장이 겹친다.
 */
.slip {
  position: absolute;
  /*
   * 사진 속 종이보다 좌우로 더 길게 뺀다.
   * 원본 종이(30.5%~71%)에 딱 맞추면 한글 한 문장이 들어갈 자리가 안 나온다.
   * 배경을 지운 그림이라 종이가 쿠키 밖으로 나가도 어색하지 않다.
   */
  top: 36%;
  right: 15%;
  bottom: 33%;
  left: 15%;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 0 4px;
  border-radius: 2px;
  background: #fdfdfb;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.14);
  color: #2a2a2a;
  /*
   * 종이 폭을 기준으로 글자 크기를 정한다(cqw).
   * px 로 박아 두면 모달이 좁아질 때 글씨만 커 보이고 종이 밖으로 넘친다.
   */
  font-size: clamp(10px, 2.9cqw, 15px);
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.02em;
  /* 갈라지기 전에는 접혀 있다 */
  transform: scaleX(0.2);
  opacity: 0;
  transition:
    transform 0.5s cubic-bezier(0.34, 1.3, 0.64, 1) 0.15s,
    opacity 0.3s ease 0.15s;
}

.sheet.cracked .slip {
  transform: scaleX(1);
  opacity: 1;
}

/* 사진 속 글씨는 작아서 읽기 어렵다. 아래에 크게 한 번 더 적는다 */
.say {
  margin: 0;
  padding: 0 6px;
  color: var(--ink);
  font-size: 17.5px;
  font-weight: 700;
  line-height: 1.75;
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.4s ease 0.35s,
    transform 0.4s ease 0.35s;
}

.sheet.cracked .say {
  opacity: 1;
  transform: none;
}

/* ── 버튼 ── */
.acts {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.acts button {
  padding: 11px 20px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
}

.acts .solid {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--on-accent);
}

.acts button:hover {
  opacity: 0.88;
}

/* ── 떠오르는 연출 ── */
.pop-enter-active .sheet {
  animation: rise 0.42s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.25s ease;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
}

@keyframes rise {
  from {
    transform: translateY(26px) scale(0.9);
  }
}

@media (prefers-reduced-motion: reduce) {
  .shell img,
  .label::after,
  .shell:hover .shine {
    animation: none;
  }

  .shell,
  .shine,
  .stage img,
  .slip,
  .say {
    transition: none;
  }

  .pop-enter-active .sheet {
    animation: none;
  }
}

/* 좁은 화면 — 라벨이 쿠키 칸을 넘어가면 히어로 밖으로 삐져나온다 */
@media (max-width: 720px) {
  .label {
    padding: 5px 8px;
    font-size: 10.5px;
    letter-spacing: -0.03em;
  }
}
</style>