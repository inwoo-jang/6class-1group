/**
 * 룰 기반 심리테스트
 * ------------------------------------------------------------------
 * 원본: 자료/rule_based_personality_tests_4sets.md
 * 그림: 자료/동물, 자료/좀비테스트 (웹용으로 640px·JPEG 로 줄여 assets 에 둠)
 *
 * 계산 방식은 단순하다. 선택지마다 결과 ID에 점수를 얹고, 7문항을 다 고른 뒤
 * 합계가 가장 높은 결과를 보여 준다. AI 도 서버도 필요 없다.
 *
 *   대표 결과 +3 · 보조 결과 +1 · 선택지 하나가 최대 두 결과에 점수를 준다
 *
 * 동점이면 tieBreaker 순서가 앞선 결과가 이긴다. 무작위로 고르지 않는 이유는,
 * 같은 답을 넣었는데 결과가 달라지면 테스트를 믿지 못하게 되기 때문이다.
 */

/**
 * 결과 그림 — 파일 이름이 곧 결과 ID 다.
 *
 * import.meta.glob 은 Vite 가 빌드할 때 폴더를 훑어 import 로 펼쳐 준다.
 * eager: true 라 값(해시 붙은 최종 주소)이 바로 들어온다.
 * 여기서 이름만 떼어 두면 아래 결과들이 image: art.animal.dog 처럼 꺼내 쓴다.
 */
const collect = (files) =>
  Object.fromEntries(
    Object.entries(files).map(([path, url]) => [path.split('/').pop().replace('.jpg', ''), url]),
  )

/**
 * 칩에 붙는 작은 얼굴.
 *
 * 이모지는 기기마다 그림이 달라 목록에 넷을 늘어놓으면 결이 어긋난다.
 * 각 테스트의 사진·아이콘에서 얼굴만 동그랗게 잘라 두고 그걸 쓴다.
 */
const chips = collect(
  import.meta.glob('../assets/tests/chips/*.jpg', { eager: true, import: 'default' }),
)

const art = {
  animal: collect(
    import.meta.glob('../assets/tests/animal/*.jpg', { eager: true, import: 'default' }),
  ),
  zombie: collect(
    import.meta.glob('../assets/tests/zombie/*.jpg', { eager: true, import: 'default' }),
  ),
  message: collect(
    import.meta.glob('../assets/tests/message/*.jpg', { eager: true, import: 'default' }),
  ),
  story: collect(
    import.meta.glob('../assets/tests/story/*.jpg', { eager: true, import: 'default' }),
  ),
}

/* ================================================================
   1) 좀비가 나타나면 나의 생존 역할
   ================================================================ */
const zombie = {
  id: 'zombie',
  emoji: '🧟',
  title: '좀비가 나타나면 나는 무슨 역할일까?',
  short: '좀비 사태 생존 역할',
  description: '위기 상황에서 드러나는 생존 본능을 확인합니다. 단, 살아남는다는 보장은 없습니다.',
  accent: '#7d3b3b',
  hasResultArt: true,

  questions: [
    {
      id: 'q1',
      text: '재난 문자가 울리고 밖에서 비명이 들린다.',
      options: [
        { text: '가족과 친구에게 연락하고 집결 장소를 정한다.', scores: { survival_leader: 3, strategist: 1 } },
        { text: '문부터 잠그고 생존 물품 목록을 만든다.', scores: { supplier: 3, strategist: 1 } },
        { text: '공구함과 가구로 방어 장치를 만든다.', scores: { crafter: 3, stealth: 1 } },
        { text: '창밖을 보러 갔다가 가장 먼저 눈이 마주친다.', scores: { first_zombie: 3, hidden_bite: 1 } },
      ],
    },
    {
      id: 'q2',
      text: '마트에서 물건 하나만 챙길 수 있다.',
      options: [
        { text: '생수와 통조림이 든 생존 가방', scores: { supplier: 3, strategist: 1 } },
        { text: '튼튼한 공구 세트', scores: { crafter: 3, survival_leader: 1 } },
        { text: '휴대하기 좋은 무기와 지도', scores: { stealth: 3, strategist: 1 } },
        { text: '평소 먹고 싶었던 가장 비싼 디저트', scores: { moodmaker: 3, first_zombie: 1 } },
      ],
    },
    {
      id: 'q3',
      text: '낯선 생존자들이 합류하고 싶다고 한다.',
      options: [
        { text: '역할과 규칙을 정한 뒤 받아준다.', scores: { survival_leader: 3, strategist: 1 } },
        { text: '감염 여부와 소지품부터 검사한다.', scores: { strategist: 3, supplier: 1 } },
        { text: '절대 문을 열지 않고 혼자 이동한다.', scores: { stealth: 3, hidden_bite: 1 } },
        { text: '일단 받아주고 자기소개 게임부터 한다.', scores: { moodmaker: 3, first_zombie: 1 } },
      ],
    },
    {
      id: 'q4',
      text: '동료가 팔을 숨기며 “나 안 물렸어”라고 말한다.',
      options: [
        { text: '즉시 확인하고 격리한다.', scores: { strategist: 3, survival_leader: 1 } },
        { text: '믿어주고 상처 치료부터 한다.', scores: { survival_leader: 3, moodmaker: 1 } },
        { text: '아무 말 없이 거리를 벌린다.', scores: { stealth: 3, supplier: 1 } },
        { text: '사실 나도 아까 물렸기 때문에 모른 척한다.', scores: { hidden_bite: 3, first_zombie: 1 } },
      ],
    },
    {
      id: 'q5',
      text: '좀비 무리가 건물로 몰려온다.',
      options: [
        { text: '사람들을 나눠 출구와 방어선을 지시한다.', scores: { survival_leader: 3, strategist: 1 } },
        { text: '미리 만들어둔 함정과 장치를 가동한다.', scores: { crafter: 3, supplier: 1 } },
        { text: '환풍구나 비상계단으로 조용히 빠져나간다.', scores: { stealth: 3, strategist: 1 } },
        { text: '“다들 나만 믿어!”라고 외치고 문을 잘못 연다.', scores: { first_zombie: 3, moodmaker: 1 } },
      ],
    },
    {
      id: 'q6',
      text: '생존 생활에서 내가 가장 잘할 일은?',
      options: [
        { text: '식량, 물, 약품 재고 관리', scores: { supplier: 3, strategist: 1 } },
        { text: '무기와 방어 시설 제작', scores: { crafter: 3, survival_leader: 1 } },
        { text: '정찰과 은밀한 이동', scores: { stealth: 3, hidden_bite: 1 } },
        { text: '절망한 사람들에게 농담하기', scores: { moodmaker: 3, first_zombie: 1 } },
      ],
    },
    {
      id: 'q7',
      text: '결국 좀비에게 물린 것 같다.',
      options: [
        { text: '즉시 알리고 팀을 안전한 곳으로 보낸다.', scores: { survival_leader: 3, strategist: 1 } },
        { text: '남은 시간 동안 방어 장치를 완성한다.', scores: { crafter: 3, supplier: 1 } },
        { text: '아무도 모르게 멀리 떠난다.', scores: { stealth: 3, moodmaker: 1 } },
        { text: '긴 소매를 입고 “모기 물린 거야”라고 우긴다.', scores: { hidden_bite: 3, first_zombie: 1 } },
      ],
    },
  ],

  tieBreaker: [
    'survival_leader',
    'strategist',
    'supplier',
    'crafter',
    'stealth',
    'moodmaker',
    'hidden_bite',
    'first_zombie',
  ],

  results: {
    survival_leader: {
      emoji: '🧭',
      title: '생존팀 리더',
      subtitle: '모두가 도망칠 때 집결 장소부터 정하는 사람',
      description:
        '위기가 발생하면 당황하기보다 사람을 모으고 역할을 정합니다. 나 혼자 살아남는 것보다 팀 전체가 움직이는 방법을 고민하며, 어려운 결정도 책임지고 내립니다.',
      facts: [{ label: '생존 확률', value: '86%' }],
      strengths: ['리더십', '책임감', '판단력'],
      cautions: ['모두를 구하려다 위험해짐'],
      match: { who: '현실 생존왕', why: '큰 그림을 그리는 나와, 당장 손을 쓰는 쪽이 만나면 계획이 실제로 굴러갑니다.' },
      shareText: '좀비 사태에서도 단톡방 공지부터 올릴 리더형.',
    },
    strategist: {
      emoji: '🧠',
      title: '좀비보다 팀원 때문에 먼저 지치는 전략가',
      subtitle: '계획은 완벽한데 아무도 말을 안 들음',
      description:
        '출입구, 재고, 이동 경로, 감염 가능성까지 모두 계산합니다. 문제는 당신의 전략이 틀리는 게 아니라 팀원들이 계획대로 움직이지 않는다는 것입니다.',
      facts: [{ label: '생존 확률', value: '82%' }],
      strengths: ['분석력', '위험 감지', '계획성'],
      cautions: ['답답한 팀원을 견디지 못함'],
      match: { who: '생존팀 리더', why: '방향을 정해 주는 사람이 옆에 있으면, 내가 잘하는 일에만 집중할 수 있습니다.' },
      shareText: '좀비보다 ‘일단 가보자’는 팀원이 더 무섭다.',
    },
    supplier: {
      emoji: '🥫',
      title: '식량부터 챙기는 현실 생존왕',
      subtitle: '영웅보다 오래 살아남는 재고 관리자',
      description:
        '멋진 무기보다 물, 약, 통조림을 먼저 챙깁니다. 감정적인 판단을 줄이고 필요한 것을 꾸준히 관리하기 때문에 시간이 지날수록 존재감이 커집니다.',
      facts: [{ label: '생존 확률', value: '91%' }],
      strengths: ['현실 감각', '준비성', '자원 관리'],
      cautions: ['식량을 숨겨뒀다는 의심을 받을 수 있음'],
      match: { who: '제작자', why: '말로 정한 것을 물건으로 만들어 주는 쪽이라, 내 판단이 눈에 보이는 결과가 됩니다.' },
      shareText: '세상을 구하진 못해도 통조림 유통기한은 지킨다.',
    },
    crafter: {
      emoji: '🔨',
      title: '무기 만들다가 집까지 짓는 제작자',
      subtitle: '의자 하나로 요새를 만드는 인간',
      description:
        '주변의 물건을 도구와 방어 장치로 바꾸는 능력이 있습니다. 처음에는 창문만 막으려다가 어느새 발전기와 빗물 저장 시설까지 완성합니다.',
      facts: [{ label: '생존 확률', value: '89%' }],
      strengths: ['창의성', '손재주', '문제 해결력'],
      cautions: ['완성 직전까지 현장을 떠나지 않음'],
      match: { who: '현실 생존왕', why: '큰 그림을 그리는 나와, 당장 손을 쓰는 쪽이 만나면 계획이 실제로 굴러갑니다.' },
      shareText: '좀비보다 먼저 집 리모델링을 끝내는 제작자형.',
    },
    stealth: {
      emoji: '🥷',
      title: '혼자 끝까지 살아남는 은신 전문가',
      subtitle: '엔딩 장면에서 갑자기 다시 등장하는 사람',
      description:
        '소리를 줄이고 위험한 무리를 피하며 최소한의 움직임으로 생존합니다. 사람들과 함께 있을 때보다 혼자 있을 때 판단력이 좋아지며, 누구도 모르는 통로를 찾아냅니다.',
      facts: [{ label: '생존 확률', value: '94%' }],
      strengths: ['관찰력', '민첩함', '독립성'],
      cautions: ['팀원들이 이미 당신을 실종 처리함'],
      match: { who: '전략가', why: '앞을 내다보는 쪽과 몸이 먼저 나가는 쪽이 짝이 되면, 무모함이 준비로 바뀝니다.' },
      shareText: '시즌 내내 안 보이다 마지막 회에 멀쩡히 등장.',
    },
    moodmaker: {
      emoji: '🎤',
      title: '멸망 중에도 드립치는 예능 담당',
      subtitle: '식량은 없지만 분위기는 살림',
      description:
        '절망적인 상황에서도 농담으로 사람들의 긴장을 풀어줍니다. 전투 능력은 불확실하지만 팀의 정신 건강과 사기를 책임지는 중요한 존재입니다.',
      facts: [{ label: '생존 확률', value: '63%' }],
      strengths: ['긍정성', '친화력', '정신력'],
      cautions: ['웃기려고 위험한 행동을 할 수 있음'],
      match: { who: '생존팀 리더', why: '방향을 정해 주는 사람이 옆에 있으면, 내가 잘하는 일에만 집중할 수 있습니다.' },
      shareText: '좀비한테 쫓기면서도 상황극하는 예능 담당.',
    },
    hidden_bite: {
      emoji: '🩹',
      title: '물린 사실을 끝까지 숨기는 민폐 캐릭터',
      subtitle: '“이거 그냥 긁힌 거야”를 열 번 말하는 사람',
      description:
        '당황하면 현실을 인정하기보다 문제가 사라지기를 기다립니다. 사람들에게 버림받고 싶지 않은 마음은 이해되지만, 당신의 긴 소매가 팀 전체를 위험하게 만들 수 있습니다.',
      facts: [{ label: '생존 확률', value: '21%' }],
      strengths: ['연기력', '순간 대처', '강한 생존 욕구'],
      cautions: ['바로 그 상처'],
      match: { who: '격리를 잘하는 전략가', why: '거리를 둘 줄 아는 사람이라, 조용히 움직이는 내 방식과 부딪히지 않습니다.' },
      shareText: '나 안 물렸어. 진짜야. 근데 왜 이렇게 덥지?',
    },
    first_zombie: {
      emoji: '🧟',
      title: '매도 먼저 맞자, 제일 먼저 좀비 되는 사람',
      subtitle: '재난 발생 3분 만에 장르를 바꾸는 사람',
      description:
        '호기심과 과감함이 넘쳐 비명이 들리면 문부터 열고, 수상한 사람이 보이면 가까이 다가갑니다. 생존자로 오래 등장하지는 못하지만 이야기의 시작을 알리는 매우 중요한 역할을 맡습니다.',
      facts: [
        { label: '생존 확률', value: '2%' },
        { label: '좀비 활동 확률', value: '98%' },
      ],
      strengths: ['빠른 결단', '엄청난 행동력', '초반 임팩트'],
      cautions: ['상황 판단보다 몸이 먼저 움직임'],
      match: { who: '없음. 이미 물었습니다.', why: '아쉽지만 여기서 끝입니다. 다음 생에 다시 만나요.' },
      shareText: '매도 먼저 맞자! 시작 3분 만에 좀비가 됐습니다.',
    },
  },
}

/* ================================================================
   2) 영혼 동물 테스트
   ------------------------------------------------------------------
   원본 기획서는 8종(부엉이·늑대·여우·곰·돌고래·다람쥐·사자·백조)이었는데,
   가장 익숙한 강아지·고양이가 빠져 있어 네 종을 더해 12종으로 넓혔다.
   추가: 강아지 · 고양이 · 토끼 · 펭귄

   결과가 12종이 되면 7문항으로는 새 동물이 이길 길이 사실상 막힌다.
   (7문항 × 대표 +3 이면 한 동물이 얻을 수 있는 자리가 너무 적다)
   그래서 문항을 10개로 늘리고, 12종이 각각 대표점(+3)을 3~4번씩 가져가도록
   배분을 다시 짰다. 실제로 모든 동물이 1등이 될 수 있는지는
   4^10 = 1,048,576 가지 답안을 전부 돌려 확인했다.
   ================================================================ */
const animal = {
  id: 'animal',
  emoji: '🦉',
  title: '내 안에 잠든 영혼 동물은?',
  short: '영혼 동물 테스트',
  description:
    '관계, 선택, 스트레스와 도전에 반응하는 방식을 통해 나와 가장 닮은 동물을 찾습니다.',
  accent: '#2f5d50',
  hasResultArt: true,

  questions: [
    {
      id: 'q1',
      text: '갑자기 하루가 완전히 비었다.',
      options: [
        { text: '혼자 조용한 곳에서 생각을 정리한다.', scores: { owl: 3, swan: 1 } },
        { text: '가까운 사람에게 먼저 연락한다.', scores: { dog: 3, dolphin: 1 } },
        { text: '가보지 않은 장소로 떠난다.', scores: { fox: 3, lion: 1 } },
        { text: '미뤄둔 일과 취미를 차근차근 해낸다.', scores: { squirrel: 3, penguin: 1 } },
      ],
    },
    {
      id: 'q2',
      text: '새로운 모임에 참석했다.',
      options: [
        { text: '먼저 말을 걸고 분위기를 만든다.', scores: { dolphin: 3, lion: 1 } },
        { text: '적당히 거리를 두고 지켜본다.', scores: { cat: 3, rabbit: 1 } },
        { text: '한두 명과 깊게 대화한다.', scores: { swan: 3, bear: 1 } },
        { text: '내가 맡을 역할과 필요한 일을 찾는다.', scores: { wolf: 3, squirrel: 1 } },
      ],
    },
    {
      id: 'q3',
      text: '예상치 못한 문제가 생겼다.',
      options: [
        { text: '정보를 모으고 원인부터 분석한다.', scores: { owl: 3, squirrel: 1 } },
        { text: '새로운 방법을 빠르게 시도한다.', scores: { fox: 3, lion: 1 } },
        { text: '사람들과 역할을 나눠 함께 버틴다.', scores: { penguin: 3, wolf: 1 } },
        { text: '서두르지 않고 견딜 방법을 찾는다.', scores: { bear: 3, rabbit: 1 } },
      ],
    },
    {
      id: 'q4',
      text: '친구가 힘든 일을 털어놓았다.',
      options: [
        { text: '감정을 충분히 들어주고 공감한다.', scores: { dolphin: 3, swan: 1 } },
        { text: '실질적인 해결 방법을 함께 찾는다.', scores: { squirrel: 3, wolf: 1 } },
        { text: '말없이 옆에 있어준다.', scores: { bear: 3, cat: 1 } },
        { text: '곁에서 계속 기운을 북돋아 준다.', scores: { dog: 3, penguin: 1 } },
      ],
    },
    {
      id: 'q5',
      text: '내가 가장 중요하게 생각하는 가치는?',
      options: [
        { text: '지혜와 이해', scores: { owl: 3, swan: 1 } },
        { text: '신뢰와 책임', scores: { wolf: 3, bear: 1 } },
        { text: '자유와 나만의 속도', scores: { cat: 3, fox: 1 } },
        { text: '관계와 따뜻함', scores: { dog: 3, dolphin: 1 } },
      ],
    },
    {
      id: 'q6',
      text: '스트레스를 받을 때 나는?',
      options: [
        { text: '음악이나 글로 감정을 흘려보낸다.', scores: { swan: 3, owl: 1 } },
        { text: '해야 할 일을 목록으로 만든다.', scores: { squirrel: 3, rabbit: 1 } },
        { text: '믿는 사람을 만나 이야기를 나눈다.', scores: { dolphin: 3, dog: 1 } },
        { text: '운동이나 새로운 활동으로 에너지를 쓴다.', scores: { lion: 3, fox: 1 } },
      ],
    },
    {
      id: 'q7',
      text: '사람들이 나를 가장 잘 설명하는 말은?',
      options: [
        { text: '“조용하지만 감정이 깊어.”', scores: { swan: 3, owl: 1 } },
        { text: '“믿고 맡길 수 있어.”', scores: { wolf: 3, dog: 1 } },
        { text: '“센스 있고 적응이 빨라.”', scores: { fox: 3, cat: 1 } },
        { text: '“한결같고 꾸준해.”', scores: { penguin: 3, bear: 1 } },
      ],
    },
    {
      id: 'q8',
      text: '처음 보는 사람이 나에게 말을 걸었다.',
      options: [
        { text: '반갑게 인사하고 금방 친해진다.', scores: { dog: 3, dolphin: 1 } },
        { text: '필요한 만큼만 답하고 내 페이스를 지킨다.', scores: { cat: 3, swan: 1 } },
        { text: '긴장하지만 티 내지 않으려 애쓴다.', scores: { rabbit: 3, penguin: 1 } },
        { text: '어떤 사람인지 궁금해 먼저 묻는다.', scores: { lion: 3, fox: 1 } },
      ],
    },
    {
      id: 'q9',
      text: '갑자기 큰 소리가 났다.',
      options: [
        { text: '먼저 몸이 굳고 주변부터 살핀다.', scores: { rabbit: 3, cat: 1 } },
        { text: '옆 사람부터 챙기고 같이 움직인다.', scores: { penguin: 3, dog: 1 } },
        { text: '무슨 일인지 확인하러 간다.', scores: { lion: 3, fox: 1 } },
        { text: '놀랐지만 티 내지 않고 상황을 본다.', scores: { bear: 3, owl: 1 } },
      ],
    },
    {
      id: 'q10',
      text: '오래 걸리는 일을 맡았다.',
      options: [
        { text: '매일 같은 시간에 조금씩 해나간다.', scores: { penguin: 3, squirrel: 1 } },
        { text: '늦어질까 미리 걱정하며 앞당겨 준비한다.', scores: { rabbit: 3, squirrel: 1 } },
        { text: '중간중간 점검하며 계획을 고친다.', scores: { owl: 3, squirrel: 1 } },
        { text: '함께 하는 사람이 있으면 힘이 난다.', scores: { dolphin: 3, dog: 1 } },
      ],
    },
  ],

  tieBreaker: [
    'owl',
    'wolf',
    'fox',
    'bear',
    'dolphin',
    'squirrel',
    'lion',
    'swan',
    'dog',
    'cat',
    'rabbit',
    'penguin',
  ],

  results: {
    owl: {
      emoji: '🦉',
      title: '부엉이형',
      subtitle: '어둠 속에서도 본질을 보는 관찰자',
      keywords: ['통찰', '분석', '독립성'],
      description:
        '당신은 성급하게 결론을 내리기보다 충분히 관찰하고 이해한 뒤 움직입니다. 사람들이 놓치는 작은 변화와 말속의 의미를 발견하며, 혼자 생각하는 시간에서 에너지를 얻습니다.',
      facts: [
        { label: '스트레스 모습', value: '연락을 줄이고 혼자 정리함' },
        { label: '행운 컬러', value: '네이비' },
      ],
      strengths: ['분석력', '집중력', '통찰력'],
      cautions: ['생각이 너무 많아 행동이 늦어질 수 있음'],
      match: { who: '돌고래, 다람쥐', why: '분위기를 띄우는 돌고래와 부지런한 다람쥐 곁에서, 묵직한 내 판단이 더 잘 쓰입니다.' },
      shareText: '모든 답을 확인한 뒤에만 움직일 필요는 없습니다.',
    },
    wolf: {
      emoji: '🐺',
      title: '늑대형',
      subtitle: '혼자도 강하지만 함께일 때 더 강한 수호자',
      keywords: ['책임감', '신뢰', '리더십'],
      description:
        '당신은 내 사람과 공동체를 중요하게 생각합니다. 독립적이지만 믿는 사람과는 깊게 연결되며, 위기에서는 자연스럽게 책임을 맡습니다.',
      facts: [
        { label: '스트레스 모습', value: '말수가 줄고 혼자 해결하려 함' },
        { label: '행운 컬러', value: '차콜 그레이' },
      ],
      strengths: ['충성심', '추진력', '보호 본능'],
      cautions: ['모든 짐을 혼자 들 수 있음'],
      match: { who: '곰, 돌고래', why: '넉넉히 받아 주는 곰과 유쾌한 돌고래는, 예민한 감각을 편하게 풀어 놓게 해 줍니다.' },
      shareText: '도움을 요청해도 당신의 강함은 줄어들지 않습니다.',
    },
    fox: {
      emoji: '🦊',
      title: '여우형',
      subtitle: '흐름을 읽고 길을 만드는 영리한 탐험가',
      keywords: ['적응력', '창의성', '센스'],
      description:
        '당신은 새로운 환경에 빠르게 적응하고 예상 밖의 방법을 찾아냅니다. 정해진 방식보다 더 재미있고 효율적인 길을 발견하며 사람과 상황의 분위기를 잘 읽습니다.',
      facts: [
        { label: '스트레스 모습', value: '갑자기 새로운 계획을 세우고 떠남' },
        { label: '행운 컬러', value: '오렌지' },
      ],
      strengths: ['유연성', '아이디어', '순발력'],
      cautions: ['반복되는 일에 쉽게 흥미를 잃음'],
      match: { who: '사자, 부엉이', why: '앞장서는 사자와 깊이 보는 부엉이 사이에서, 빠른 내 발이 헛돌지 않습니다.' },
      shareText: '새로운 길도 좋지만 끝까지 걸어보는 경험이 필요합니다.',
    },
    bear: {
      emoji: '🐻',
      title: '곰형',
      subtitle: '쉽게 흔들리지 않는 따뜻한 버팀목',
      keywords: ['안정', '인내', '신뢰'],
      description:
        '당신은 빠르게 움직이기보다 오래 지속할 수 있는 방법을 선택합니다. 주변 사람에게 편안함을 주며 말보다 꾸준한 행동으로 마음을 보여줍니다.',
      facts: [
        { label: '스트레스 모습', value: '혼자 쉬며 회복할 때까지 움직이지 않음' },
        { label: '행운 컬러', value: '브라운' },
      ],
      strengths: ['인내력', '안정감', '포용력'],
      cautions: ['변화가 필요해도 익숙한 상태에 머물 수 있음'],
      match: { who: '늑대, 백조', why: '자기 몫을 아는 늑대와 결이 고운 백조는, 사람 좋아하는 나를 지치지 않게 합니다.' },
      shareText: '천천히 가는 것과 멈춰 있는 것은 다릅니다.',
    },
    dolphin: {
      emoji: '🐬',
      title: '돌고래형',
      subtitle: '사람의 마음을 연결하는 밝은 에너지',
      keywords: ['공감', '소통', '낙관성'],
      description:
        '당신은 사람들과 함께할 때 에너지가 커지고 어색한 관계도 자연스럽게 연결합니다. 누군가 힘들어하면 먼저 감정을 알아차리며 분위기를 부드럽게 바꾸는 능력이 있습니다.',
      facts: [
        { label: '스트레스 모습', value: '믿는 사람에게 이야기를 쏟아냄' },
        { label: '행운 컬러', value: '아쿠아 블루' },
      ],
      strengths: ['공감력', '친화력', '표현력'],
      cautions: ['다른 사람의 감정까지 책임지려 할 수 있음'],
      match: { who: '늑대, 부엉이', why: '말수가 적은 둘과는 설명이 짧아도 통합니다. 혼자만의 시간을 서로 지켜 줍니다.' },
      shareText: '다른 사람의 기분보다 내 마음을 먼저 확인해보세요.',
    },
    squirrel: {
      emoji: '🐿️',
      title: '다람쥐형',
      subtitle: '작은 준비를 큰 성과로 만드는 설계자',
      keywords: ['계획', '성실', '성장'],
      description:
        '당신은 미래에 필요한 것을 미리 준비하고 작은 습관을 꾸준히 쌓습니다. 눈에 띄는 한 번의 성공보다 안정적으로 발전하는 과정을 중요하게 생각합니다.',
      facts: [
        { label: '스트레스 모습', value: '할 일 목록과 정리부터 시작함' },
        { label: '행운 컬러', value: '머스터드 옐로' },
      ],
      strengths: ['준비성', '꼼꼼함', '지속력'],
      cautions: ['계획이 틀어지면 불안해질 수 있음'],
      match: { who: '부엉이, 곰', why: '차분한 둘이 속도를 잡아 주면, 앞만 보고 달리다 놓치던 것이 보입니다.' },
      shareText: '완벽히 준비되지 않아도 시작할 수 있습니다.',
    },
    lion: {
      emoji: '🦁',
      title: '사자형',
      subtitle: '기회를 발견하면 앞으로 나서는 도전자',
      keywords: ['자신감', '용기', '추진력'],
      description:
        '당신은 망설이기보다 경험하며 배우는 타입입니다. 위기에서 존재감이 커지고 자신의 에너지로 다른 사람까지 움직이게 만듭니다.',
      facts: [
        { label: '스트레스 모습', value: '몸을 움직이거나 새로운 목표에 몰입함' },
        { label: '행운 컬러', value: '골드' },
      ],
      strengths: ['결단력', '행동력', '자신감'],
      cautions: ['충분히 생각하지 않고 속도를 낼 수 있음'],
      match: { who: '여우, 백조', why: '재빠른 여우와 단정한 백조 옆에서는, 조심스러운 성격이 흠이 되지 않습니다.' },
      shareText: '앞장서는 것만큼 주변의 속도를 살피는 것도 중요합니다.',
    },
    swan: {
      emoji: '🦢',
      title: '백조형',
      subtitle: '잔잔한 겉모습 아래 깊은 감성을 품은 예술가',
      keywords: ['감수성', '섬세함', '진정성'],
      description:
        '당신은 감정과 아름다움의 미묘한 차이를 잘 느낍니다. 겉으로는 차분하지만 내면의 세계는 풍부하며 사람과 관계에서도 진정성을 중요하게 생각합니다.',
      facts: [
        { label: '스트레스 모습', value: '음악, 글, 그림 등으로 감정을 정리함' },
        { label: '행운 컬러', value: '라벤더' },
      ],
      strengths: ['섬세함', '표현력', '공감 능력'],
      cautions: ['상처를 오래 간직할 수 있음'],
      match: { who: '곰, 사자', why: '든든한 둘이 뒤를 받쳐 주면, 마음 놓고 사람들 사이를 오갈 수 있습니다.' },
      shareText: '섬세함은 약함이 아니라 세상을 깊게 보는 능력입니다.',
    },

    /* ── 여기부터 원본 기획서에 없던 추가분 ── */
    dog: {
      emoji: '🐶',
      title: '강아지형',
      subtitle: '마음을 숨기지 않아서 더 믿음이 가는 사람',
      keywords: ['다정함', '솔직함', '충실함'],
      description:
        '당신은 좋으면 좋다고, 서운하면 서운하다고 표현합니다. 계산 없이 먼저 다가가기 때문에 주변 사람들은 당신 앞에서 편안해지고, 한번 마음을 준 사람에게는 오래도록 곁을 지킵니다.',
      facts: [
        { label: '스트레스 모습', value: '괜찮은 척하다가 한 사람에게 다 털어놓음' },
        { label: '행운 컬러', value: '크림 베이지' },
      ],
      strengths: ['친화력', '표현력', '의리'],
      cautions: ['상대의 반응에 기분이 크게 흔들릴 수 있음'],
      match: { who: '고양이, 돌고래', why: '적당히 거리를 두는 고양이와 밝은 돌고래는, 곁을 내주는 내 성격과 잘 맞습니다.' },
      shareText: '먼저 다가가는 마음은 손해가 아니라 당신의 재능입니다.',
    },
    cat: {
      emoji: '🐱',
      title: '고양이형',
      subtitle: '가까이 오되 내 속도는 내가 정하는 사람',
      keywords: ['자립', '관찰', '기준'],
      description:
        '당신은 사람을 싫어하는 것이 아니라 나만의 거리와 속도를 지키는 것뿐입니다. 억지로 맞추지 않고 스스로 납득해야 움직이며, 마음을 연 사람에게는 의외로 살뜰합니다.',
      facts: [
        { label: '스트레스 모습', value: '연락을 끊고 혼자 있는 시간을 늘림' },
        { label: '행운 컬러', value: '차콜 블랙' },
      ],
      strengths: ['독립성', '판단력', '몰입력'],
      cautions: ['마음을 늦게 표현해 오해를 살 수 있음'],
      match: { who: '강아지, 부엉이', why: '살갑게 다가오는 강아지와 조용한 부엉이. 내가 원할 때 다가오고 물러나 줍니다.' },
      shareText: '거리를 두는 것과 마음이 없는 것은 다릅니다.',
    },
    rabbit: {
      emoji: '🐰',
      title: '토끼형',
      subtitle: '먼저 알아차리기 때문에 먼저 준비하는 사람',
      keywords: ['예민함', '기민함', '배려'],
      description:
        '당신은 공기의 미세한 변화를 남보다 빨리 느낍니다. 걱정이 많다는 말을 듣지만 그 덕분에 위험을 미리 피하고, 상대가 말하지 않은 불편까지 챙겨 줍니다.',
      facts: [
        { label: '스트레스 모습', value: '최악의 경우를 상상하며 미리 준비함' },
        { label: '행운 컬러', value: '페일 핑크' },
      ],
      strengths: ['위험 감지', '섬세한 배려', '빠른 반응'],
      cautions: ['일어나지 않은 일까지 걱정해 지칠 수 있음'],
      match: { who: '곰, 펭귄', why: '천천히 가는 둘과 함께라면, 서두르지 않아도 되는 하루가 됩니다.' },
      shareText: '모든 위험을 미리 막지 않아도 당신은 충분히 잘하고 있습니다.',
    },
    penguin: {
      emoji: '🐧',
      title: '펭귄형',
      subtitle: '요란하지 않게 끝까지 같이 가는 사람',
      keywords: ['한결같음', '동료애', '지구력'],
      description:
        '당신은 눈에 띄는 활약보다 오늘도 제자리를 지키는 쪽을 택합니다. 추운 날일수록 서로 붙어 버티는 무리처럼, 힘든 상황에서 곁에 있어 주는 것으로 사람을 얻습니다.',
      facts: [
        { label: '스트레스 모습', value: '평소 하던 일을 묵묵히 반복하며 버팀' },
        { label: '행운 컬러', value: '아이스 그레이' },
      ],
      strengths: ['성실함', '협동심', '버티는 힘'],
      cautions: ['힘들다는 말을 너무 늦게 꺼냄'],
      match: { who: '토끼, 늑대', why: '섬세한 토끼와 단단한 늑대. 무리에 섞이는 법과 혼자 서는 법을 서로에게서 배웁니다.' },
      shareText: '묵묵함은 티가 안 날 뿐 가장 오래 남는 힘입니다.',
    },
  },
}

/* ================================================================
   3) 애매한 연락을 받았을 때, 내 마음 급발진 지수
   ------------------------------------------------------------------
   원본: 자료/공감형_4지선다_심리테스트_5세트.md (1번)

   앞의 두 테스트와 채점 방식이 다르다. 위쪽은 선택지 하나가 여러 결과에
   점수를 나눠 주지만(대표 +3 · 보조 +1), 이 테스트는 A/B/C/D 가 결과 넷과
   1:1 로 맞물려 있어 선택지 하나가 유형 하나에만 1점을 준다.

   그래서 4문항 2:2 동점이 자주 난다. 고정 순서로 끊으면 늘 같은 쪽이
   이겨 버리므로, 여기서는 tieBreak: 'lastPick' 을 켜서 마지막 문항에서
   고른 유형을 앞세운다 (원본 기획의 규칙).
   ================================================================ */
const message = {
  id: 'message',
  emoji: '💬',
  title: '애매한 연락에 내 마음 급발진 지수',
  short: '연락 급발진 지수',
  description:
    '갑자기 온 “할 말 있어” 앞에서, 나는 확인하고 끝낼까 아니면 혼자 서사를 만들까?',
  accent: '#8a6a12',
  hasResultArt: true,
  tieBreak: 'lastPick',

  questions: [
    {
      id: 'q1',
      text: '메시지를 보자마자 가장 먼저 하는 행동은?',
      options: [
        { text: '“무슨 일인데?”라고 바로 묻는다.', scores: { ask_now: 1 } },
        { text: '최근 대화를 위로 올려 본다.', scores: { read_context: 1 } },
        { text: '심장이 철렁하지만 일단 답장을 미룬다.', scores: { guard_heart: 1 } },
        { text: '최악의 상황을 세 개쯤 상상한다.', scores: { imagine_worst: 1 } },
      ],
    },
    {
      id: 'q2',
      text: '상대가 “나중에 말할게”라고 하면?',
      options: [
        { text: '그러라고 하고 내 할 일을 한다.', scores: { ask_now: 1 } },
        { text: '대충 어떤 이야기인지 추리한다.', scores: { read_context: 1 } },
        { text: '아무 일 아닌 척 다른 얘기를 꺼낸다.', scores: { guard_heart: 1 } },
        { text: '오늘 잠은 글렀다고 생각한다.', scores: { imagine_worst: 1 } },
      ],
    },
    {
      id: 'q3',
      text: '그날 저녁까지 연락이 없으면?',
      options: [
        { text: '한 번 더 편하게 물어본다.', scores: { ask_now: 1 } },
        { text: '친구에게 상황을 설명해 본다.', scores: { read_context: 1 } },
        { text: '휴대폰을 멀리 둔다.', scores: { guard_heart: 1 } },
        { text: '내가 뭘 잘못했는지 목록을 만든다.', scores: { imagine_worst: 1 } },
      ],
    },
    {
      id: 'q4',
      text: '실제로 별일 아니었다면?',
      options: [
        { text: '“다행이다” 하고 넘긴다.', scores: { ask_now: 1 } },
        { text: '왜 그렇게 말했는지 궁금해한다.', scores: { read_context: 1 } },
        { text: '괜히 긴장했다며 민망해한다.', scores: { guard_heart: 1 } },
        { text: '안심한 뒤에야 배가 고파진다.', scores: { imagine_worst: 1 } },
      ],
    },
  ],

  tieBreaker: ['ask_now', 'read_context', 'guard_heart', 'imagine_worst'],

  results: {
    ask_now: {
      emoji: '🙋',
      title: '확인하고 끝내는 타입',
      subtitle: '모르는 상태를 오래 두지 못하는 사람',
      keywords: ['직진', '회복력', '깔끔한 마무리'],
      description:
        '모르는 상태를 오래 두지 않습니다. 물어보고 답을 얻으면 마음도 바로 정상 속도로 돌아옵니다. 혼자 추측을 키우는 대신 한 문장을 보내는 쪽을 택하기 때문에, 오해가 쌓이기 전에 정리되는 편입니다.',
      facts: [
        { label: '급발진 지수', value: '21%' },
        { label: '확인까지', value: '3분' },
      ],
      strengths: ['솔직한 소통', '빠른 회복', '오해 차단'],
      cautions: ['상대가 아직 말할 준비가 안 됐을 수 있음'],
      match: {
        who: '상상으로 먼저 다치는 타입',
        why: '혼자 커지던 상상을 한 마디로 꺼 줍니다. 옆에 있는 것만으로 밤이 조용해집니다.',
      },
      shareText: '“무슨 일인데?” 한 마디로 하루를 지켜냅니다.',
    },
    read_context: {
      emoji: '🔍',
      title: '맥락까지 읽는 타입',
      subtitle: '한 문장보다 최근 분위기를 먼저 보는 사람',
      keywords: ['관찰', '해석', '기억력'],
      description:
        '한 문장보다 최근 분위기와 대화의 결을 함께 봅니다. 언제부터 답장이 짧아졌는지, 그날 무슨 일이 있었는지까지 떠올리기 때문에 단서가 많을수록 해석도 정교해집니다.',
      facts: [
        { label: '급발진 지수', value: '48%' },
        { label: '거슬러 읽은 대화', value: '2주치' },
      ],
      strengths: ['상황 파악', '기억력', '눈치'],
      cautions: ['단서가 많아질수록 결론이 늦어짐'],
      match: {
        who: '확인하고 끝내는 타입',
        why: '추리가 길어질 때 “그냥 물어보자”라고 말해 주는 사람이라, 답이 빨리 나옵니다.',
      },
      shareText: '메시지 한 줄로 지난 2주를 복기하는 사람.',
    },
    guard_heart: {
      emoji: '🛡️',
      title: '마음부터 지키는 타입',
      subtitle: '흔들릴 것 같으면 먼저 거리를 두는 사람',
      keywords: ['신중함', '자기 보호', '침착'],
      description:
        '답을 기다리는 동안 내가 더 흔들리지 않도록 거리를 둡니다. 무심한 게 아니라 신중한 것입니다. 감정이 가장 클 때 말하지 않는 습관 덕분에, 나중에 후회할 말을 남기지 않습니다.',
      facts: [
        { label: '급발진 지수', value: '63%' },
        { label: '휴대폰 엎어 둔 시간', value: '4시간' },
      ],
      strengths: ['감정 조절', '신중함', '뒷말 없음'],
      cautions: ['괜찮은 척하다 혼자 오래 앓을 수 있음'],
      match: {
        who: '맥락까지 읽는 타입',
        why: '말하지 않아도 상태를 알아채는 쪽이라, 굳이 설명하지 않아도 되는 게 편합니다.',
      },
      shareText: '답장은 안 했지만 하루 종일 생각은 했습니다.',
    },
    imagine_worst: {
      emoji: '🎬',
      title: '상상으로 먼저 다치는 타입',
      subtitle: '결론이 나기 전에 이미 3부작을 다 본 사람',
      keywords: ['상상력', '몰입', '예민한 감각'],
      description:
        '결론이 나오기 전까지 머릿속에서 이미 여러 편의 드라마가 재생됩니다. 감정이 풍부하고 상황을 생생하게 그리는 능력이 있지만, 확인 전의 생각은 잠시 보류해도 됩니다. 대체로 별일 아니었습니다.',
      facts: [
        { label: '급발진 지수', value: '94%' },
        { label: '상상한 시나리오', value: '3편' },
      ],
      strengths: ['풍부한 상상력', '깊은 몰입', '섬세한 감정'],
      cautions: ['일어나지 않은 일로 먼저 지침'],
      match: {
        who: '마음부터 지키는 타입',
        why: '같이 흔들리지 않고 옆에 있어 주기 때문에, 상상이 더 커지지 않고 멈춥니다.',
      },
      shareText: '아직 아무 일도 안 일어났는데 결말은 봤습니다.',
    },
  },
}

/* ================================================================
   4) 좋아하는 사람이 스토리를 올렸을 때
   ------------------------------------------------------------------
   원본: 자료/공감형_4지선다_심리테스트_5세트.md (5번)
   채점은 위 message 와 같다 (A/B/C/D → 결과 1:1, 동점은 마지막 답으로).
   ================================================================ */
const story = {
  id: 'story',
  emoji: '📱',
  title: '좋아하는 사람이 스토리를 올렸을 때',
  short: '스토리 반응 테스트',
  description: '3초짜리 스토리 한 장 앞에서 드러나는, 티 내고 싶은 마음과 숨기고 싶은 마음.',
  accent: '#a12a86',
  hasResultArt: true,
  tieBreak: 'lastPick',

  questions: [
    {
      id: 'q1',
      text: '좋아하는 사람이 스토리를 올리면?',
      options: [
        { text: '답장할 핑계를 바로 찾는다.', scores: { dm_dash: 1 } },
        { text: '장소·태그·같이 있는 사람부터 본다.', scores: { story_csi: 1 } },
        { text: '봤지만 본 티는 절대 안 낸다.', scores: { no_react: 1 } },
        { text: '몇 분 뒤에 다시 들어가 본다.', scores: { meaning_maker: 1 } },
      ],
    },
    {
      id: 'q2',
      text: '평소와 다른 분위기의 사진이면?',
      options: [
        { text: '“오늘 분위기 뭐야?” 하고 답장한다.', scores: { dm_dash: 1 } },
        { text: '갑자기 왜 이런 사진인지 맥락을 찾는다.', scores: { story_csi: 1 } },
        { text: '반응하고 싶지만 하트만 누르고 나온다.', scores: { no_react: 1 } },
        { text: '누군가에게 보여 주려고 올린 건지 생각한다.', scores: { meaning_maker: 1 } },
      ],
    },
    {
      id: 'q3',
      text: '내 스토리를 올릴 때 나는?',
      options: [
        { text: '공유하고 싶으면 바로 올린다.', scores: { dm_dash: 1 } },
        { text: '그 사람이 봤는지 은근히 확인한다.', scores: { story_csi: 1 } },
        { text: '올렸다가 ‘너무 티 났나?’ 싶어 지운다.', scores: { no_react: 1 } },
        { text: '그 사람이 접속할 만한 시간에 올린다.', scores: { meaning_maker: 1 } },
      ],
    },
    {
      id: 'q4',
      text: '내 스토리를 유독 빨리 봤다면?',
      options: [
        { text: '그냥 스토리를 자주 보는 사람인가 보다 한다.', scores: { dm_dash: 1 } },
        { text: '지난번보다 빨랐는지 기억을 더듬는다.', scores: { story_csi: 1 } },
        { text: '신경 안 쓰는 척 앱을 닫는다.', scores: { no_react: 1 } },
        { text: '괜히 오늘 스토리를 하나 더 올리고 싶어진다.', scores: { meaning_maker: 1 } },
      ],
    },
  ],

  tieBreaker: ['dm_dash', 'story_csi', 'no_react', 'meaning_maker'],

  results: {
    dm_dash: {
      emoji: '💌',
      title: 'DM 직진러',
      subtitle: '답장창은 이미 열려 있는 사람',
      keywords: ['적극성', '솔직함', '대화력'],
      description:
        '스토리 한 장을 보면 대화 주제 세 개가 떠오릅니다. 이미 답장창은 열려 있고, 문제는 너무 빨리 답한 티가 날까 봐 30초만 기다리는 것입니다. 마음을 숨기는 데 에너지를 쓰지 않아 관계가 빨리 진전됩니다.',
      facts: [
        { label: '답장까지', value: '30초' },
        { label: '티 남 지수', value: '82%' },
      ],
      strengths: ['먼저 다가가기', '대화 소재', '솔직한 표현'],
      cautions: ['상대의 속도보다 빠를 수 있음'],
      match: {
        who: '무반응 고수',
        why: '먼저 말을 걸어 주는 사람이 없으면 시작되지 않는 쪽이라, 내 직진이 헛되지 않습니다.',
      },
      shareText: '스토리 한 장에서 대화 주제 세 개를 뽑아냅니다.',
    },
    story_csi: {
      emoji: '🕵️',
      title: '스토리 CSI',
      subtitle: '3초짜리 영상을 8분 동안 보는 사람',
      keywords: ['관찰력', '추리', '집요함'],
      description:
        '사진은 3초짜리인데 태그·배경 음악·테이블 위 컵까지 다 봅니다. “누구랑 갔지?”라는 질문은 이미 마음속에서 브리핑이 끝났습니다. 놓치는 정보가 없는 대신, 알아낸 것을 티 내지 않는 데에도 힘을 씁니다.',
      facts: [
        { label: '단서 수집력', value: '96%' },
        { label: '3초 영상 분석', value: '8분' },
      ],
      strengths: ['세밀한 관찰', '기억력', '상황 파악'],
      cautions: ['알아낸 걸 말할 수 없어 혼자 답답함'],
      match: {
        who: '의미 부여 장인',
        why: '단서를 모으는 나와 이야기를 만드는 쪽이 만나면, 스토리 하나로 밤을 새울 수 있습니다.',
      },
      shareText: '태그·음악·테이블 위 컵까지 전부 봤습니다.',
    },
    no_react: {
      emoji: '🕶️',
      title: '무반응 고수',
      subtitle: '조회 기록만 남기고 마음은 비행기 모드',
      keywords: ['자제력', '체면', '속마음'],
      description:
        '조회 기록만 남기고 마음은 비행기 모드입니다. 하트 하나도 너무 큰 고백 같아서, 오늘도 조용히 보고 조용히 나옵니다. 감정을 드러내지 않는 능력은 뛰어나지만, 그 덕분에 상대는 아무것도 모릅니다.',
      facts: [
        { label: '티 남 지수', value: '11%' },
        { label: '남긴 흔적', value: '조회 기록뿐' },
      ],
      strengths: ['감정 조절', '침착함', '흔적 관리'],
      cautions: ['아무 티도 안 나서 마음이 전달되지 않음'],
      match: {
        who: 'DM 직진러',
        why: '먼저 문을 두드려 주는 사람이라, 내가 용기를 다 끌어모으지 않아도 됩니다.',
      },
      shareText: '봤습니다. 근데 아무 일도 없었던 걸로 합니다.',
    },
    meaning_maker: {
      emoji: '✨',
      title: '의미 부여 장인',
      subtitle: '평범한 스토리에 서사를 입히는 사람',
      keywords: ['상상력', '감수성', '타이밍'],
      description:
        '조회자 목록에 그 이름이 뜬 순간, 평범한 스토리가 갑자기 서사를 갖습니다. 호감의 증거는 아니어도 오늘 스토리 하나 더 올릴 명분은 충분합니다. 작은 신호에서 이야기를 만들어내는 재능이 있습니다.',
      facts: [
        { label: '의미 부여 지수', value: '93%' },
        { label: '오늘 올린 스토리', value: '4개' },
      ],
      strengths: ['상상력', '감정 표현', '분위기 연출'],
      cautions: ['혼자 만든 서사에 혼자 흔들림'],
      match: {
        who: '스토리 CSI',
        why: '내가 만든 이야기에 근거를 붙여 주기도, 조용히 정정해 주기도 하는 사람입니다.',
      },
      shareText: '조회자 목록에 그 이름이 뜬 순간 서사가 시작됩니다.',
    },
  },
}

/*
 * 결과에 그림을 붙인다.
 *
 * 결과마다 image: 를 손으로 적지 않는 이유 — 파일 이름을 결과 ID 와 똑같이
 * 맞춰 두었으므로 여기서 한 번에 짝지으면 된다. 결과를 새로 추가할 때
 * 그림만 같은 이름으로 넣으면 자동으로 붙고, 빠뜨리면 아래 경고가 뜬다.
 */
for (const test of [animal, zombie, message, story]) {
  for (const [id, result] of Object.entries(test.results)) {
    result.image = art[test.id]?.[id] ?? ''
    // 그림이 아직 없는 테스트도 있다 (화면은 이모지로 대신 보여 준다).
    // 한 장이라도 갖춘 테스트에서만 빠진 것을 알린다 — 없는 폴더까지 경고하면
    // 콘솔이 시끄러워져 정작 봐야 할 경고를 놓친다.
    if (!result.image && test.hasResultArt) {
      console.warn(`[tests] ${test.id}/${id}.jpg 그림을 찾지 못했습니다.`)
    }
  }
}

/** 목록 카드의 표지 — 좀비는 한 장, 동물은 네 마리를 모아 붙인다 */
zombie.cover = [art.zombie.cover]
animal.cover = [art.animal.dog, art.animal.cat, art.animal.owl, art.animal.fox]
message.cover = [art.message.cover]
story.cover = [art.story.cover]

/* 테스트마다 칩 그림을 붙인다 (파일 이름이 곧 테스트 id) */
for (const test of [animal, zombie, message, story]) {
  test.chip = chips[test.id] ?? ''
}

/*
 * 카드 배경에 크게 얹는 표시.
 * 아이콘만으로는 '무슨 앱 이야기인지'까지만 읽힌다. 그 앱에서 무엇을 다루는지를
 * 배경에 한 번 더 얹어 준다 — 마음(하트), 주고받기(종이비행기).
 */
message.mark = 'heart'
story.mark = 'send'

/** 메뉴에 놓이는 순서 */
export const tests = [animal, zombie, message, story]

export const findTest = (id) => tests.find((test) => test.id === id) ?? null

/**
 * 고른 답들로 점수를 합산해 결과 하나를 고른다.
 *
 * @param {object} test    위 tests 중 하나
 * @param {number[]} picks 문항 순서대로 고른 선택지의 인덱스
 * @returns {{ id: string, result: object, scores: object, ranking: array }}
 */
export const calculateResult = (test, picks) => {
  const scores = {}

  test.questions.forEach((question, index) => {
    const option = question.options[picks[index]]
    if (!option) return
    for (const [resultId, point] of Object.entries(option.scores)) {
      scores[resultId] = (scores[resultId] ?? 0) + point
    }
  })

  /*
   * 동점이면 tieBreaker 에서 앞선 쪽이 이긴다.
   * 무작위로 고르면 같은 답인데 결과가 달라져 테스트를 믿지 못하게 된다.
   *
   * tieBreak: 'lastPick' 인 테스트(4지선다형)는 마지막 문항에서 고른 유형을
   * 그 앞에 끼워 넣는다. 4문항 2:2 동점이 흔한데 고정 순서로만 끊으면
   * 늘 같은 결과가 이겨, 뒤쪽 문항을 아무렇게나 골라도 티가 나지 않는다.
   */
  const order = [...test.tieBreaker]

  if (test.tieBreak === 'lastPick') {
    const last = test.questions.length - 1
    const lastPicked = test.questions[last]?.options[picks[last]]
    // 이 유형들은 선택지 하나가 결과 하나에만 점수를 준다 — 키가 곧 유형이다
    const lastType = lastPicked ? Object.keys(lastPicked.scores)[0] : ''
    if (lastType) order.unshift(lastType)
  }

  const rank = (id) => {
    const at = order.indexOf(id)
    return at === -1 ? Number.MAX_SAFE_INTEGER : at
  }

  const ranking = Object.entries(scores)
    .map(([id, score]) => ({ id, score, ...test.results[id] }))
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : rank(a.id) - rank(b.id)))

  const top = ranking[0]

  return {
    id: top?.id ?? '',
    result: top ? test.results[top.id] : null,
    scores,
    ranking,
  }
}
