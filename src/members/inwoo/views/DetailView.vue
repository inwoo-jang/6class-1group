<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import WeatherIcon from '../components/WeatherIcon.vue'
import HourlyDetail from '../components/HourlyDetail.vue'
import UiIcon from '../components/UiIcon.vue'
import { fetchCityDetail, fetchWeather, findCity } from '../data/weatherApi'
import { backdropStatus } from '../data/backdropState'
import { storeToRefs } from 'pinia'
import { useConfigStore } from '../stores/configStore'

/** 목록 화면에서 고른 단위를 그대로 이어받는다 — 같은 Store 를 보기 때문이다 */
const { unitSymbol, toUnit } = storeToRefs(useConfigStore())

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

/**
 * 목록 응답에 없는 관측값(가시거리 · 일출/일몰 · 미세먼지 …).
 * 45개 도시분을 미리 받아 두면 낭비라, 이 화면에서 이 도시 것만 따로 받는다.
 */
const extras = ref({})
const isLoading = ref(false)
const errorMessage = ref('')

const load = async () => {
  current.value = null
  if (!base.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    // 목록 조회와 추가 관측값 조회는 서로를 기다릴 이유가 없다
    const [{ rows }, extra] = await Promise.all([fetchWeather(), fetchCityDetail(base.value)])
    extras.value = extra
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
/** 값이 있는 항목만 표에 올린다 — 제공자마다 주는 것이 다르다 */
const observations = computed(() => {
  if (!current.value) return []
  const c = {
    ...extras.value,
    ...Object.fromEntries(
      Object.entries(current.value).filter(
        ([, value]) => value !== null && value !== undefined && value !== '',
      ),
    ),
  }
  return [
    {
      label: '오늘 최저 · 최고',
      value:
        c.tempMin != null && c.tempMax != null
          ? `${toUnit.value(c.tempMin)} · ${toUnit.value(c.tempMax)}${unitSymbol.value}`
          : null,
      unit: '',
    },
    { label: '강수 확률', value: c.rainChance, unit: '%' },
    { label: '습도', value: c.humidity, unit: '%' },
    { label: '미세먼지', value: c.dust, unit: '' },
    { label: '풍속', value: c.wind, unit: 'm/s' },
    { label: '가시거리', value: c.visibility, unit: 'km' },
    { label: '기압', value: c.pressure, unit: 'hPa' },
    {
      label: '일출 · 일몰',
      value: c.sunrise && c.sunset ? `${c.sunrise} · ${c.sunset}` : null,
      unit: '',
      small: true,
    },
  ].filter((item) => item.value !== null && item.value !== undefined && item.value !== '')
})

/** 관측 시각 — 표의 값들이 언제 기준인지 밝혀 준다 */
const observedClock = computed(() => {
  const at = current.value?.observedAt
  if (!at) return ''
  const date = new Date(at)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
})

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
      <el-button round size="small" @click="goBack">← 이전 화면으로</el-button>
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

        <p v-if="current" class="temp">
          {{ toUnit(current.temp) }}<span class="unit">{{ unitSymbol }}</span>
        </p>
      </header>

      <p v-if="errorMessage" class="error">
        {{ errorMessage }}
        <el-button round size="small" type="danger" plain @click="load">다시 시도</el-button>
      </p>

      <template v-if="current">
        <p class="obs-label">
          오늘의 관측값
          <small v-if="observedClock">{{ observedClock }} 기준</small>
        </p>

        <dl class="observation">
          <div v-for="item in observations" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd :class="{ small: item.small }">
              {{ item.value }}<i v-if="item.unit">{{ item.unit }}</i>
            </dd>
          </div>
        </dl>
      </template>

      <!-- 시간별 예보 — 과거 90일 ~ 미래 14일 -->
      <HourlyDetail
        v-if="current"
        :city="current"
        :to-unit="toUnit"
        :unit-symbol="unitSymbol"
        @close="goBack"
      />

      <footer class="foot">
        <el-button round size="small" @click="goBack">← 이전 화면으로</el-button>
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

.eyebrow code {
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

.obs-label {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  margin: 0 2px 8px;
  color: var(--ink-soft);
  font-size: 12.5px;
  font-weight: 700;
}

.obs-label small {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
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
