<script setup>
defineProps({
  query: { type: String, default: '' },
})

const emit = defineEmits(['update-query'])

const onInput = (event) => {
  emit('update-query', event.target.value)
}
</script>

<template>
  <div class="search-bar">
    <input type="text" placeholder="검색할 도시 이름 입력" :value="query" @input="onInput" />
    <p class="search-status">
      검색 중인 도시: <b>{{ query || '(없음)' }}</b>
    </p>
  </div>
</template>

<style scoped>
input[type='text'] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: var(--color-background);
  color: var(--color-text);
  box-sizing: border-box;
}
input[type='text']:focus {
  border-color: var(--magpie-accent);
}
.search-status {
  margin-top: 8px;
  margin-bottom: 0;
  font-size: 13px;
  color: var(--color-text);
  opacity: 0.75;
}
.search-status b {
  color: var(--color-heading);
  opacity: 1;
}
</style>
