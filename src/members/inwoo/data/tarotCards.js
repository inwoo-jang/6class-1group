const majorArcana = [
  ['0', '바보', '새로운 시작', '가벼운 발걸음이 예상 밖의 기회를 데려옵니다.'],
  ['I', '마법사', '실행력', '이미 가진 재능을 믿고 첫 행동을 시작해 보세요.'],
  ['II', '여사제', '직관', '답을 서두르기보다 조용한 마음의 신호를 들어보세요.'],
  ['III', '여황제', '풍요', '돌봄과 여유가 관계와 일에 좋은 흐름을 만듭니다.'],
  ['IV', '황제', '안정', '우선순위를 정하고 단단한 기준으로 하루를 이끌어 보세요.'],
  ['V', '교황', '배움', '믿을 만한 조언이나 익숙한 원칙에서 힌트를 얻습니다.'],
  ['VI', '연인', '선택', '마음과 가치가 같은 방향을 가리키는지 확인해 보세요.'],
  ['VII', '전차', '전진', '망설임보다 집중이 필요한 날입니다. 목표를 향해 나아가세요.'],
  ['VIII', '힘', '용기', '부드러운 끈기가 강한 힘이 됩니다. 자신을 다그치지 마세요.'],
  ['IX', '은둔자', '성찰', '잠시 혼자 생각할 시간이 다음 선택을 선명하게 합니다.'],
  ['X', '운명의 수레바퀴', '전환', '예상치 못한 변화도 흐름을 바꾸는 좋은 계기가 됩니다.'],
  ['XI', '정의', '균형', '감정보다 사실을 살피면 공정한 결론에 닿을 수 있습니다.'],
  ['XII', '매달린 사람', '관점', '멈춤은 실패가 아닙니다. 다른 시선에서 답을 찾아보세요.'],
  ['XIII', '죽음', '변화', '끝난 것을 놓아줄수록 새로움이 들어올 자리가 생깁니다.'],
  ['XIV', '절제', '조화', '급하게 결정하지 말고 적당한 속도와 균형을 지키세요.'],
  ['XV', '악마', '해방', '습관이나 걱정에 묶여 있지 않은지 가볍게 점검해 보세요.'],
  ['XVI', '탑', '각성', '계획이 흔들려도 핵심을 다시 세울 기회가 됩니다.'],
  ['XVII', '별', '희망', '작은 기대를 놓지 마세요. 회복의 조짐이 보이는 날입니다.'],
  ['XVIII', '달', '감수성', '불안한 상상보다 확인할 수 있는 사실에 집중해 보세요.'],
  ['XIX', '태양', '기쁨', '밝은 에너지가 주변으로 번집니다. 마음껏 표현해도 좋습니다.'],
  ['XX', '심판', '재도약', '미뤄 둔 일을 다시 꺼내면 의미 있는 답을 얻습니다.'],
  ['XXI', '세계', '완성', '지금까지의 노력을 인정하고 다음 장을 준비해 보세요.'],
]

const suits = [
  { key: 'wands', name: '완드', symbol: '✦', theme: '열정과 성장', color: '#c77932' },
  { key: 'cups', name: '컵', symbol: '◒', theme: '감정과 관계', color: '#4d8cb7' },
  { key: 'swords', name: '소드', symbol: '⚔', theme: '생각과 결단', color: '#657587' },
  { key: 'pentacles', name: '펜타클', symbol: '✺', theme: '현실과 성취', color: '#a88635' },
]

const ranks = [
  ['Ace', '에이스', '새로운 가능성을 반갑게 받아들여 보세요.'],
  ['Two', '2', '혼자 해결하려 하지 말고 균형점을 찾아보세요.'],
  ['Three', '3', '함께할수록 좋은 결과가 만들어집니다.'],
  ['Four', '4', '기초를 다지고 잠시 숨을 고르는 것이 좋습니다.'],
  ['Five', '5', '작은 갈등은 다른 방법을 발견하는 계기가 됩니다.'],
  ['Six', '6', '주고받는 마음이 하루의 행운을 키웁니다.'],
  ['Seven', '7', '조급해하지 말고 자신의 방향을 지켜보세요.'],
  ['Eight', '8', '꾸준한 연습과 집중이 빛을 발합니다.'],
  ['Nine', '9', '지금까지 쌓아 온 힘을 믿어도 좋습니다.'],
  ['Ten', '10', '무거운 짐은 나누고 마무리는 차분히 해내세요.'],
  ['Page', '페이지', '호기심 어린 소식과 배움이 기다립니다.'],
  ['Knight', '나이트', '의욕은 좋지만 한 번 더 방향을 살펴보세요.'],
  ['Queen', '퀸', '다정한 통찰로 나와 주변을 보살피는 날입니다.'],
  ['King', '킹', '책임감 있는 결정이 신뢰를 만들어 줍니다.'],
]

const svgImage = (label, symbol, color) => {
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="960" viewBox="0 0 600 960"><rect width="600" height="960" rx="38" fill="#151426"/><rect x="24" y="24" width="552" height="912" rx="24" fill="#24213a" stroke="#e7c978" stroke-width="6"/><path d="M300 104 333 185 420 194 353 249 373 334 300 290 227 334 247 249 180 194 267 185Z" fill="${color}" opacity=".9"/><circle cx="300" cy="490" r="150" fill="none" stroke="#e7c978" stroke-width="8"/><circle cx="300" cy="490" r="112" fill="none" stroke="${color}" stroke-width="20"/><text x="300" y="535" text-anchor="middle" font-size="130" fill="#fff6da" font-family="serif">${symbol}</text><path d="M110 760 Q300 650 490 760" fill="none" stroke="#e7c978" stroke-width="6"/><text x="300" y="835" text-anchor="middle" font-size="29" fill="#fff6da" font-family="sans-serif">${label}</text><circle cx="74" cy="74" r="10" fill="#e7c978"/><circle cx="526" cy="886" r="10" fill="#e7c978"/></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`
}

const makeMajor = ([number, name, keyword, message]) => ({
  id: `major-${number}`,
  arcana: '메이저 아르카나',
  number,
  name,
  keyword,
  message,
  image: svgImage(name, '✶', '#d8ab52'),
})

const makeMinor = (suit) =>
  ranks.map(([rank, label, message], index) => ({
    id: `${suit.key}-${rank.toLowerCase()}`,
    arcana: '마이너 아르카나',
    number: String(index + 1).padStart(2, '0'),
    name: `${label} 오브 ${suit.name}`,
    keyword: suit.theme,
    message,
    image: svgImage(`${label} OF ${suit.name.toUpperCase()}`, suit.symbol, suit.color),
  }))

export const tarotCards = [...majorArcana.map(makeMajor), ...suits.flatMap(makeMinor)]
