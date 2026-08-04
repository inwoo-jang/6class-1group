/**
 * 오늘의 운세 — 3장 스프레드와 해석
 * ------------------------------------------------------------------
 * 카드는 tarotCards.js 가, 해석은 이 파일이 맡는다.
 * 화면(TarotView)은 "무엇을 보여줄지"만 알고, 글이 어떻게 만들어지는지는 모른다.
 */

/** 세 자리의 뜻. 같은 카드도 놓인 자리에 따라 다르게 읽힌다. */
export const SPREAD = [
  { no: 1, label: '흐름', title: '오늘의 전반적 흐름' },
  { no: 2, label: '변수', title: '오늘 마주할 변수 또는 주의점' },
  { no: 3, label: '조언', title: '오늘의 조언 (행동 지침)' },
]

/**
 * 뽑은 세 장을 하나의 글로 엮는다.
 *
 * 같은 카드도 놓인 자리에 따라 다르게 읽힌다. 카드가 가진 뜻(message)을
 * 자리의 물음(흐름 · 변수 · 조언)에 붙여 세 문단으로 만든다.
 */
export const buildReading = (picks) => {
  const line = (pick, index) => {
    const base = pick.reversed
      ? `${pick.card.message} 다만 오늘은 이 기운이 밖으로 뻗기보다 안으로 향합니다.`
      : pick.card.message
    return `${SPREAD[index].title} — ${pick.card.name}(${pick.reversed ? '역방향' : '정방향'})\n${base}`
  }

  return `${picks.map(line).join('\n\n')}

타로는 결정을 대신하지 않습니다. 오늘의 방향을 잡는 참고로 봐주세요.`
}
