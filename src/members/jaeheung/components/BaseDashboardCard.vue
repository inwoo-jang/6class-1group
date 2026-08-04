<script setup>
defineProps({
  title: { type: String, default: '' },
})
</script>

<template>
  <div class="section">
    <p v-if="title" class="section-title">{{ title }}</p>
    <slot></slot>
  </div>
</template>

<style scoped>
/*
 * 예전에는 이 자리가 회색으로 채운 상자였다. 바깥 패널도 회색이라
 * 상자 안에 상자가 겹쳐 보였고, 그만큼 안쪽이 좁아 답답했다.
 * 채우는 대신 가는 선 하나로 나눈다.
 */
.section {
  padding: 20px 0 4px;
  border-top: 1px solid var(--color-border);
  margin-top: 4px;
}
.section:first-of-type {
  border-top: 0;
  margin-top: 0;
}
.section-title {
  margin: 0 0 12px;
  color: var(--color-text);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
</style>
