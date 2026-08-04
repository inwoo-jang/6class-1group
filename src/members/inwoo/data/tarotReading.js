/**
 * 타로 — 세 갈래의 물음과 해석
 * ------------------------------------------------------------------
 * 카드는 tarotCards.js 가, 해석은 이 파일이 맡는다.
 * 화면(TarotView)은 "무엇을 보여줄지"만 알고, 글이 어떻게 만들어지는지는 모른다.
 *
 * 같은 78장을 쓰지만 무엇을 물었는지에 따라 읽는 각도가 달라진다.
 * 그래서 탭마다 세 자리를 따로 두고, 자리마다 카드를 푸는 방식을 달리한다.
 *
 * 카드가 들고 있는 것은 두 가지다.
 *   keyword  '새로운 시작' · '감정과 관계' 같은 한 마디
 *   message  '가벼운 발걸음이 예상 밖의 기회를 데려옵니다.' 같은 한 문장
 *
 * 이 둘은 어느 자리에 놓이든 똑같으므로, 그것만 옮겨 적으면 세 자리가 전부
 * 같은 말이 되어 버린다. 그래서 자리마다 앞뒤로 두 문장을 덧댄다.
 *
 *   frame  카드의 keyword 를 이 자리의 물음 쪽으로 돌려세우는 첫 문장
 *   lens   그래서 이 자리에서는 무슨 뜻인지 매듭짓는 끝 문장
 *
 * 덕분에 '바보' 한 장이 흐름 자리에서는 하루의 바탕으로, 변수 자리에서는
 * 조심할 지점으로, 조언 자리에서는 오늘 취할 태도로 각각 다르게 읽힌다.
 */

/** 탭 순서이자 서버에 저장되는 종류 이름 (mock-api 의 validateRecord 와 같아야 한다) */
export const READING_TYPES = ['오늘의 운세', '솔로연애운', '커플연애운']

export const READINGS = {
  '오늘의 운세': {
    eyebrow: 'DAILY TAROT · 3 CARD SPREAD',
    heading: '오늘의 운세',
    lead: '잠시 숨을 고르고, 오늘 하루를 떠올려 보세요.',
    tabHint: '하루의 흐름',

    spread: [
      {
        no: 1,
        label: '흐름',
        title: '오늘의 전반적 흐름',
        frame: (keyword) => `오늘 하루를 이끄는 기운은 «${keyword}» 입니다.`,
        lens: '오늘은 이 결이 하루의 바탕에 깔립니다.',
        reversed: '다만 그 기운이 아직 밖으로 뻗지 못하고 안에 머물러 있습니다.',
      },
      {
        no: 2,
        label: '변수',
        title: '오늘 마주할 변수 또는 주의점',
        frame: (keyword) => `걸음을 붙잡거나 방향을 트는 것은 «${keyword}» 쪽입니다.`,
        lens: '여기가 어긋나면 하루의 흐름도 함께 흔들립니다.',
        reversed: '지금은 겉으로 드러나지 않아 오히려 늦게 알아차리기 쉽습니다.',
      },
      {
        no: 3,
        label: '조언',
        title: '오늘의 조언 (행동 지침)',
        frame: (keyword) => `오늘 붙잡을 만한 태도는 «${keyword}» 입니다.`,
        lens: '오늘 하나만 고른다면 이것입니다.',
        reversed: '단, 밀어붙이기보다 한 박자 늦추는 쪽이 맞습니다.',
      },
    ],

    closing: '타로는 결정을 대신하지 않습니다. 오늘의 방향을 잡는 참고로 봐주세요.',
  },

  솔로연애운: {
    eyebrow: 'SOLO LOVE · 3 CARD SPREAD',
    heading: '솔로 연애운',
    lead: '혼자인 지금 무엇이 자라고 있는지 살펴봅니다.',
    tabHint: '나와 다가올 인연',

    spread: [
      {
        no: 1,
        label: '지금의 나',
        title: '지금 내 마음이 서 있는 자리',
        frame: (keyword) => `지금 당신의 마음자리에 놓인 것은 «${keyword}» 입니다.`,
        lens: '연애는 여기서부터 출발합니다.',
        reversed: '아직 스스로도 이 마음을 다 인정하지 못한 듯합니다.',
      },
      {
        no: 2,
        label: '인연',
        title: '다가오는 인연의 결',
        frame: (keyword) => `다가오는 사람이 지닌 결은 «${keyword}» 쪽입니다.`,
        lens: '그 사람에게서 이 인상을 가장 먼저 보게 됩니다.',
        reversed: '다만 첫인상과 속이 달라, 알아보는 데 시간이 걸립니다.',
      },
      {
        no: 3,
        label: '준비',
        title: '그 만남 전에 준비할 것',
        frame: (keyword) => `만나기 전에 챙겨 둘 것은 «${keyword}» 입니다.`,
        lens: '이것부터 갖추면 만남이 한결 수월해집니다.',
        reversed: '서두르면 오히려 어긋납니다. 천천히 익히는 편이 좋습니다.',
      },
    ],

    closing: '인연은 조급함보다 준비된 마음을 먼저 알아봅니다.',
  },

  커플연애운: {
    eyebrow: 'COUPLE LOVE · 3 CARD SPREAD',
    heading: '커플 연애운',
    lead: '두 사람 사이에 지금 무엇이 흐르는지 살펴봅니다.',
    tabHint: '우리 사이',

    spread: [
      {
        no: 1,
        label: '우리 사이',
        title: '지금 두 사람 사이의 온도',
        frame: (keyword) => `지금 두 사람 사이에 흐르는 것은 «${keyword}» 입니다.`,
        lens: '두 사람의 바탕에 이 결이 깔려 있습니다.',
        reversed: '한쪽은 느끼고 있는데 다른 쪽은 아직 모르는 상태입니다.',
      },
      {
        no: 2,
        label: '걸림돌',
        title: '사이를 어긋나게 하는 것',
        frame: (keyword) => `둘을 어긋나게 만드는 지점은 «${keyword}» 쪽입니다.`,
        lens: '그냥 두면 같은 다툼이 되풀이됩니다.',
        reversed: '말로 꺼내지 않아 가라앉아 있을 뿐, 사라진 것은 아닙니다.',
      },
      {
        no: 3,
        label: '함께할 일',
        title: '두 사람이 함께 해볼 것',
        frame: (keyword) => `함께 해볼 만한 것은 «${keyword}» 입니다.`,
        lens: '둘이 같이 하면 앞의 두 장이 풀립니다.',
        reversed: '한 사람이 끌고 가면 어렵습니다. 같이 시작해야 합니다.',
      },
    ],

    closing: '관계의 답은 카드가 아니라 두 사람의 대화에 있습니다.',
  },
}

/** 탭 이름 → 세 자리. 화면이 자리 개수·제목을 물어볼 때 쓴다 */
export const spreadOf = (type) => (READINGS[type] ?? READINGS['오늘의 운세']).spread

/**
 * 뽑은 세 장을 하나의 글로 엮는다.
 *
 * 한 문단은 네 조각으로 이루어진다.
 *   ① frame  이 자리의 물음으로 돌려세운 카드의 keyword
 *   ② message 카드가 원래 가진 한 문장
 *   ③ reversed 역방향일 때만 (자리마다 다르게 덧붙는다)
 *   ④ lens   이 자리에서는 결국 무슨 뜻인지
 */
export const buildReading = (type, picks) => {
  const config = READINGS[type] ?? READINGS['오늘의 운세']

  const paragraph = (pick, index) => {
    const slot = config.spread[index]
    const direction = pick.reversed ? '역방향' : '정방향'

    const body = [
      slot.frame(pick.card.keyword),
      pick.card.message,
      pick.reversed ? slot.reversed : '',
      slot.lens,
    ]
      .filter(Boolean)
      .join(' ')

    return `${slot.title} — ${pick.card.name}(${direction})\n${body}`
  }

  return `${picks.map(paragraph).join('\n\n')}\n\n${config.closing}`
}
