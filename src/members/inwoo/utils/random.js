/**
 * 치우침 없는 무작위
 * ------------------------------------------------------------------
 * Math.random() 은 빠르지만 두 가지가 아쉽다.
 *   ① 값이 예측 가능한 방식으로 만들어진다 (같은 씨앗이면 같은 흐름)
 *   ② Math.floor(Math.random() * n) 은 n 이 2의 거듭제곱이 아니면
 *      아주 조금이지만 앞쪽 값이 더 자주 나온다
 *
 * 내기처럼 "정말 공평해야 하는" 자리에서는 브라우저의 암호용 난수를 쓰고,
 * 나머지 구간을 버리는 방식(rejection sampling)으로 치우침까지 없앤다.
 */

/** 0 이상 max 미만의 정수 하나. 모든 값이 정확히 같은 확률이다 */
export const randomBelow = (max) => {
  if (!Number.isFinite(max) || max <= 1) return 0

  const source = globalThis.crypto
  if (!source?.getRandomValues) {
    // 아주 오래된 환경 — 그래도 멈추지는 않게 한다
    return Math.floor(Math.random() * max)
  }

  /*
   * 32비트 난수는 0 ~ 4294967295 다. 이 범위를 max 로 나누면 딱 떨어지지 않고
   * 자투리가 남는데, 그 자투리에 걸린 값을 그냥 % 하면 앞쪽 값이 한 번 더
   * 나올 기회를 얻는다. 그래서 자투리 구간이 나오면 버리고 다시 뽑는다.
   */
  const limit = Math.floor(0x100000000 / max) * max
  const buffer = new Uint32Array(1)

  do {
    source.getRandomValues(buffer)
  } while (buffer[0] >= limit)

  return buffer[0] % max
}

/** 배열을 섞어 새 배열로 돌려준다 (피셔-예이츠) */
export const shuffled = (list) => {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomBelow(i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
