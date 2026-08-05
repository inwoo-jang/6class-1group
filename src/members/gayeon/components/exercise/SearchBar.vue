<script setup>
defineProps({
  currentQuery: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update-query'])

const onSearchInput = (event) => {
  emit('update-query', event.target.value)
}
</script>

<template>
  <div>
    <h3 class="panel-title"><i class="fa-solid fa-magnifying-glass"></i> 도시 검색</h3>
    <div class="search-wrap">
      <i class="fa-solid fa-magnifying-glass search-icon"></i>
      <input
        type="text"
        class="search-input"
        placeholder="검색할 도시 이름 입력"
        :value="currentQuery"
        @input="onSearchInput"
      />
    </div>
    <p class="search-echo">
      검색 중인 도시:
      <strong v-if="currentQuery">{{ currentQuery }}</strong>
      <span v-else class="placeholder-text">아직 입력하지 않았어요</span>
    </p>
  </div>
</template>

<style scoped>
.panel-title {
  margin: 0 0 14px 0;
  font-family: 'Jua', 'Pretendard', sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: #45415f;
}
.panel-title i {
  margin-right: 6px;
}
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 16px;
  font-size: 14px;
  color: #c7c2de;
}
.search-input {
  width: 100%;
  padding: 13px 16px 13px 42px;
  border: 2px solid #f1ecff;
  border-radius: 999px;
  font-size: 14px;
  color: #45415f;
  background-color: #ffffff;
  box-sizing: border-box;
  transition: all 0.2s ease;
}
.search-input::placeholder {
  color: #c7c2de;
}
.search-input:focus {
  outline: none;
  border-color: #ff7faa;
  box-shadow: 0 0 0 4px rgba(255, 127, 170, 0.12);
}
.search-echo {
  margin: 12px 0 0 4px;
  font-size: 13px;
  color: #a6a0be;
}
.search-echo strong {
  color: #ff7faa;
}
.placeholder-text {
  color: #d5d1e6;
}
</style>
