<script setup>
import { useRouter } from 'vue-router'
import { link } from '../routes'

const router = useRouter()

function goHome() {
  router.push(link('home'))
}
</script>

<template>
  <div class="not-found">
    <div class="not-found__card">
      <p class="not-found__icons">
        <i class="fa-solid fa-sun"></i><i class="fa-solid fa-circle-question"></i>
      </p>
      <h2 class="not-found__title">페이지를 찾을 수 없습니다.</h2>
      <p class="not-found__desc">요청하신 주소가 존재하지 않거나,<br />아직 개발되지 않았습니다.</p>
      <button class="not-found__home-btn" @click="goHome">날씨 메인으로 이동</button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  padding: 60px 16px;
}

.not-found__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 360px;
  padding: 32px 24px;
  text-align: center;
  background: var(--color-card-background);
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-card);
}

.not-found__icons {
  margin: 0;
  font-size: 40px;
  color: var(--color-primary-darker);
}

.not-found__title {
  margin: 4px 0 0;
  font-size: 18px;
  color: var(--color-text);
}

.not-found__desc {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.not-found__home-btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--border-radius-medium);
  background: var(--color-primary-darker);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.not-found__home-btn:hover {
  filter: brightness(1.08);
}
</style>
