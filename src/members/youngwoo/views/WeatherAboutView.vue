<script setup>
import { useRouter } from 'vue-router'
import { link } from '../routes'

const router = useRouter()

function goHome() {
  router.push(link('home'))
}
</script>

<template>
  <div class="weather-about">
    <h2 class="weather-about__title"><i class="fa-solid fa-circle-info"></i> 서비스 소개</h2>

    <div class="weather-about__card">
      <p class="weather-about__lead">
        전 세계 주요 도시의 날씨를 한눈에 확인할 수 있는 날씨 대시보드 서비스입니다.
      </p>
      <ul class="weather-about__list">
        <li>국내외 주요 도시의 실시간 기온과 날씨 현황을 제공합니다.</li>
        <li>지도에서 도시 위치와 날씨 정보를 함께 확인할 수 있습니다.</li>
        <li>도시명 검색과 날씨 상태 필터로 원하는 도시를 빠르게 찾을 수 있습니다.</li>
        <li>도시별 상세 페이지에서 체감온도, 습도, 풍속 정보를 확인할 수 있습니다.</li>
      </ul>
      <button class="weather-about__home-btn" @click="goHome">대시보드 홈으로 이동</button>
    </div>
  </div>
</template>

<style scoped>
.weather-about {
  max-width: 480px;
  margin: 12px auto 32px;
  padding: 0 16px;
}

.weather-about__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px;
  font-size: 20px;
  color: var(--color-text);
}

.weather-about__title i {
  color: var(--color-primary-darker);
}

.weather-about__card {
  background: var(--color-card-background);
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-large);
  padding: 20px 22px;
  box-shadow: var(--shadow-card);
}

.weather-about__lead {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.weather-about__list {
  margin: 0 0 18px;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.weather-about__home-btn {
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-radius: var(--border-radius-medium);
  background: var(--color-primary-darker);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.weather-about__home-btn:hover {
  filter: brightness(1.08);
}
</style>
