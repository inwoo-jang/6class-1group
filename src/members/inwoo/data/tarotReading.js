import OpenAI from 'openai'

/**
 * 오늘의 운세 — 3장 스프레드와 AI 해석
 * ------------------------------------------------------------------
 * 카드는 tarotCards.js 가, 해석은 이 파일이 맡는다.
 * 화면(TarotView)은 "무엇을 보여줄지"만 알고, 글이 어디서 오는지는 모른다.
 */

/** 세 자리의 뜻. 같은 카드도 놓인 자리에 따라 다르게 읽힌다. */
export const SPREAD = [
  { no: 1, label: '흐름', title: '오늘의 전반적 흐름' },
  { no: 2, label: '변수', title: '오늘 마주할 변수 또는 주의점' },
  { no: 3, label: '조언', title: '오늘의 조언 (행동 지침)' },
]

/** 바꿔 끼울 수 있게 밖으로 빼 둔다 */
export const MODEL = import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4o-mini'

/**
 * 해석의 규칙. 매 요청마다 똑같이 나가는 부분이라 system 으로 보낸다.
 */
const SYSTEM_PROMPT = `당신은 타로 전문가입니다. 차분하고 명료하며 은은하게 신비로운 말투를 사용합니다. 과장 없이 이해하기 쉬운 문장으로 말합니다.

[스프레드 정의]
1번 카드: 오늘의 전반적 흐름
2번 카드: 오늘 마주할 변수 또는 주의점
3번 카드: 오늘의 조언 (행동 지침)

[출력 형식]
오늘 운세의 전반적 흐름(2문장 이내)
오늘 마주할 변수 또는 주의점(2문장 이내)
오늘의 조언 및 구체적 행동 지침(2문장 이내)

[작성 규칙]
전체 400자 내외. 장황하게 늘리거나 같은말을 반복하지 않는다.

반드시 뽑힌 카드의 실제 상징(그림 요소, 원소, 수비학)에 근거해 해석한다. 카드와 무관한 일반론적 덕담을 쓰지 않는다.
누구에게나 해당되는 모호한 표현("당신은 때로 불안하지만 강한 사람입니다" 류)을 금지한다. 대신 '오늘'이라는 시간 단위에 한정된 서술을 한다.
사용자의 직업·연애 상태·나이를 임의로 가정하지 않는다. 상황을 특정하지 말고 상황 유형으로 표현한다.
건강·수명·질병·사망, 특정인의 마음, 금전 손익을 단정하지 않는다.
역방향은 '나쁨'이 아니라 '에너지의 방향 전환·내면화'로 해석한다.
어두운 카드(죽음, 탑, 악마 등)가 나와도 공포를 조장하지 않고 변화·해방의 관점으로 풀되, 억지로 좋게만 포장하지도 않는다.
마지막에 "타로는 결정을 대신하지 않습니다. 오늘의 방향을 잡는 참고로 봐주세요."를 한 줄 덧붙인다.
존댓말, 담백하고 따뜻한 톤. 이모지는 헤더 외 사용 금지.
return only Korean.`

/** 뽑힌 카드만 매번 달라지므로 user 쪽에 담는다 */
export const buildUserPrompt = (picks) =>
  `타로 리딩 주제: "오늘의 운세"

[뽑은 카드]
${picks
  .map(
    (pick, index) =>
      `${index + 1}번 카드: ${pick.card.name} (${pick.reversed ? '역방향' : '정방향'})`,
  )
  .join('\n')}`

/**
 * 키가 없을 때 보여 줄 기본 해설.
 *
 * AI 를 못 부른다고 화면이 비면 안 된다. 카드마다 갖고 있는 message 를
 * 자리 뜻에 맞춰 이어 붙여, 키 없이도 읽을 거리가 남게 한다.
 */
export const buildLocalReading = (picks) => {
  const line = (pick, index) => {
    const base = pick.reversed
      ? `${pick.card.message} 다만 오늘은 이 기운이 밖으로 뻗기보다 안으로 향합니다.`
      : pick.card.message
    return `${SPREAD[index].title} — ${pick.card.name}(${pick.reversed ? '역방향' : '정방향'})\n${base}`
  }

  return `${picks.map(line).join('\n\n')}

타로는 결정을 대신하지 않습니다. 오늘의 방향을 잡는 참고로 봐주세요.`
}

/**
 * AI 해석을 받아 온다.
 *
 * 글이 다 만들어질 때까지 기다리면 몇 초 동안 화면이 비므로,
 * 스트리밍으로 받아 도착하는 대로 흘려 보낸다(onText).
 *
 * @param {object} options
 * @param {string} options.apiKey  사용자가 넣은 키. 저장소에도 번들에도 없다.
 * @param {Array}  options.picks   [{ card, reversed }, ...] 세 장
 * @param {Function} options.onText 글자가 도착할 때마다 부른다
 * @returns {Promise<string>} 완성된 해석 전문
 */
export const streamReading = async ({ apiKey, picks, onText }) => {
  const client = new OpenAI({
    apiKey,
    /**
     * 브라우저에서 직접 부르겠다는 뜻이다. 이름 그대로 위험한 설정이라,
     * "내 키를 내 브라우저에서 쓴다"는 지금 구조에서만 쓸 수 있다.
     * 남의 키를 대신 들고 부르는 서비스라면 서버를 한 겹 둬야 한다.
     */
    dangerouslyAllowBrowser: true,
  })

  const stream = await client.chat.completions.create({
    model: MODEL,
    // 400자짜리 짧은 글이라 넉넉히 잡아도 남는다
    max_tokens: 700,
    // 매번 같은 카드에 같은 문장이 나오지 않도록 약간의 변주를 준다
    temperature: 0.8,
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(picks) },
    ],
  })

  let full = ''
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content
    if (!delta) continue
    full += delta
    if (onText) onText(delta)
  }

  if (!full.trim()) throw new Error('모델이 빈 응답을 보냈습니다. 다시 시도해 주세요.')
  return full
}

/** SDK 오류를 화면에 그대로 띄울 수 있는 문장으로 바꾼다 */
export const describeError = (error) => {
  const status = error?.status
  if (status === 401) return 'API 키가 올바르지 않습니다. 키를 다시 확인해 주세요.'
  if (status === 403) return '이 키에는 사용 권한이 없습니다.'
  if (status === 404) return `모델 '${MODEL}' 을(를) 찾을 수 없습니다. 모델 이름을 확인해 주세요.`
  if (status === 429) return '요청이 잠시 몰렸거나 사용 한도를 넘었습니다. 잠깐 뒤에 다시 시도해 주세요.'
  if (status >= 500) return '모델 서버가 응답하지 못했습니다. 잠시 뒤 다시 시도해 주세요.'
  return error?.message ?? '해석을 받아 오지 못했습니다.'
}
