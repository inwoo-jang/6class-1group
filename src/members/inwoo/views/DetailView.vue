<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import WeatherIcon from '../components/WeatherIcon.vue'
import HourlyDetail from '../components/HourlyDetail.vue'
import UiIcon from '../components/UiIcon.vue'
import { fetchWeather, findCity } from '../data/weatherApi'
import { backdropStatus } from '../data/backdropState'

/**
 * 도시 상세 — /m/inwoo/weather/:cityId
 * ------------------------------------------------------------------
 * 주소의 :cityId 자리에 들어온 값을 useRoute() 로 읽어 그 도시를 그린다.
 * 목록을 거치지 않고 주소를 직접 열어도 똑같이 열려야 하므로,
 * 데이터는 대시보드에서 넘겨받지 않고 여기서 직접 부른다.
 * (이미 받아 둔 값이 있으면 캐시에서 즉시 나온다)
 */
const route = useRoute()
const router = useRouter()

const cityId = computed(() => String(route.params.cityId ?? ''))

/** 좌표·이름 같은 고정 정보 — 네트워크 없이 바로 알 수 있다 */
const base = computed(() => findCity(cityId.value))

const current = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const load = async () => {
  current.value = null
  if (!base.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { rows } = await fetchWeather()
    current.value = rows.find((row) => row.id === cityId.value) ?? null
    // 이 도시의 날씨가 배경이 된다
    backdropStatus.value = current.value?.status ?? ''
  } catch (error) {
    errorMessage.value = '날씨를 불러오지 못했습니다. 네트워크를 확인해 주세요.'
    console.error('[weather] 상세 조회 실패', error)
  } finally {
    isLoading.value = false
  }
}

/** 주소만 바뀌어도(다른 도시로 이동) 다시 부른다 */
watch(cityId, load, { immediate: true })

/** 아이콘 받침 색조 — 목록 카드와 같은 규칙 */
const tone = computed(() => {
  const status = current.value?.status ?? ''
  if (status.includes('맑')) return 'warm'
  if (status.includes('비') || status.includes('눈')) return 'cool'
  return 'neutral'
})

/** 한 단계 이전 주소로 (뒤로가기와 같다) */
const goBack = () => router.go(-1)
</script>

<template>
  <BaseDashboardCard>
    <!-- 없는 도시 코드로 들어온 경우 -->
    <div v-if="!base" class="missing">
      <UiIcon name="empty" :size="24" />
      <p>
        <code>{{ cityId }}</code> 에 해당하는 도시가 없습니다.
      </p>
      <button type="button" @click="goBack">← 이전 화면으로</button>
    </div>

    <template v-else>
      <header class="head">
        <div class="icon-tile" :class="tone">
          <WeatherIcon v-if="current" :status="current.status" :size="34" />
          <span v-else class="tile-skeleton" />
        </div>

        <div class="title">
          <p class="eyebrow">
            {{ base.region }} · <code>{{ cityId }}</code>
          </p>
          <h3>{{ base.name }}</h3>
          <p class="status">
            <template v-if="current">{{ current.status }}</template>
            <template v-else-if="isLoading">불러오는 중…</template>
          </p>
        </div>

        <p v-if="current" class="temp">{{ current.temp }}<span class="unit">°C</span></p>
      </header>

      <p v-if="errorMessage" class="error">
        {{ errorMessage }}
        <button type="button" @click="load">다시 시도</button>
      </p>

      <dl v-if="current" class="observation">
        <div>
          <dt>습도</dt>
          <dd>{{ current.humidity }}<i>%</i></dd>
        </div>
        <div>
          <dt>권역</dt>
          <dd class="small">{{ current.group }}</dd>
        </div>
        <div>
          <dt>좌표</dt>
          <dd class="small">{{ base.lat.toFixed(2) }}, {{ base.lon.toFixed(2) }}</dd>
        </div>
      </dl>

      <!-- 시간별 예보 — 과거 90일 ~ 미래 14일 -->
      <HourlyDetail v-if="current" :city="current" @close="goBack" />

      <footer class="foot">
        <p v-if="route.query.from" class="from">
          <span class="tag">route.query</span>
          <code>{{ route.query }}</code>
        </p>
        <button type="button" @click="goBack">← 이전 화면으로</button>
      </footer>
    </template>
  </BaseDashboardCard>
</template>

<style scoped>
.head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  margin-bottom: 18px;
}

.icon-tile {
  display: grid;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  place-items: center;
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

.tile-skeleton {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--line) 70%, transparent);
}

.eyebrow {
  margin: 0 0 3px;
  color: var(--faint);
  font-size: 11.5px;
}

.eyebrow code,
.from code {
  padding: 1px 5px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--paper);
  font-family: var(--font-mono);
  font-size: 0.92em;
}

h3 {
  margin: 0;
  color: var(--ink);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.status {
  min-height: 20px;
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.temp {
  margin: 0;
  color: var(--ink);
  font-size: 40px;
  font-weight: 300;
  letter-spacing: -0.04em;
}

.unit {
  margin-left: 2px;
  color: var(--faint);
  font-size: 16px;
}

.observation {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 1px;
  margin: 0 0 18px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--line);
}

.observation > div {
  padding: 12px 14px;
  background: var(--surface);
}

dt {
  color: var(--faint);
  font-size: 11.5px;
}

dd {
  margin: 4px 0 0;
  color: var(--ink);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

dd i {
  margin-left: 3px;
  color: var(--muted);
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
}

dd.small {
  font-size: 14px;
  font-weight: 500;
}

.error {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: 10px;
  color: var(--signal);
  background: var(--slate-tint);
  font-size: 13px;
}

.foot {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
}

.from {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.tag {
  padding: 2px 7px;
  border-radius: 999px;
  color: var(--slate);
  background: var(--slate-tint);
  font-family: var(--font-mono);
  font-size: 10.5px;
}

.missing {
  display: grid;
  gap: 12px;
  padding: 40px 20px;
  color: var(--muted);
  justify-items: center;
  text-align: center;
}

.missing p {
  margin: 0;
  font-size: 13.5px;
}

.missing code {
  padding: 2px 7px;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: var(--paper);
  font-family: var(--font-mono);
}

button {
  padding: 9px 15px;
  border: 1px solid var(--accent-line);
  border-radius: 999px;
  color: var(--accent);
  background: var(--accent-tint);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
}

button:hover {
  border-color: var(--accent);
}
</style>
