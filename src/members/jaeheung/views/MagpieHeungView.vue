<script setup>
import { ref, computed } from 'vue'

const selectedBandage = ref(null)
const phase = ref('injured') // injured → healing → flying → returned

const articles = {
  yellow: {
    category: '경제 / 금융',
    emoji: '🟡',
    title: 'AI revenues are growing fast, but not fast enough',

    summary:
      '미국의 주요 기술 기업들은 인공지능 시대의 주도권을 확보하기 위해 데이터센터, 반도체, 전력 인프라 등에 역사적인 규모의 자본을 투입하고 있다. Amazon, Google, Microsoft와 같은 기업들은 향후 AI 수요 증가를 예상하며 수천억 달러 규모의 투자를 진행하고 있지만, 시장에서는 이러한 지출이 실제 수익으로 연결될 수 있을지에 대한 의문이 커지고 있다. 현재 AI 관련 매출은 빠르게 증가하고 있지만, 기업들이 투자한 막대한 비용을 회수하기에는 아직 부족한 수준이다. 특히 많은 기업들이 AI를 실험적으로 사용하고 있을 뿐, 조직 구조와 업무 방식을 근본적으로 변화시키는 단계까지 도달하지 못했다. 전문가들은 AI가 장기적으로 생산성을 크게 향상시키기 위해서는 단순히 챗봇을 도입하는 것을 넘어 데이터 관리, 인력 재편, 기업 프로세스 개선과 같은 무형 자본 투자가 병행되어야 한다고 지적한다. 결국 AI 투자 열풍의 성공 여부는 기술 발전 자체보다 기업들이 AI를 활용해 지속 가능한 경제적 가치를 창출할 수 있는지에 달려 있다.',

    words: [
      {
        word: 'capital-allocation',
        meaning: '자본 배분',
      },
      {
        word: 'expenditure',
        meaning: '지출, 비용',
      },
      {
        word: 'dilettante',
        meaning: '아마추어적 관심만 가진 사람',
      },
      {
        word: 'intangible capital',
        meaning: '무형 자본',
      },
    ],
  },
  blue: {
    category: '환경 / 사회',
    emoji: '🔵',
    title: 'Europe’s fires are just the start',

    summary:
      '유럽에서 발생한 대규모 산불은 단순한 계절적 재난이 아니라 기후 변화가 만들어낸 새로운 위험 환경을 보여주는 사례로 평가된다. 프랑스와 스페인 등에서는 기록적인 규모의 화재가 발생했으며, 지속적인 폭염과 건조한 환경으로 인해 앞으로 더 심각한 산불이 발생할 가능성이 커지고 있다. 기후 변화는 전 세계 산불 발생 지역의 상당 부분에서 위험도를 높이고 있으며, 특히 화재 자체뿐 아니라 연기 오염으로 인한 장기적인 건강 피해도 심각한 문제로 떠오르고 있다. 전문가들은 산불 대응이 단순한 진화 능력 확대에 머물러서는 안 되며, 위성 감시, 드론 기술, 산림 관리, 대중 교육 등 예방 중심의 전략이 필요하다고 지적한다. 또한 화재 위험이 증가하는 시대에는 국제적인 협력과 자원 공유 체계가 더욱 중요해지고 있다. 현재 발생하는 산불은 새로운 정상 상태가 아니라 앞으로 나타날 수 있는 더 극단적인 기후 위험의 신호일 수 있다.',

    words: [
      {
        word: 'desiccated',
        meaning: '극도로 건조해진',
      },
      {
        word: 'perilously',
        meaning: '위험할 정도로',
      },
      {
        word: 'anthropogenic',
        meaning: '인간 활동에 의해 발생한',
      },
      {
        word: 'destitution',
        meaning: '빈곤, 궁핍',
      },
    ],
  },
  red: {
    category: '과학 / 기술',
    emoji: '🔴',
    title: 'It is past time to upgrade to post-quantum encryption',

    summary:
      '양자 컴퓨팅 기술이 빠르게 발전하면서 기존 암호화 체계의 안정성에 대한 우려가 커지고 있다. 현재 인터넷 금융 거래와 디지털 통신을 보호하는 암호 방식은 일반적인 컴퓨터로는 해독하기 어렵지만, 충분히 강력한 양자 컴퓨터가 등장하면 단기간에 무력화될 가능성이 있다. 특히 현재 전송되고 있는 암호화 데이터가 미래의 양자 컴퓨터 발전 이후 해독될 수 있다는 점에서 선제적인 대응이 요구되고 있다. 이를 해결하기 위한 방법으로 양자 내성 암호(Post-Quantum Cryptography)가 개발되고 있으며, 일부 브라우저와 대형 기술 기업들은 이미 이를 도입하기 시작했다. 그러나 많은 기업과 기관은 오래된 장비와 업데이트가 어려운 시스템 때문에 전환에 어려움을 겪고 있다. 전문가들은 완벽한 보안을 보장할 수는 없더라도 지금부터 새로운 암호 체계로 이동하고 지속적인 검증을 진행하는 것이 미래의 사이버 위협에 대비하는 가장 현실적인 방법이라고 강조한다.',

    words: [
      {
        word: 'imminent',
        meaning: '임박한',
      },
      {
        word: 'exploitable',
        meaning: '악용 가능한',
      },
      {
        word: 'cryptography',
        meaning: '암호학',
      },
      {
        word: 'vulnerability',
        meaning: '취약점',
      },
    ],
  },
  black: {
    category: '정치',
    emoji: '⚫',
    title: 'Donald Trump is warming to Volodymyr Zelensky',

    summary:
      '한때 심각하게 악화되었던 미국과 우크라이나 지도자 간의 관계가 최근 변화하고 있다. 도널드 트럼프 대통령은 과거 볼로디미르 젤렌스키 대통령을 강하게 비판했지만, 우크라이나의 군사적 역량과 독자적인 방위 기술 발전을 평가하면서 태도를 바꾸기 시작했다. 특히 우크라이나가 개발한 장거리 드론 능력과 자체 무기 생산 능력은 미국 내 일부 정치권에서 우크라이나 지원의 전략적 가치를 재평가하게 만드는 요인이 되었다. 동시에 트럼프 행정부는 러시아에 대한 불만을 키우며 제재 강화 가능성을 검토하고 있다. 그러나 우크라이나 지원 문제는 미국 의회 내부의 정치적 갈등과 평화 협상의 불확실성이라는 복잡한 장애물을 남겨두고 있다. 젤렌스키는 제한된 외교적 선택지 속에서도 미국과의 관계를 다시 강화하며 국제 무대에서 전략적 영향력을 확보하려 노력하고 있다.',

    words: [
      {
        word: 'prowess',
        meaning: '뛰어난 능력, 역량',
      },
      {
        word: 'appropriation',
        meaning: '예산 책정, 자금 할당',
      },
      {
        word: 'moribund',
        meaning: '쇠퇴한, 활력을 잃은',
      },
      {
        word: 'mercurial',
        meaning: '변덕스러운, 예측하기 어려운',
      },
    ],
  },
}

const currentArticle = computed(() =>
  selectedBandage.value ? articles[selectedBandage.value] : null,
)

const bandageColor = computed(() => {
  switch (selectedBandage.value) {
    case 'yellow':
      return '#f7d64a'
    case 'blue':
      return '#4b8cff'
    case 'red':
      return '#ff5d5d'
    case 'black':
      return '#333333'
    default:
      return '#d9d9d9'
  }
})

function heal(color) {
  selectedBandage.value = color
  phase.value = 'healing'

  setTimeout(() => {
    phase.value = 'flying'
  }, 1200)

  setTimeout(() => {
    phase.value = 'returned'
  }, 3200)
}

function resetStory() {
  selectedBandage.value = null
  phase.value = 'injured'
}
</script>

<template>
  <div class="board" :data-theme="selectedBandage || 'default'">
    <div class="paper">
      <div class="hero">
        <div class="hero-text">
          <span class="badge">🐦‍⬛ Economist Magpie</span>
          <h1>은혜 갚는 까치</h1>
          <p>
            흥부를 도왔던 까치는 오늘도 누군가의 도움을 기다립니다. 다친 까치를 치료하면, 까치는
            세상의 중요한 소식을 물어다 줍니다.
          </p>
        </div>

        <div class="scene-wrap">
          <div class="scene">
            <div class="nest">🪹</div>

            <div class="magpie" :class="phase">
              <div class="bird">
                <svg viewBox="0 0 160 170" class="magpie-svg">
                  <g class="magpie-body-group">
                    <g class="cough-wrap">
                      <path
                        class="tail"
                        d="M100 96 L134 118 L120 122 L128 136 L112 128 L104 112 Z"
                        fill="url(#magpieTailGrad)"
                      />

                      <ellipse cx="80" cy="112" rx="32" ry="26" fill="var(--magpie-black)" />

                      <ellipse cx="72" cy="120" rx="16" ry="13" fill="var(--magpie-white)" />

                      <circle cx="54" cy="90" r="19" fill="var(--magpie-black)" />

                      <path
                        v-if="phase === 'injured'"
                        d="M68 129 L60 146 M78 129 L86 146"
                        stroke="#1b1c1f"
                        stroke-width="3"
                        stroke-linecap="round"
                        class="leg-broken"
                      />

                      <g v-else class="leg-healed">
                        <path
                          d="M68 129 L70 138 L68 145"
                          stroke="#1b1c1f"
                          stroke-width="3"
                          stroke-linecap="round"
                        />
                        <path
                          d="M78 129 L76 138 L80 145"
                          stroke="#1b1c1f"
                          stroke-width="3"
                          stroke-linecap="round"
                        />
                        <path
                          d="M60 136 L86 136"
                          stroke="var(--magpie-white)"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          opacity="0.9"
                        />
                      </g>

                      <g
                        v-if="selectedBandage"
                        class="bandage-wrap"
                        :style="{ '--bandage-color': bandageColor }"
                      >
                        <path
                          d="M66 122 L80 122 L80 148 L66 148 Z"
                          fill="var(--bandage-color)"
                          opacity="0.9"
                        />
                        <path
                          d="M69 126 L77 126 M69 132 L77 132 M69 138 L77 138 M69 144 L77 144"
                          stroke="rgba(255,255,255,0.38)"
                          stroke-width="1.6"
                          stroke-linecap="round"
                        />
                      </g>

                      <polygon points="38,90 28,88 38,96" fill="#f4b942" />

                      <circle cx="52" cy="86" r="3" fill="var(--magpie-white)" />
                    </g>
                  </g>

                  <defs>
                    <linearGradient id="magpieTailGrad">
                      <stop offset="0%" stop-color="var(--magpie-teal)" />
                      <stop offset="55%" stop-color="var(--magpie-blue)" />
                      <stop offset="100%" stop-color="var(--magpie-violet)" />
                    </linearGradient>
                  </defs>
                </svg>

                <span v-if="phase === 'returned'" class="newspaper">📰</span>
              </div>
            </div>
          </div>

          <Transition name="bubble">
            <div v-if="phase === 'injured'" class="speech">도와주세요…</div>
          </Transition>

          <Transition name="bubble">
            <div v-if="phase === 'healing'" class="speech success">
              고마워요! 다시 날 수 있을 것 같아요.
            </div>
          </Transition>

          <Transition name="bubble">
            <div v-if="phase === 'returned'" class="speech returned">
              {{ currentArticle?.emoji }} {{ currentArticle?.category }} 소식을 가져왔어요!
            </div>
          </Transition>
        </div>
      </div>

      <div v-if="phase === 'injured'" class="selector">
        <h2>어떤 붕대로 치료할까요?</h2>

        <div class="bandage-grid">
          <button class="bandage-btn yellow" @click="heal('yellow')">
            <span class="emoji">🟡</span>
            <strong>노랑 붕대</strong>
          </button>

          <button class="bandage-btn blue" @click="heal('blue')">
            <span class="emoji">🔵</span>
            <strong>파랑 붕대</strong>
          </button>

          <button class="bandage-btn red" @click="heal('red')">
            <span class="emoji">🔴</span>
            <strong>빨강 붕대</strong>
          </button>

          <button class="bandage-btn black" @click="heal('black')">
            <span class="emoji">⚫</span>
            <strong>검정 붕대</strong>
          </button>
        </div>
      </div>

      <Transition name="card">
        <section v-if="phase === 'returned' && currentArticle" class="article-card">
          <div class="article-header">
            <div>
              <span class="source">📰 The Economist</span>
              <h2>{{ currentArticle.title }}</h2>
            </div>

            <div class="chip">{{ currentArticle.emoji }} {{ currentArticle.category }}</div>
          </div>

          <div class="section">
            <h3>요약</h3>
            <p>{{ currentArticle.summary }}</p>
          </div>

          <div class="section">
            <h3>Vocabulary</h3>

            <div class="vocab-grid">
              <div v-for="item in currentArticle.words" :key="item.word" class="vocab-item">
                <strong>{{ item.word }}</strong>
                <span>{{ item.meaning }}</span>
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="reset" @click="resetStory">🔁 다시 치료하기</button>
          </div>
        </section>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.board {
  min-height: 100vh;
  padding: 32px 16px 56px;
  background: var(--color-background);
  color: var(--color-text);
  transition: background 0.4s ease;
}

.board[data-theme='yellow'] {
  background:
    radial-gradient(circle at top, rgba(244, 185, 66, 0.12), transparent 45%),
    var(--color-background);
}

.board[data-theme='blue'] {
  background:
    radial-gradient(circle at top, rgba(46, 134, 222, 0.14), transparent 45%),
    var(--color-background);
}

.board[data-theme='red'] {
  background:
    radial-gradient(circle at top, rgba(239, 91, 91, 0.14), transparent 45%),
    var(--color-background);
}

.board[data-theme='black'] {
  background:
    radial-gradient(circle at top, rgba(124, 92, 255, 0.14), transparent 45%),
    var(--color-background);
}

.paper {
  position: relative;
  max-width: 1040px;
  margin: 0 auto;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.paper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--magpie-gradient);
}

.hero {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
  padding: 36px;
}

.hero-text h1 {
  margin: 14px 0 10px;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.05;
  color: var(--color-heading);
}

.hero-text p {
  color: var(--color-text);
  opacity: 0.85;
  line-height: 1.8;
  max-width: 560px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--magpie-accent-soft);
  color: var(--magpie-accent);
  font-size: 0.84rem;
  font-weight: 700;
}

.scene-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}

.scene {
  position: relative;
  width: 100%;
  max-width: 360px;
  height: 260px;
  border-radius: 24px;
  background: var(--color-background-mute);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.nest {
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  font-size: 4rem;
  filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.12));
}

.magpie {
  position: absolute;
  left: 50%;
  bottom: 86px;
  transform: translateX(-50%);
  z-index: 2;
}

.bird {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 180px;
  filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.18));
}

.magpie-svg {
  display: block;
  width: 180px;
  height: 180px;
}

.leg-broken {
  opacity: 1;
}

.leg-healed {
  transition: all 0.25s ease;
}

.bandage-wrap {
  transform-origin: center;
  animation: bandageTie 0.45s ease-out;
}

@keyframes bandageTie {
  0% {
    transform: scaleY(0.4) translateY(8px);
    opacity: 0;
  }
  100% {
    transform: scaleY(1) translateY(0);
    opacity: 1;
  }
}

.newspaper {
  position: absolute;
  left: -14px;
  top: 34px;
  font-size: 1.7rem;
  animation: paperSwing 1.1s ease-in-out infinite alternate;
}

.magpie.injured {
  animation: shiver 0.45s ease-in-out infinite;
}

.magpie.healing {
  animation: healBounce 0.9s ease-in-out infinite;
}

.magpie.flying {
  animation: flyAway 1.8s ease-in forwards;
}

.magpie.returned {
  animation: land 0.9s ease-out;
}

@keyframes shiver {
  0%,
  100% {
    transform: translateX(-50%) translateX(0);
  }
  25% {
    transform: translateX(-50%) translateX(-2px);
  }
  75% {
    transform: translateX(-50%) translateX(2px);
  }
}

@keyframes healBounce {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-10px);
  }
}

@keyframes flyAway {
  0% {
    transform: translateX(-50%) translate(0, 0) scale(1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translate(180px, -160px) scale(0.68) rotate(-14deg);
    opacity: 0;
  }
}

@keyframes land {
  0% {
    transform: translateX(-50%) translateY(-28px) scale(1.08);
    opacity: 0;
  }
  60% {
    transform: translateX(-50%) translateY(4px) scale(0.98);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes paperSwing {
  from {
    transform: rotate(-8deg);
  }
  to {
    transform: rotate(8deg);
  }
}

.speech {
  position: absolute;
  top: 18px;
  right: 10px;
  max-width: 220px;
  padding: 12px 14px;
  border-radius: 18px 18px 4px 18px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--color-text);
}

.speech.success {
  background: var(--magpie-accent-soft);
  border-color: var(--magpie-accent-strong);
}

.speech.returned {
  background: var(--color-background-mute);
}

.bubble-enter-active,
.bubble-leave-active {
  transition: all 0.28s ease;
}

.bubble-enter-from,
.bubble-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.selector {
  padding: 0 36px 36px;
}

.selector h2 {
  margin: 0 0 18px;
  font-size: 1.15rem;
  color: var(--color-heading);
}

.bandage-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.bandage-btn {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 14px;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-heading);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  text-align: left;
}

.bandage-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

.bandage-btn .emoji {
  font-size: 1.6rem;
}

.bandage-btn small {
  color: var(--color-text);
  opacity: 0.7;
}

.bandage-btn.yellow:hover {
  border-color: #f4b942;
}
.bandage-btn.blue:hover {
  border-color: var(--magpie-blue);
}
.bandage-btn.red:hover {
  border-color: #ef4444;
}
.bandage-btn.black:hover {
  border-color: rgba(255, 255, 255, 0.5);
}

.article-card {
  position: relative;
  margin: 0 24px 28px;
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.25);
}

.article-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.source {
  display: inline-block;
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--magpie-accent);
  margin-bottom: 8px;
}

.article-header h2 {
  margin: 0;
  font-size: clamp(1.4rem, 3vw, 2rem);
  line-height: 1.2;
  color: var(--color-heading);
}

.chip {
  white-space: nowrap;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--magpie-accent-soft);
  color: var(--magpie-accent);
  font-weight: 700;
  font-size: 0.9rem;
}

.section {
  padding-top: 18px;
  border-top: 1px dashed var(--color-border);
  margin-top: 18px;
}

.section h3 {
  margin: 0 0 10px;
  font-size: 1rem;
  color: var(--color-heading);
}

.section p {
  margin: 0;
  line-height: 1.8;
  color: var(--color-text);
  opacity: 0.9;
}

.vocab-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.vocab-item {
  padding: 14px;
  border-radius: 14px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vocab-item strong {
  color: var(--color-heading);
}

.vocab-item span {
  color: var(--color-text);
  opacity: 0.7;
}

.actions {
  display: flex;
  justify-content: center;
  margin-top: 26px;
}

.reset {
  border: none;
  border-radius: 999px;
  padding: 12px 20px;
  background: var(--magpie-gradient);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 16px var(--magpie-accent-strong);
}

.reset:hover {
  filter: brightness(1.08);
}

.card-enter-active,
.card-leave-active {
  transition: all 0.36s ease;
}

.card-enter-from,
.card-leave-to {
  opacity: 0;
  transform: translateY(18px);
}

@media (max-width: 860px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .bandage-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .article-header {
    flex-direction: column;
  }
}

@media (max-width: 520px) {
  .board {
    padding: 18px 10px 36px;
  }

  .paper {
    border-radius: 22px;
  }

  .hero,
  .selector {
    padding: 22px;
  }

  .article-card {
    margin: 0 14px 18px;
    padding: 20px;
  }

  .bandage-grid,
  .vocab-grid {
    grid-template-columns: 1fr;
  }
}
</style>
