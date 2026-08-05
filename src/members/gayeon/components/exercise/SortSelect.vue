<script setup>
defineProps({
  currentSort: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update-sort'])

const onChange = (event) => {
  emit('update-sort', event.target.value)
}
</script>

<template>
  <div class="sort-wrap">
    <label class="sort-label" for="sort-select">정렬</label>
    <select id="sort-select" class="sort-select" :value="currentSort" @change="onChange">
      <option value="">기본순</option>
      <option value="temp-desc">기온 높은순</option>
      <option value="temp-asc">기온 낮은순</option>
      <option value="name-asc">이름순</option>
    </select>
  </div>
</template>

<style scoped>
.sort-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sort-label {
  font-size: 12px;
  font-weight: 700;
  color: #a6a0be;
}
.sort-select {
  padding: 8px 14px;
  border: 2px solid #f1ecff;
  border-radius: 999px;
  background-color: #ffffff;
  color: #45415f;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23a6a0be'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 30px;
  transition: all 0.2s ease;
}
.sort-select:focus {
  outline: none;
  border-color: #ff7faa;
}
</style>
