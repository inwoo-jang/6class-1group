<script setup>
import UiIcon from './UiIcon.vue'

// 1. 상위로 입력 텍스트를 전달할 커스텀 이벤트 등록 (매크로)
defineEmits(['update-query'])

// 2. 상위로부터 현재 검색 상태 값을 수신 (한글 동기화 상태 유지용)
defineProps({
  currentQuery: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="search-inner">
    <h3>도시 검색</h3>

    <!-- 돋보기를 입력칸 안에 두어 제목을 깔끔하게 비운다 -->
    <div class="field">
      <UiIcon name="search" class="field-icon" />
      <input
        type="text"
        :value="currentQuery"
        placeholder="검색할 도시 이름 입력"
        @input="$emit('update-query', $event.target.value)"
      />
    </div>

    <p v-if="currentQuery" class="echo">
      검색 중인 도시: <strong>{{ currentQuery }}</strong>
    </p>
  </div>
</template>

<style scoped>
.search-inner h3 {
  margin: 0 0 14px;
  color: var(--ink);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* 아이콘을 겹쳐 놓기 위한 기준점 */
.field {
  position: relative;
}

.field-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  color: var(--faint);
  transform: translateY(-50%);
  pointer-events: none;
  transition: color 0.15s ease;
}

.field:focus-within .field-icon {
  color: var(--accent);
}

.search-inner input {
  width: 100%;
  padding: 13px 16px 13px 42px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--ink);
  background: var(--paper);
  font: inherit;
  font-size: 15px;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.search-inner input::placeholder {
  color: var(--faint);
}

.search-inner input:focus {
  border-color: var(--accent);
  background: var(--surface);
  outline: none;
}

.echo {
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.search-inner strong {
  color: var(--accent);
  font-weight: 700;
}
</style>
