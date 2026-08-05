<script setup>
// 검색박스/리스트박스에 공통으로 적용되는 패널 디자인
// 실제 내용은 부모가 <slot>을 통해 주입
</script>

<template>
  <section class="panel">
    <slot></slot>
  </section>
</template>

<style scoped>
.panel {
  background-color: #fbfaff;
  border: 1px solid #f1ecff;
  border-radius: 20px;
  padding: 22px;
  margin-bottom: 18px;
}
</style>
