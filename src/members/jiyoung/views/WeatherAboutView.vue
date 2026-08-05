<script setup>
import { link } from '../routes'
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="about-wrapper">
    <h2>💜 날씨 대시보드 소개</h2>
    <p>이 앱은 SKALA 4기 Vue.js 실습용으로 만든 날씨 정보 대시보드입니다.</p>
    <p>도시를 검색하고, 카드를 클릭해서 상세 정보를 확인할 수 있어요.</p>
    <button @click="router.push(link('home'))">메인 대시보드로 돌아가기</button>
  </div>
</template>

<style scoped>
.about-wrapper {
  max-width: 400px;
  margin: 40px auto;
  padding: 24px;
  background: white;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 4px 14px rgba(108, 74, 182, 0.1);
}
h2 {
  color: #6c4ab6;
}
button {
  margin-top: 16px;
  padding: 8px 16px;
  border: none;
  border-radius: 999px;
  background: #6c4ab6;
  color: white;
  font-weight: bold;
  cursor: pointer;
}
</style>
