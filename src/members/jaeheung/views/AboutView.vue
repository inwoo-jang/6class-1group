<script setup>
import { link } from '../routes'
</script>

<template>
  <div class="card-panel">
    <p class="panel-title">ℹ️ 날씨 대시보드 소개</p>

    <p class="lead">
      Axios + OpenWeatherMap으로 만든 미니 날씨 대시보드입니다.
      단위 설정(섭씨/화씨)이 대시보드와 상세 페이지에 함께 반영됩니다.
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
      <li>📡 <strong>상세 페이지</strong> — 카드의 "상세보기"를 누르면 해당 도시의 상세 관측 정보를
        보여줍니다.</li>
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
  background: var(--magpie-strip);
}
.panel-title {
  font-size: 17px;
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
.back-btn {
  display: block;
  width: 100%;
  text-align: center;
  text-decoration: none;
  background: var(--magpie-gradient);
  color: var(--magpie-on-accent);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  font-weight: 700;
  box-sizing: border-box;
}
.back-btn:hover {
  filter: brightness(1.08);
}
</style>
