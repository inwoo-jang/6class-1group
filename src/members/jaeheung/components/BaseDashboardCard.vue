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
.section {
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 16px;
}
.section-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--color-heading);
  margin: 0 0 10px 0;
}
</style>
