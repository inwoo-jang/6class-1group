<script setup>
// 성공·오류 메시지를 같은 디자인으로 보여주는 작은 재사용 컴포넌트입니다.
defineProps({
  type: {
    type: String,
    default: 'info',
  },
  message: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="status-banner" :class="`status-banner--${type}`" role="status">
    <span class="status-banner__dot" aria-hidden="true"></span>
    <span>{{ message }}</span>
  </div>
</template>

