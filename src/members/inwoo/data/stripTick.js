import { onBeforeUnmount, ref } from 'vue'

/**
 * 배너들이 함께 쓰는 박자
 * ------------------------------------------------------------------
 * 테스트 띠와 게임 띠가 각자 시계를 들고 있으면, 하나가 넘어가고 잠시 뒤에
 * 다른 하나가 넘어간다. 화면 아래쪽이 계속 들썩여 산만해 보인다.
 *
 * 그래서 박자는 하나만 둔다. 여기서 세는 숫자가 1 올라가면 두 띠가 같은
 * 순간에, 같은 방향(왼쪽)으로, 같은 속도로 넘어간다.
 *
 * 화면에 띠가 하나도 없으면 시계도 멈춘다 — 보이지 않는 것을 돌릴 이유가 없다.
 */
const SLIDE_MS = 3000

/** 몇 번째 박자인지. 각 띠는 이 값을 자기 장수로 나눠 쓴다 */
export const tick = ref(0)

/** 지금 멈춰 있는지 (마우스를 올린 띠가 하나라도 있으면 멈춘다) */
const holders = ref(0)

let timer = 0
let users = 0

const start = () => {
  if (timer) return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  timer = window.setInterval(() => {
    if (holders.value > 0) return
    if (document.visibilityState !== 'visible') return
    tick.value += 1
  }, SLIDE_MS)
}

const stop = () => {
  if (timer) window.clearInterval(timer)
  timer = 0
}

const onVisibility = () => {
  if (document.visibilityState === 'visible') start()
  else stop()
}

/**
 * 띠 하나가 이 박자를 쓰겠다고 알린다.
 * 돌려주는 함수들로 "지금은 멈춰 주세요"를 요청할 수 있다.
 */
export const useStripTick = () => {
  if (users === 0) {
    start()
    document.addEventListener('visibilitychange', onVisibility)
  }
  users += 1

  let holding = false

  const hold = () => {
    if (holding) return
    holding = true
    holders.value += 1
  }

  const release = () => {
    if (!holding) return
    holding = false
    holders.value = Math.max(0, holders.value - 1)
  }

  onBeforeUnmount(() => {
    release()
    users -= 1
    if (users === 0) {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  })

  return { tick, hold, release }
}
