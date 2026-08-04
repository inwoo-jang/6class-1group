<template>
  <div class="base-dashboard-card">
    <slot></slot>
  </div>
</template>

<style scoped>
/* 껍데기는 색을 거의 쓰지 않는다. 안에 들어올 내용이 주인공이기 때문. */
.base-dashboard-card {
  padding: 22px;
  margin-bottom: 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
}
</style>
