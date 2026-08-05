<script setup>
// 부모로부터 검색 도시 반응형 데이터를 전달받아 표시 (props)
defineProps({
  searchQuery: { type: String, default: '' },
})

// 도시 검색 시 update-query 이벤트를 발생하면서 검색어를 부모에게 전달 (emits)
const emit = defineEmits(['update-query'])
</script>

<template>
  <div class="search-bar">
    <input
      :value="searchQuery"
      @input="emit('update-query', $event.target.value)"
      placeholder="검색할 도시 이름을 입력해보세요"
    />
    <p v-if="searchQuery" class="search-status">
      검색 중인 도시: <strong>{{ searchQuery }}</strong>
    </p>
  </div>
</template>

<style scoped>
.search-bar input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2d6f7;
  border-radius: 14px;
  box-sizing: border-box;
  outline: none;
  font-size: 14px;
}
.search-bar input:focus {
  border-color: #a78bda;
}
.search-status {
  margin: 8px 0 0;
  font-size: 13px;
  color: #8a6fc7;
}
</style>