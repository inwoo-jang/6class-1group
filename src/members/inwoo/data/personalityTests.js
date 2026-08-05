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

const art = {
  animal: collect(
    import.meta.glob('../assets/tests/animal/*.jpg', { eager: true, import: 'default' }),
  ),
  zombie: collect(
    import.meta.glob('../assets/tests/zombie/*.jpg', { eager: true, import: 'default' }),
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

/*
 * 결과에 그림을 붙인다.
 *
 * 결과마다 image: 를 손으로 적지 않는 이유 — 파일 이름을 결과 ID 와 똑같이
 * 맞춰 두었으므로 여기서 한 번에 짝지으면 된다. 결과를 새로 추가할 때
 * 그림만 같은 이름으로 넣으면 자동으로 붙고, 빠뜨리면 아래 경고가 뜬다.
 */
for (const test of [animal, zombie]) {
  for (const [id, result] of Object.entries(test.results)) {
    result.image = art[test.id]?.[id] ?? ''
    if (!result.image) console.warn(`[tests] ${test.id}/${id}.jpg 그림을 찾지 못했습니다.`)
  }
}

/** 목록 카드의 표지 — 좀비는 한 장, 동물은 네 마리를 모아 붙인다 */
zombie.cover = [art.zombie.cover]
animal.cover = [art.animal.dog, art.animal.cat, art.animal.owl, art.animal.fox]

/** 메뉴에 놓이는 순서 */
export const tests = [animal, zombie]

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

  // 동점이면 tieBreaker 에서 앞선 쪽이 이긴다.
  // 무작위로 고르면 같은 답인데 결과가 달라져 테스트를 믿지 못하게 된다.
  const rank = (id) => {
    const at = test.tieBreaker.indexOf(id)
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
