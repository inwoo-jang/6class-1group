<script setup>
import { computed } from 'vue'
import WeatherIcon from './WeatherIcon.vue'
import UiIcon from './UiIcon.vue'

// 1. 상위로부터 단방향 주입받을 객체 데이터 규격 검수 (매크로)
const props = defineProps({
  cityItem: {
    type: Object,
    required: true,
  },
  /** 즐겨찾기로 별표를 쳤는지 — 기억하는 건 부모다 */
  favorite: { type: Boolean, default: false },
  /** 현재 위치에서 가장 가까운 도시인지 */
  here: { type: Boolean, default: false },
  /** 이 도시의 시간별 예보가 펼쳐져 있는지 */
  open: { type: Boolean, default: false },
  /** 지금 배경이 따라가는(=사용자가 고른) 도시인지 */
  selected: { type: Boolean, default: false },
  /** 오른쪽 버튼 문구. 과제 4에서는 '상세보기'로 쓴다 */
  detailLabel: { type: String, default: '시간별' },
  /**
   * 과제 5 — 화면에 찍을 기온과 단위 기호.
   * 넘기지 않으면 지금까지처럼 cityItem.temp 를 섭씨로 그대로 보여 준다.
   * 그래서 이 부품을 쓰는 다른 과제 화면은 하나도 바뀌지 않는다.
   */
  tempValue: { type: Number, default: null },
  tempUnit: { type: String, default: '°C' },
})

// 2. 상위로 송신할 두 가지 경로의 커스텀 이벤트 식별자 등록 (매크로)
const emit = defineEmits(['select-card', 'click-detail', 'toggle-favorite'])

/** 아이콘 받침 색조 — 컬러 아이콘이 흰 배경에 떠 보이지 않게 잡아 준다 */
const tone = computed(() => {
  const s = props.cityItem.status
  if (s.includes('맑')) return 'warm'
  if (s.includes('비') || s.includes('눈')) return 'cool'
  return 'neutral'
})

/**
 * 기온 구간 — 위에서부터 검사해 처음 걸리는 것을 쓴다.
 * 기준을 데이터로 빼 두면 나중에 구간을 바꿔도 여기 한 곳만 고치면 된다.
 */
const TEMP_BANDS = [
  { min: 30, key: 'scorching', label: '무더워요' },
  { min: 25, key: 'hot', label: '더워요' },
  { min: 20, key: 'mild', label: '선선해요' },
  { min: 10, key: 'cool', label: '쌀쌀해요' },
  { min: -Infinity, key: 'cold', label: '추워요' },
]

/** 습도 구간 */
const HUMIDITY_BANDS = [
  { min: 80, key: 'wet', label: '눅눅해요' },
  { min: 60, key: 'humid', label: '습해요' },
  { min: 40, key: 'nice', label: '쾌적해요' },
  { min: -Infinity, key: 'dry', label: '건조해요' },
]

const temp = computed(() => TEMP_BANDS.find((b) => props.cityItem.temp >= b.min))
const humidity = computed(() => HUMIDITY_BANDS.find((b) => props.cityItem.humidity >= b.min))
</script>

<template>
  <div
    class="weather-card"
    :class="{ here, open, selected }"
    :title="`두 번 누르면 ${cityItem.name} 상세로 갑니다`"
    @click="emit('select-card', cityItem.id)"
  >
    <!-- ① 날씨 — 하늘 상태 -->
    <div class="sky">
      <!-- 받은 status를 아이콘 컴포넌트에 그대로 넘긴다 (props 한 단계 더 내려감) -->
      <div class="icon-tile" :class="tone">
        <WeatherIcon :status="cityItem.status" :size="32" />
      </div>
      <div class="sky-text">
        <h4>
          {{ cityItem.name }}
          <!-- 현재 위치와 선택은 다른 것이므로 겹쳐도 둘 다 보여 준다 -->
          <span v-if="here" class="badge here-badge">
            <UiIcon name="location" :size="11" /> 현재 위치
          </span>
          <span v-if="selected" class="pick" title="배경이 이 지역을 따릅니다">
            <UiIcon name="check" :size="13" />
          </span>
          <span v-if="cityItem.demo" class="badge demo-badge">데모</span>
        </h4>
        <p class="status">{{ cityItem.status }}</p>
      </div>
    </div>

    <!-- ② 수치 — 기온과 습도를 한 덩어리로 묶는다 -->
    <div class="metrics">
      <p class="metric" :class="temp.key">
        <UiIcon name="thermometer" :size="15" />
        <b class="value">{{ tempValue ?? cityItem.temp }}<span class="unit">{{ tempUnit }}</span></b>
        <span class="band">{{ temp.label }}</span>
      </p>
      <p class="metric" :class="humidity.key">
        <UiIcon name="droplet" :size="15" />
        <b class="value">{{ cityItem.humidity }}<span class="unit">%</span></b>
        <span class="band">{{ humidity.label }}</span>
      </p>
    </div>

    <!-- 별표는 카드 클릭(선택)과 겹치지 않도록 .stop 을 붙인다 -->
    <button
      class="star"
      :class="{ on: favorite }"
      type="button"
      :aria-pressed="favorite"
      :title="favorite ? '즐겨찾기 해제' : '즐겨찾기에 추가'"
      @click.stop="emit('toggle-favorite', cityItem.id)"
    >
      <UiIcon name="star" :size="17" :filled="favorite" />
    </button>

    <button
      v-if="!cityItem.demo"
      class="btn-detail"
      :class="{ on: open }"
      :aria-expanded="open"
      @click.stop="emit('click-detail', cityItem.name, cityItem.status)"
    >
      {{ open ? '닫기' : detailLabel }}
    </button>
  </div>
</template>

<style scoped>
.weather-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 9px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.weather-card:hover {
  border-color: var(--accent-line);
  box-shadow: 0 5px 16px rgb(15 23 42 / 7%);
  transform: translateY(-2px);
}

/* 시간별 예보를 펼친 카드 */
.weather-card.open {
  border-color: var(--accent);
}

/* 현재 위치 — 초록 */
.weather-card.here {
  border-color: var(--accent);
  background: var(--accent-tint);
}

/* 선택된 곳 — 배경이 이 도시를 따라간다.
   테두리는 눈에 거슬리지 않게 연한 회색으로만 두고, 표시는 옆의 체크가 맡는다 */
.weather-card.selected {
  border-color: var(--line-strong);
  background: var(--paper);
}

.weather-card.selected.here {
  background: var(--accent-tint);
}

/* ── ① 날씨 ── */
.sky {
  display: flex;
  gap: 11px;
  align-items: center;
  min-width: 0;
}

.icon-tile {
  display: grid;
  width: 50px;
  height: 50px;
  border-radius: 16px;
  place-items: center;
  transition: transform 0.2s ease;
}

.weather-card:hover .icon-tile {
  transform: scale(1.06) rotate(-3deg);
}

.icon-tile.warm {
  background: #fdf2d5;
}

.icon-tile.cool {
  background: #e5eff9;
}

.icon-tile.neutral {
  background: #edf0f3;
}

.sky-text {
  min-width: 0;
}

.weather-card h4 {
  margin: 0 0 2px;
  color: var(--ink);
  font-size: 16.5px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.status {
  margin: 0;
  color: var(--muted);
  font-size: 12.5px;
}

/* ── ② 수치 ── */
.metrics {
  display: grid;
  gap: 4px;
}

.metric {
  display: grid;
  grid-template-columns: 15px auto auto;
  gap: 7px;
  align-items: center;
  margin: 0;
  padding: 4px 11px 4px 9px;
  border-radius: 999px;
}

.value {
  font-family: var(--font-mono);
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.unit {
  margin-left: 1px;
  font-size: 10.5px;
  font-weight: 500;
  opacity: 0.7;
}

.band {
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* 기온 — 더울수록 붉게, 추울수록 푸르게 */
.metric.scorching {
  color: #b03a1c;
  background: #fce6dc;
}

.metric.hot {
  color: #b8672a;
  background: #fdf0e0;
}

.metric.mild {
  color: #3f7d55;
  background: #e6f2e9;
}

.metric.cool {
  color: #3a6f95;
  background: #e6eff6;
}

.metric.cold {
  color: #3b5a8c;
  background: #e5eaf5;
}

/* 습도 — 눅눅할수록 짙은 파랑, 건조하면 모래빛 */
.metric.wet {
  color: #2b5f8a;
  background: #dfeaf4;
}

.metric.humid {
  color: #3d7396;
  background: #e8f1f7;
}

.metric.nice {
  color: #4a7f68;
  background: #e7f2ed;
}

.metric.dry {
  color: #937243;
  background: #f6eede;
}

.badge {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  margin-left: 5px;
  padding: 2px 8px 2px 6px;
  border-radius: 999px;
  color: var(--on-accent);
  font-size: 10px;
  font-weight: 700;
  vertical-align: 2px;
  white-space: nowrap;
}

.here-badge {
  background: var(--accent);
}


/* 실제 관측값이 아님을 분명히 */
.demo-badge {
  padding: 2px 8px;
  color: var(--muted);
  background: var(--line);
}

/* 선택 표시 — 도시 이름 옆 체크 */
.pick {
  display: inline-flex;
  margin-left: 5px;
  color: var(--muted);
  vertical-align: -1px;
}

/* ── 별표 ── */
.star {
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--faint);
  cursor: pointer;
  place-items: center;
  transition:
    color 0.15s ease,
    background 0.15s ease,
    transform 0.15s ease;
}

.star:hover {
  color: #e0a12a;
  background: #fdf4dc;
  transform: scale(1.12);
}

.star.on {
  color: #e0a12a;
}

/* ── 버튼 ── */
.btn-detail {
  padding: 7px 13px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  background: var(--paper);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background 0.15s ease;
}

.btn-detail.on {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-tint);
}

.btn-detail:hover {
  border-color: var(--accent-line);
  color: var(--accent);
  background: var(--accent-tint);
}

/* 좁아지면 수치 덩어리를 아래로 내린다 */
@media (max-width: 520px) {
  .weather-card {
    grid-template-columns: minmax(0, 1fr) auto auto;
  }

  .metrics {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, max-content);
  }
}
</style>
