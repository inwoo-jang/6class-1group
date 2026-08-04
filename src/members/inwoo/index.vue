<script setup>
/**
 * 예시 — 이 자리에 각자의 결과물 컴포넌트를 넣는다.
 *
 * 규칙은 두 개뿐이다.
 *   1) <style> 에는 반드시 scoped 를 붙인다
 *   2) body · * 같은 전역 선택자는 쓰지 않는다
 * 그러지 않으면 다른 사람 화면까지 같이 깨진다.
 */
const HIGHLIGHTS = [
  ['전국 45곳', '실시간 날씨를 한 번의 요청으로'],
  ['지역 · 날씨별', '같은 데이터를 두 가지 방식으로'],
  ['시간별 예보', '과거 90일 ~ 미래 14일'],
  ['날씨 배경', '비 · 눈 · 안개 · 번개 애니메이션'],
]
</script>

<template>
  <div class="work page">
    <p class="eyebrow">SAMPLE</p>
    <h3>Vue Learning Lab</h3>
    <p class="desc">
      수업의 코드 챌린지 · 실습 · 제출 과제를 한곳에서 보는 학습 사이트와, 그 안에서 완성한 실시간
      날씨 대시보드입니다.
    </p>

    <ul class="highlights">
      <li v-for="[title, note] in HIGHLIGHTS" :key="title">
        <b>{{ title }}</b>
        <span>{{ note }}</span>
      </li>
    </ul>

    <p class="note">
      실제로는 이 자리에 컴포넌트를 그대로 넣으면 됩니다. 위 <b>따로 배포한 사이트</b> 링크로도 볼
      수 있습니다.
    </p>
  </div>
</template>

<style scoped>
.work {
  padding-top: 8px;
}

h3 {
  margin: 16px 0 0;
  font-size: clamp(28px, 4.6vw, 52px);
  font-weight: 400;
  letter-spacing: -0.035em;
}

.desc {
  max-width: 52ch;
  margin: 20px 0 0;
  color: var(--muted);
  font-size: 14.5px;
  line-height: 1.85;
}

.highlights {
  display: grid;
  gap: 0;
  margin: 46px 0 0;
  padding: 0;
  border-top: 1px solid var(--line);
  list-style: none;
}

.highlights li {
  display: grid;
  grid-template-columns: minmax(0, 200px) minmax(0, 1fr);
  gap: 20px;
  align-items: baseline;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}

.highlights b {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.highlights span {
  color: var(--muted);
  font-size: 13.5px;
}

.note {
  margin: 40px 0 0;
  color: var(--faint);
  font-size: 12.5px;
}

@media (max-width: 640px) {
  .highlights li {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
