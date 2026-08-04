<script setup>
defineProps({
  searchQuery: {
    type: String,
    required: true,
  },
  statusFilter: {
    type: String,
    default: '전체',
  },
  statusOptions: {
    type: Array,
    default: () => ['전체'],
  },
  region: {
    type: String,
    default: 'domestic',
  },
})

const emit = defineEmits(['update-query', 'update-status', 'update-region', 'search-enter'])

function onSearchInput(e) {
  emit('update-query', e.target.value)
}
</script>

<template>
  <div class="search-bar">
    <div class="search-bar__region">
      <span
        class="search-bar__region-indicator"
        :class="{ 'is-international': region === 'international' }"
      ></span>
      <button
        type="button"
        class="search-bar__region-btn"
        :class="{ 'is-active': region === 'domestic' }"
        @click="emit('update-region', 'domestic')"
      >
        <i class="fa-solid fa-house"></i> 국내
      </button>
      <button
        type="button"
        class="search-bar__region-btn"
        :class="{ 'is-active': region === 'international' }"
        @click="emit('update-region', 'international')"
      >
        <i class="fa-solid fa-plane-departure"></i> 해외
      </button>
    </div>

    <div class="search-bar__field">
      <i class="fa-solid fa-magnifying-glass search-bar__icon"></i>
      <input
        type="text"
        placeholder="검색할 도시 이름 입력 (예: 서울, 부산)"
        :value="searchQuery"
        @input="onSearchInput"
        @keyup.enter="emit('search-enter')"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="search-bar__clear-btn"
        aria-label="검색어 지우기"
        @click="emit('update-query', '')"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <p class="search-bar__hint">
      검색 중인 도시: <strong>{{ searchQuery || '전체' }}</strong>
    </p>

    <div class="search-bar__filters">
      <button
        v-for="option in statusOptions"
        :key="option"
        type="button"
        class="search-bar__chip"
        :class="{ 'is-active': option === statusFilter }"
        @click="emit('update-status', option)"
      >
        {{ option }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-bar__region {
  position: relative;
  display: flex;
  height: 42px;
  padding: 3px;
  box-sizing: border-box;
  background: var(--color-primary-opacity-10);
  border: 1px solid var(--border-color-default);
  border-radius: 999px;
}

.search-bar__region-indicator {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc(50% - 3px);
  background: linear-gradient(135deg, var(--color-primary-darker), var(--color-primary));
  border-radius: 999px;
  transition: transform 0.25s ease;
}

.search-bar__region-indicator.is-international {
  transform: translateX(100%);
}

.search-bar__region-btn {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  padding: 0 10px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.2s ease;
}

.search-bar__region-btn i {
  transition: transform 0.2s ease;
}

.search-bar__region-btn:last-child:hover i {
  transform: translate(2px, -2px);
}

.search-bar__region-btn.is-active {
  color: #ffffff;
}

.search-bar__field {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 12px;
  box-sizing: border-box;
  background: var(--color-primary-opacity-10);
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-medium);
  transition: border-color 0.15s ease;
}

.search-bar__field:focus-within {
  border-color: var(--color-primary-darker);
  background: var(--color-card-background);
}

.search-bar__icon {
  font-size: 13px;
  color: var(--color-text-light);
}

.search-bar__field input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--color-text);
}

.search-bar__clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-light);
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.search-bar__clear-btn:hover {
  background: var(--color-primary-opacity-10);
  color: var(--color-text);
}

.search-bar__hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.search-bar__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
}

.search-bar__chip {
  padding: 4px 12px;
  border: 1px solid var(--border-color-default);
  border-radius: 999px;
  background: var(--color-card-background);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.search-bar__chip:hover {
  border-color: var(--color-primary-darker);
  color: var(--color-primary-darker);
}

.search-bar__chip.is-active {
  background: var(--color-primary-darker);
  border-color: var(--color-primary-darker);
  color: #ffffff;
}
</style>
