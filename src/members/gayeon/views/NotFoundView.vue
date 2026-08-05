<script setup>
import { RouterLink } from 'vue-router'
import { link } from '../routes'
</script>

<template>
  <div class="not-found">
    <i class="fa-solid fa-compass not-found-icon"></i>
    <h1 class="not-found-title">페이지를 찾을 수 없어요</h1>
    <p class="not-found-desc">주소를 다시 확인하시거나, 아래 버튼으로 돌아가주세요.</p>
    <RouterLink :to="link('home')" class="back-btn">
      <i class="fa-solid fa-house"></i> 대시보드 홈으로 이동
    </RouterLink>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 40px 20px;
}
.not-found-icon {
  font-size: 48px;
  color: #c7c2de;
  margin-bottom: 16px;
}
.not-found-title {
  margin: 0 0 8px 0;
  font-family: 'Jua', 'Pretendard', sans-serif;
  font-size: 20px;
  color: #45415f;
}
.not-found-desc {
  margin: 0 0 24px 0;
  font-size: 13px;
  color: #a6a0be;
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
