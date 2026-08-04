<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import WeatherIcon from './WeatherIcon.vue'
import UiIcon from './UiIcon.vue'
import { fetchHourly, findCity, toDateKey, shiftDate, DATE_RANGE } from './weatherApi'

/**
 * 시간별 예보 패널.
 * 어느 도시를 볼지는 부모가 정하고(props), 닫는 것도 부모에게 알린다(emits).
 * 다만 "그 도시의 시간별 데이터"는 이 화면에서만 쓰므로 여기서 직접 불러온다.
 */
const props = defineProps({
  city: { type: Object, default: null },
  /**
   * 온도 단위 — 넘기지 않으면 지금까지처럼 섭씨로 보여 준다.
   * 그래서 이 부품을 쓰는 단계별 결과물 화면은 하나도 바뀌지 않는다.
   */
  toUnit: { type: Function, default: (celsius) => celsius },
  unitSymbol: { type: String, default: '°C' },
})

const emit = defineEmits(['close'])

const rows = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

const TODAY = toDateKey(new Date())
const currentHour = new Date().getHours()

/** 오늘은 지금을 가운데 두고 앞 6시간 ~ 뒤 12시간만 본다 */
const HOURS_BEFORE = 6
const HOURS_AFTER = 12

const dateKey = ref(TODAY)
const hoursEl = ref(null)
const isToday = computed(() => dateKey.value === TODAY)
const isPast = computed(() => dateKey.value < TODAY)

const load = async () => {
  if (!props.city) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const city = findCity(props.city.id)

    if (isToday.value) {
      // 지금 +12시간이 자정을 넘길 수 있으므로 내일까지 받아 온 뒤 잘라 쓴다
      const all = await fetchHourly(city, dateKey.value, shiftDate(dateKey.value, 1))
      const now = new Date()
      const from = new Date(now).setHours(now.getHours() - HOURS_BEFORE, 0, 0, 0)
      const to = new Date(now).setHours(now.getHours() + HOURS_AFTER, 0, 0, 0)
      rows.value = all.filter((row) => {
        const t = new Date(row.time).getTime()
        return t >= from && t <= to
      })
    } else {
      // 오늘이 아니면 그날 하루를 통째로 본다
      rows.value = await fetchHourly(city, dateKey.value)
    }
  } catch (error) {
    errorMessage.value = '시간별 날씨를 불러오지 못했습니다.'
    rows.value = []
    console.error('[weather] 시간별 조회 실패', error)
  } finally {
    isLoading.value = false
  }

  // 오늘이면 지금 시각이 화면 가운데 오도록 가로 스크롤을 맞춰 준다
  if (isToday.value) {
    await nextTick()
    const el = hoursEl.value
    const now = el?.querySelector('.now')
    if (el && now) el.scrollLeft = now.offsetLeft - el.clientWidth / 2 + now.offsetWidth / 2
  }
}

/** 도시가 바뀌거나 날짜를 옮기면 새로 불러온다 */
watch(() => [props.city?.id, dateKey.value], load, { immediate: true })

/** 다른 도시를 열면 날짜는 오늘로 되돌린다 */
watch(
  () => props.city?.id,
  () => (dateKey.value = TODAY),
)

const move = (days) => {
  const next = shiftDate(dateKey.value, days)
  if (next >= DATE_RANGE.min && next <= DATE_RANGE.max) dateKey.value = next
}

/** 2026-07-20 → 7월 20일 (월) */
const dateLabel = computed(() => {
  const d = new Date(`${dateKey.value}T00:00:00`)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekday})`
})

/** 막대 높이를 정하려면 24시간 중 최저·최고가 필요하다 */
const range = computed(() => {
  if (!rows.value.length) return { min: 0, max: 1 }
  const temps = rows.value.map((r) => r.temp)
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  return { min, max: max === min ? min + 1 : max }
})

const heightOf = (temp) =>
  Math.round(26 + ((temp - range.value.min) / (range.value.max - range.value.min)) * 34)
</script>

<template>
  <section v-if="city" class="detail">
    <header class="detail-head">
      <WeatherIcon :status="city.status" :size="26" />
      <div>
        <h4>
          {{ city.name }}
          <span v-if="city.region !== city.name" class="sido">{{ city.region }}</span>
        </h4>
        <p class="current">지금 {{ toUnit(city.temp) }}{{ unitSymbol }} · 습도 {{ city.humidity }}% · {{ city.status }}</p>
      </div>
      <button class="close" type="button" aria-label="닫기" @click="emit('close')">✕</button>
    </header>

    <!-- 날짜 선택 — 과거 90일부터 미래 14일까지 -->
    <div class="date-bar">
      <button
        type="button"
        class="step"
        :disabled="shiftDate(dateKey, -1) < DATE_RANGE.min"
        aria-label="하루 전"
        @click="move(-1)"
      >
        ‹
      </button>

      <label class="date-field">
        <span class="date-label">
          {{ dateLabel }}
          <b v-if="isToday" class="tag today">오늘</b>
          <b v-else-if="isPast" class="tag past">지난 날씨</b>
          <b v-else class="tag future">예보</b>
        </span>
        <input v-model="dateKey" type="date" :min="DATE_RANGE.min" :max="DATE_RANGE.max" />
      </label>

      <button
        type="button"
        class="step"
        :disabled="shiftDate(dateKey, 1) > DATE_RANGE.max"
        aria-label="하루 뒤"
        @click="move(1)"
      >
        ›
      </button>

      <button v-if="!isToday" type="button" class="today-btn" @click="dateKey = TODAY">
        오늘로
      </button>
    </div>

    <p v-if="isLoading" class="state">시간별 예보를 불러오는 중…</p>
    <p v-else-if="errorMessage" class="state error">{{ errorMessage }}</p>

    <template v-else-if="rows.length">
      <p class="axis">
        <span v-if="isToday">지금 기준 앞뒤 시간 · </span>최저 {{ toUnit(range.min) }}{{ unitSymbol }} ~
        최고 {{ toUnit(range.max) }}{{ unitSymbol }}
      </p>

      <!-- 가로로 스크롤되는 시간별 막대 -->
      <ul ref="hoursEl" class="hours">
        <li
          v-for="row in rows"
          :key="row.time"
          :class="{ now: isToday && row.hour === currentHour }"
        >
          <!-- 막대는 바닥을 맞추고 위로 자란다. 숫자도 막대 위에 붙어 함께 오르내린다 -->
          <span class="bar-slot">
            <span class="temp">{{ toUnit(row.temp) }}°</span>
            <span class="bar" :style="{ height: heightOf(row.temp) + 'px' }" />
          </span>
          <WeatherIcon :status="row.status" :size="18" />
          <span v-if="row.rainChance > 0" class="rain">
            <UiIcon name="droplet" :size="10" />{{ row.rainChance }}%
          </span>
          <span v-else class="rain none">–</span>
          <span class="hour">
            {{ isToday && row.hour === currentHour ? '지금' : row.hour + '시' }}
          </span>
          <span v-if="row.hour === 0" class="daymark">다음날</span>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.detail {
  margin-bottom: 12px;
  padding: 14px 16px;
  border: 1px solid var(--accent);
  border-radius: 16px;
  background: var(--surface);
}

.detail-head {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.detail-head h4 {
  margin: 0 0 2px;
  color: var(--ink);
  font-size: 16px;
  font-weight: 700;
}

.sido {
  margin-left: 5px;
  color: var(--faint);
  font-size: 11.5px;
  font-weight: 500;
}

.current {
  margin: 0;
  color: var(--muted);
  font-size: 12.5px;
}

.close {
  margin-left: auto;
  padding: 4px 9px;
  border: 0;
  border-radius: 8px;
  color: var(--faint);
  background: transparent;
  cursor: pointer;
  font-size: 13px;
}

.close:hover {
  background: var(--paper);
}

.axis {
  margin: 0 0 10px;
  color: var(--faint);
  font-size: 11.5px;
}

.state {
  margin: 0;
  padding: 22px 0;
  color: var(--faint);
  font-size: 13px;
  text-align: center;
}

.state.error {
  color: var(--signal);
}

/* ── 날짜 선택 ── */
.date-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
  margin-bottom: 12px;
}

.step {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--muted);
  background: var(--surface);
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
}

.step:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.step:disabled {
  cursor: default;
  opacity: 0.35;
}

/* 날짜 글자를 누르면 달력이 열리도록 input을 투명하게 겹쳐 둔다 */
.date-field {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 5px 13px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper);
  cursor: pointer;
}

.date-field:hover {
  border-color: var(--accent);
}

.date-label {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  color: var(--ink);
  font-size: 12.5px;
  font-weight: 700;
}

.date-field input {
  position: absolute;
  inset: 0;
  border: 0;
  background: transparent;
  color: transparent;
  cursor: pointer;
  font: inherit;
  opacity: 0;
}

.tag {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}

.tag.today {
  color: var(--on-accent);
  background: var(--accent);
}

.tag.past {
  color: var(--slate);
  background: var(--slate-tint);
}

.tag.future {
  color: #b8672a;
  background: #fdf0e0;
}

.today-btn {
  padding: 5px 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  background: var(--surface);
  cursor: pointer;
  font: inherit;
  font-size: 11.5px;
  font-weight: 600;
}

.today-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* 시간별 막대 — 좁으면 가로로 밀어서 본다 */
.hours {
  /* 자식의 offsetLeft가 이 목록 기준이 되도록 위치 지정 요소로 만든다 */
  position: relative;
  display: flex;
  gap: 4px;
  overflow-x: auto;
  margin: 0;
  padding: 0 0 6px;
  list-style: none;
  scrollbar-width: thin;
}

.hours li {
  display: grid;
  flex: none;
  width: 46px;
  gap: 4px;
  justify-items: center;
  padding: 8px 2px;
  border-radius: 12px;
}

/* 지금 시각은 배경으로 구분 */
.hours li.now {
  background: var(--accent-tint);
}

.temp {
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 700;
}

/* 막대가 놓이는 자리 — 높이를 고정해 바닥선을 맞춘다 */
.bar-slot {
  display: flex;
  height: 84px;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
}

/* 기온이 높을수록 막대가 길어진다 */
.bar {
  width: 5px;
  border-radius: 999px;
  background: linear-gradient(to top, var(--accent), color-mix(in srgb, var(--signal) 70%, transparent));
}

.rain {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  color: #3d7fc1;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
}

.rain.none {
  color: var(--line-strong);
}

.hour {
  color: var(--muted);
  font-size: 11px;
}

.daymark {
  color: var(--faint);
  font-size: 9.5px;
}

.hours li.now .hour {
  color: var(--accent);
  font-weight: 700;
}
</style>
