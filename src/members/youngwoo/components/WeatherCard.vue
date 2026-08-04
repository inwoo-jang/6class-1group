<script setup>
import { computed } from 'vue'
import { useDisplayTemp } from '../composables/useDisplayTemp'

const props = defineProps({
  city: {
    type: Object,
    required: true,
  },
  isFocused: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-card', 'click-detail'])

// "더움/선선함" 판정은 표시 단위와 무관하게 원본(섭씨) 값 기준으로 유지한다.
const isWarm = computed(() => props.city.temp >= 25)
const { unitSymbol, displayTemp } = useDisplayTemp(() => props.city.temp)
</script>

<template>
  <li
    class="weather-card"
    :class="{ 'is-focused': isFocused }"
    @click="emit('select-card', city.id)"
  >
    <div class="weather-card__header">
      <i class="weather-card__icon" :class="city.icon"></i>
      <div class="weather-card__name-block">
        <p class="weather-card__name">{{ city.name }}</p>
        <p class="weather-card__status">{{ city.status }}</p>
      </div>

      <div class="weather-card__temp-block" :class="isWarm ? 'is-warm' : 'is-cool'">
        <span class="weather-card__temp-value">{{ displayTemp }}{{ unitSymbol }}</span>
        <span class="weather-card__temp-label">{{
          isWarm ? '더움 (25도 이상)' : '선선함 (25도 미만)'
        }}</span>
      </div>
    </div>

    <button
      class="weather-card__detail-btn"
      title="상세보기"
      aria-label="상세보기"
      @click.stop="emit('click-detail', city.id)"
    >
      <i class="fa-solid fa-circle-info"></i>
    </button>
  </li>
</template>

<style scoped>
.weather-card {
  position: relative;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  padding-right: 78px;
  border: 1px solid var(--border-color-default);
  border-radius: var(--border-radius-large);
  cursor: pointer;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease,
    border-color 0.15s ease;
}

.weather-card:hover {
  border-color: var(--color-primary-darker);
  box-shadow: var(--shadow-hover);
  transform: translateY(-1px);
}

.weather-card.is-focused {
  border-color: var(--color-primary-darker);
  border-width: 2px;
  box-shadow:
    0 0 0 2px var(--color-primary-opacity-30),
    var(--shadow-hover);
}

/* 우측 탭이 카드 테두리 위에 겹쳐 앉아 있어서, 카드 테두리만 하이라이트되고
   탭은 그대로면 그 구간만 하이라이트가 끊겨 보인다. 카드와 같이 반응시킨다. */
.weather-card:hover .weather-card__detail-btn {
  border-color: var(--color-primary-darker);
}

.weather-card.is-focused .weather-card__detail-btn {
  top: -2px;
  right: -2px;
  bottom: -2px;
  border-color: var(--color-primary-darker);
  border-width: 2px;
}

/* 열차표 절취선 느낌 — 탭 경계(점선)의 위/아래 카드 테두리에 펀치홀을 낸다.
   실제 종이에 뚫은 구멍처럼, 카드 "바깥쪽"은 아무것도 없고 카드 "안쪽"으로만
   반원이 파여 보여야 한다. 그래서 완전한 원이 아니라 반원(카드 경계선에 붙는
   쪽은 각지고, 안쪽으로 파고드는 쪽만 둥근 half-height 박스)으로 만든다.
   탭(button)보다 위에 그려야 해서 z-index를 준다. */
.weather-card::before,
.weather-card::after {
  content: '';
  position: absolute;
  right: 44px;
  width: 10px;
  height: 5px;
  background: var(--color-card-background);
  border: 1px solid var(--border-color-default);
  z-index: 1;
  pointer-events: none;
  transition: border-color 0.15s ease;
}

.weather-card::before {
  top: -1px;
  border-top: none;
  border-radius: 0 0 5px 5px;
}

.weather-card::after {
  bottom: -1px;
  border-bottom: none;
  border-radius: 5px 5px 0 0;
}

.weather-card:hover::before,
.weather-card:hover::after,
.weather-card.is-focused::before,
.weather-card.is-focused::after {
  border-color: var(--color-primary-darker);
}

.weather-card.is-focused::before,
.weather-card.is-focused::after {
  border-width: 2px;
}

.weather-card.is-focused::before {
  top: -2px;
}

.weather-card.is-focused::after {
  bottom: -2px;
}

/* 이모지 <-> 지명 <-> 온도 <-> 절취선, 네 구간 간격을 완전히 동일하게 고정하는 건
   카드 폭이 그리드에 따라 늘어나는 반응형 레이아웃이라 불가능하다(아이콘을 왼쪽에
   고정하면서 동시에 오른쪽 절취선까지 딱 맞아떨어지게 하려면 카드 폭이 고정이어야 함).
   대신 아이콘은 왼쪽에 고정해 두고(justify-content:space-between), 아이콘↔이름 /
   이름↔온도 이 두 간격만 서로 똑같이 벌어지게 한다. 온도↔절취선은 padding-right로
   따로 고정한 값(약 13px)이라 완전히 같지는 않지만 비슷한 폭으로 맞춰 둔다. */
.weather-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.weather-card__icon {
  align-self: center;
  font-size: 20px;
  color: var(--color-primary);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.weather-card__name-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  line-height: 1;
}

.weather-card__name {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weather-card__status {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.weather-card__temp-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  line-height: 1;
}

.weather-card__temp-value {
  font-size: 22px;
  font-weight: 800;
}

.weather-card__temp-label {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.weather-card__temp-block.is-warm {
  color: var(--color-warm);
}

.weather-card__temp-block.is-cool {
  color: var(--color-info);
}

/* 카드 오른쪽 가장자리에 세로로 카드 높이를 꽉 채우는 탭. 카드 테두리선(top/right/bottom)에
   겹쳐서 그 구간의 카드 모서리를 그대로 이어받는다 — 카드 바깥으로 튀어나오는 버튼이 아니라
   카드 자체의 일부(오른쪽 여백 칸)처럼 핏하게. 본문(header)은 padding-right로 이 폭만큼 비켜난다. */
.weather-card__detail-btn {
  position: absolute;
  top: -1px;
  right: -1px;
  bottom: -1px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  border: 1px solid var(--border-color-default);
  border-left-style: dashed;
  border-top-right-radius: var(--border-radius-large);
  border-bottom-right-radius: var(--border-radius-large);
  background: var(--color-card-background);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.weather-card__detail-btn:hover {
  background: var(--color-primary-darker);
  border-color: var(--color-primary-darker);
  color: #ffffff;
}
</style>
