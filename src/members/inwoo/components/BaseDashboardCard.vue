<template>
  <div class="base-dashboard-card">
    <slot></slot>
  </div>
</template>

<style scoped>
/*
 * 껍데기는 색을 거의 쓰지 않는다. 안에 들어올 내용이 주인공이기 때문.
 *
 * 배경의 하늘이 비쳐 보이도록 반투명하게 깐다 (--panel 은 index.vue 에서 온다).
 * 그냥 투명하게만 두면 뒤의 구름·빗줄기와 글자가 겹쳐 읽기 어려워지므로,
 * blur 로 뒤를 흐려 글자가 놓일 자리를 만들어 준다.
 */
.base-dashboard-card {
  padding: 22px;
  margin-bottom: 14px;
  border: 1px solid var(--panel-line, var(--line));
  border-radius: 14px;
  background: var(--panel, var(--surface));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
</style>
