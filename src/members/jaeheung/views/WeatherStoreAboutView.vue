<script setup>
/* ── [Store 실습 / 과제5] WeatherStoreAboutView.vue ── 서비스 소개용 정적 페이지 */
import { link } from '../routes'
</script>

<template>
  <div class="card-panel">
    <p class="panel-title">ℹ️ 날씨 대시보드 소개 (Store 적용)</p>

    <p class="lead">
      이 페이지는 Pinia Store + Axios 실습을 위해 만든 미니 날씨 대시보드입니다. 과제4(Router
      실습)의 기능을 그대로 이어받으면서, <code>stores/configStore.js</code>로 날씨 단위(섭씨/화씨)
      설정을 전역 상태로 관리하고, 날씨 데이터는 Axios로 OpenWeatherMap API를 호출해 가져옵니다
      (과제4는 Open-Meteo를 그대로 사용하며 서로 영향을 주지 않습니다).
    </p>

    <ul class="feature-list">
      <li>🌡️ <strong>단위 변경</strong> — 상단의 "단위변경" 버튼으로 섭씨/화씨를 전환하면
        메인 대시보드와 상세 페이지의 기온 표시가 함께 바뀝니다.</li>
      <li>🌐 <strong>Axios + OpenWeatherMap</strong> — 기본 도시 목록, 도시 검색/추가, 상세 조회까지
        전부 Axios로 OpenWeatherMap API를 호출합니다 (API 키 필요).</li>
      <li>🏠 <strong>홈</strong> — OpenWeatherMap 실시간 날씨로 도시 검색, 상태 필터, 정렬을 해볼 수
        있습니다.</li>
      <li>➕ <strong>도시 추가</strong> — 목록에 없는 도시도 이름으로 검색해 직접 추가할 수 있고,
        추가한 도시는 다음 방문에도 남아 있습니다.</li>
      <li>🗺️ <strong>지도</strong> — 카드 목록과 지도의 선택 상태가 서로 연동됩니다.</li>
      <li>📡 <strong>상세 페이지</strong> — 카드의 "상세보기"를 누르면
        <code>/weather-store/:cityId</code>로 이동해 해당 도시의 상세 관측 정보를 보여줍니다.</li>
      <li>🚧 <strong>404 페이지</strong> — 존재하지 않는 주소로 접근하면 Catch-all Route가 대신
        안내해 줍니다.</li>
    </ul>

    <RouterLink :to="link('home')" class="back-btn">← 메인 대시보드로 돌아가기</RouterLink>
  </div>
</template>

<style scoped>
.card-panel {
  position: relative;
  overflow: hidden;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  width: 100%;
  max-width: 640px;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 28px;
  font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  box-sizing: border-box;
}
.card-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--magpie-gradient);
}
.panel-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 16px 0;
}
.lead {
  color: var(--color-text);
  line-height: 1.7;
  margin-bottom: 20px;
}
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.feature-list li {
  background: var(--color-background-mute);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.6;
}
.feature-list strong {
  color: var(--magpie-accent);
}
.feature-list code {
  background: var(--color-border);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12.5px;
}
.back-btn {
  display: block;
  text-align: center;
  text-decoration: none;
  background: var(--magpie-gradient);
  color: #fff;
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  font-weight: 700;
}
.back-btn:hover {
  filter: brightness(1.08);
}
</style>
