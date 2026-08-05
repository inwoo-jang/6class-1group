<script setup>
import { link } from '../routes'
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="notfound-wrapper">
    <h2>😭 404</h2>
    <p>요청하신 페이지를 찾을 수 없습니다.</p>
    <button @click="router.push(link('home'))">메인으로 돌아가기</button>
  </div>
</template>

<style scoped>
.notfound-wrapper {
  max-width: 400px;
  margin: 60px auto;
  padding: 24px;
  background: white;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 4px 14px rgba(108, 74, 182, 0.1);
}
h2 {
  font-size: 40px;
  color: #6c4ab6;
  margin-bottom: 10px;
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
