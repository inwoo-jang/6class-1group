<script setup>
import { RouterLink } from 'vue-router'
import { link } from '../routes'
</script>

<template>
  <div class="about">
    <h1 class="about-title"><i class="fa-solid fa-circle-info"></i> 서비스 소개</h1>
    <p class="about-desc">
      Open-Meteo API를 통해 대한민국 주요 도시의 실시간 날씨를 보여주는 개인 프로젝트예요. Vue 3
      Composition API, 컴포넌트 분리, Vue Router를 배우며 만들었습니다.
    </p>

    <ul class="about-list">
      <li><i class="fa-solid fa-check"></i> 실시간 기온 · 습도 · 날씨 상태 조회</li>
      <li><i class="fa-solid fa-check"></i> 지역별 · 날씨별 필터링과 정렬</li>
      <li><i class="fa-solid fa-check"></i> 즐겨찾기 및 내 위치 우선 표시</li>
      <li><i class="fa-solid fa-check"></i> 도시별 시간대별 상세 예보 페이지</li>
    </ul>

    <RouterLink :to="link('home')" class="back-btn">
      <i class="fa-solid fa-house"></i> 대시보드 홈으로 이동
    </RouterLink>
  </div>
</template>

<style scoped>
.about-title {
  margin: 0 0 16px 0;
  font-family: 'Jua', 'Pretendard', sans-serif;
  font-size: 22px;
  font-weight: 400;
  color: #45415f;
}
.about-desc {
  margin: 0 0 20px 0;
  font-size: 14px;
  line-height: 1.7;
  color: #7a7590;
}
.about-list {
  list-style: none;
  margin: 0 0 28px 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.about-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #fbfaff;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #45415f;
}
.about-list li i {
  color: #3fcb94;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 999px;
  background-color: #ff7faa;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.back-btn:hover {
  background-color: #ff5c8a;
}
</style>
