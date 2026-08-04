<template>
  <div class="base-dashboard-card">
    <slot></slot>
  </div>
</template>

<style scoped>
/*
 * 껍데기는 색을 거의 쓰지 않는다. 안에 들어올 내용이 주인공이기 때문.
 * 카드 사이 간격은 카드가 아니라 부모가 정한다(grid gap).
 * 카드가 스스로 아래 여백을 밀면 마지막 카드 밑에도 남아 버린다.
 */
.base-dashboard-card {
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
}
</style>
