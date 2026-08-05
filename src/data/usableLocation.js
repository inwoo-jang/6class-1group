import { readonly, ref } from 'vue'

/**
 * 지금 이 브라우저에서 현재 위치가 실제로 나오는가.
 * ------------------------------------------------------------------
 * 표지 카드가 쓴다. 첫 화면이 위치를 기다리는 사람은, 위치를 받을 수 있으면
 * 자기 첫 화면을 그대로 걸고 아니면 다른 화면으로 물러서야 하기 때문이다.
 *
 * "권한이 있다" 와 "좌표가 나온다" 는 다른 말이다.
 * 브라우저가 사이트에 허락을 내줬어도, 운영체제가 브라우저에게 위치를 안 주면
 * 좌표는 나오지 않는다 (macOS 의 위치 서비스 설정이 대표적이다).
 * 권한만 보고 판단하면 "위치를 확인하지 못했어요" 화면이 카드에 걸린다.
 * 그래서 권한을 확인한 뒤, 한 번 실제로 받아 본다.
 *
 * 두 가지를 지킨다.
 *
 *   · 먼저 permissions.query 로 알아만 본다 — 이 호출은 권한 창을 띄우지 않는다.
 *     허락받은 적이 없으면 거기서 멈춘다. 표지를 연 것만으로 축소된 그림
 *     하나가 권한 창을 띄우는 일은 없어야 한다.
 *
 *   · 한 번만 확인해서 나눠 쓴다. 카드는 열두 개(여섯 사람 + 이어 붙인 사본)라,
 *     각자 물어보면 같은 것을 열두 번 묻게 된다.
 */

const usable = ref(false)

let started = false
let permission = null

/** 좌표가 실제로 나오는지 받아 본다. 권한이 있을 때만 부르므로 창은 안 뜬다 */
const canReadPosition = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(false)

    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      // 카드 때문에 오래 기다릴 이유는 없다. 방금 받아 둔 값이 있으면 그대로 쓴다
      { timeout: 6000, maximumAge: 10 * 60 * 1000, enableHighAccuracy: false },
    )
  })

const settle = async () => {
  usable.value = permission?.state === 'granted' && (await canReadPosition())
}

const start = async () => {
  try {
    permission = await navigator.permissions?.query({ name: 'geolocation' })
    if (!permission) return

    await settle()

    // 다른 화면에서 방금 허용했을 수도 있다 — 그러면 카드도 따라 바뀐다
    permission.onchange = () => {
      void settle()
    }
  } catch {
    // 알 수 없으면 없는 것으로 본다
  }
}

export const usableLocation = () => {
  if (!started) {
    started = true
    void start()
  }
  return readonly(usable)
}
