<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import WeatherIcon from '../components/WeatherIcon.vue'
import UiIcon from '../components/UiIcon.vue'
import { fetchWeather, nearestCity } from '../components/weatherApi'
import { backdropStatus } from '../data/backdropState'
import TestStrip from '../components/TestStrip.vue'
import { useConfigStore } from '../stores/configStore'
import { link } from '../routes'

/**
 * 홈 — 오늘 한눈에.
 *
 * 여기서 가장 먼저 보고 싶은 것은 "지금 내가 있는 곳"의 날씨다.
 * 전국 목록은 날씨 화면이 맡으므로, 홈에서는 한 곳만 크게 보여 준다.
 */
const { unit, unitSymbol } = storeToRefs(useConfigStore())
const toUnit = (celsius) =>
  unit.value === 'celsius' ? celsius : Math.round((celsius * 9) / 5 + 32)

const here = ref(null)
/**
 * idle      아직 아무것도 하지 않음
 * locating  위치를 찾는 중
 * ready     현재 위치 날씨를 받아 옴
 * ask       아직 허용받지 못함 — 버튼으로 다시 물어볼 수 있다
 * blocked   브라우저가 이 사이트의 위치 권한을 막아 둠 — 버튼으로는 못 푼다
 * failed    위치는 알았는데 날씨를 못 받음
 */
const state = ref('idle')

/**
 * 위치를 못 얻었을 때 배경이 기대는 도시.
 *
 * 홈은 원래 배경에 아무 말도 하지 않아서, 날씨 화면에 들어가기 전까지는
 * 늘 기본 하늘(구름 조금)만 보였다. 갤러리 목록의 미리보기는 이 홈을
 * iframe 으로 띄우는데, iframe 안에서는 위치 권한을 물어볼 수 없어
 * 언제 봐도 같은 하늘이었다.
 *
 * 그래서 홈도 배경을 정하게 하고, 현재 위치를 모를 때는 이 도시로 대신한다.
 */
const FALLBACK_CITY_ID = 'seongnam'

/**
 * 배경이 따라갈 날씨를 정한다.
 * 현재 위치를 알면 그곳, 모르면 기준 도시. 둘 다 없으면 건드리지 않는다.
 */
const applyBackdrop = (rows, near) => {
  const city =
    (near && rows.find((row) => row.id === near.id)) ??
    rows.find((row) => row.id === FALLBACK_CITY_ID)

  if (city) backdropStatus.value = city.status
}

/** 위치를 못 받아도 화면이 막히면 안 되므로, 실패를 null 로 돌려준다 */
const locate = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve(nearestCity(coords.latitude, coords.longitude)),
      () => resolve(null),
      { timeout: 8000 },
    )
  })

const load = async () => {
  state.value = 'locating'
  try {
    // 위치와 날씨는 서로를 기다릴 이유가 없다
    const [near, weather] = await Promise.all([locate(), fetchWeather()])

    // 카드는 현재 위치가 있어야 뜨지만, 배경은 그렇지 않다. 먼저 채운다.
    applyBackdrop(weather.rows, near)

    if (!near) {
      // 거절했거나 시간 안에 못 받았다. 다시 물어볼 수 있는 상태로 둔다.
      state.value = 'ask'
      return
    }
    here.value = weather.rows.find((row) => row.id === near.id) ?? null
    state.value = here.value ? 'ready' : 'failed'
  } catch (error) {
    console.error('[home] 현재 위치 날씨를 불러오지 못했습니다.', error)
    state.value = 'failed'
  }
}

onMounted(async () => {
  // 한 번 거절한 사용자를 다시 귀찮게 하지는 않는다
  const permission = await navigator.permissions?.query({ name: 'geolocation' }).catch(() => null)
  if (permission?.state === 'denied') {
    state.value = 'blocked'
    // 카드는 못 띄우지만 배경까지 포기할 이유는 없다 — 기준 도시로 채운다
    fetchWeather()
      .then((weather) => applyBackdrop(weather.rows, null))
      .catch(() => {})
    return
  }
  load()
})

/** 아이콘 받침 색조 — 날씨 카드와 같은 규칙 */
const tone = computed(() => {
  const status = here.value?.status ?? ''
  if (status.includes('맑')) return 'warm'
  if (status.includes('비') || status.includes('눈')) return 'cool'
  return 'neutral'
})
</script>

<template>
  <main class="home-page">
    <section class="home-hero">
      <p class="home-eyebrow">TODAY, AT A GLANCE</p>
      <h1>오늘 하루를<br />가볍게 준비해요.</h1>
      <p>지금 계신 곳의 날씨부터 확인하고, 타로 세 장으로 오늘의 흐름도 살펴보세요.</p>
    </section>

    <!-- 현재 위치 한 곳 -->
    <section class="here" :class="{ ready: state === 'ready' }">
      <template v-if="state === 'ready' && here">
        <div class="here-icon" :class="tone">
          <WeatherIcon :status="here.status" :size="40" />
        </div>
        <div class="here-text">
          <p class="here-label"><UiIcon name="location" :size="12" /> 현재 위치</p>
          <h2>{{ here.name }}</h2>
          <p class="here-status">{{ here.status }} · 습도 {{ here.humidity }}%</p>
        </div>
        <p class="here-temp">
          {{ toUnit(here.temp) }}<span>{{ unitSymbol }}</span>
        </p>
        <RouterLink :to="link('detail', { cityId: here.id })" class="here-more">
          자세히 보기 →
        </RouterLink>
      </template>

      <p v-else-if="state === 'locating'" class="here-note">현재 위치의 날씨를 찾는 중입니다…</p>

      <div v-else-if="state === 'ask'" class="here-note ask">
        <div>
          <b>현재 위치를 허용해 주세요.</b>
          <span>허용하면 지금 계신 곳의 날씨를 여기에 먼저 보여 드립니다.</span>
        </div>
        <button type="button" class="allow" @click="load">
          <UiIcon name="location" :size="14" /> 위치 허용
        </button>
        <RouterLink :to="link('weather')">전국 날씨 보기 →</RouterLink>
      </div>

      <div v-else-if="state === 'blocked'" class="here-note ask">
        <div>
          <b>이 사이트의 위치 권한이 꺼져 있습니다.</b>
          <span>주소창의 자물쇠 아이콘에서 위치를 '허용'으로 바꾸면 여기에 표시됩니다.</span>
        </div>
        <RouterLink :to="link('weather')">전국 날씨 보기 →</RouterLink>
      </div>

      <p v-else class="here-note">
        현재 위치의 날씨를 불러오지 못했습니다.
        <button type="button" @click="load">다시 시도</button>
      </p>
    </section>

    <section class="home-links" aria-label="서비스 바로가기">
      <RouterLink :to="link('weather')" class="home-link weather-link">
        <span>☁</span>
        <strong>날씨</strong>
        <small>전국 도시 오늘 현황</small>
      </RouterLink>
      <RouterLink :to="link('tarot')" class="home-link tarot-link">
        <span>✶</span>
        <strong>운세</strong>
        <small>타로로 오늘의 운세 보기</small>
      </RouterLink>
    </section>

    <!-- 맨 아래 — 3초마다 옆으로 넘어가며 테스트를 흘려 준다 -->
    <TestStrip />
  </main>
</template>

<style scoped>
.home-page { display: grid; gap: 12px; }
.home-hero, .home-link, .here { border: 1px solid color-mix(in srgb, var(--surface) 75%, transparent); border-radius: 22px; background: color-mix(in srgb, var(--surface) 82%, transparent); backdrop-filter: blur(12px); }
.home-hero { padding: 34px 28px; }
.home-eyebrow { margin: 0 0 12px; color: var(--accent); font-family: var(--font-mono); font-size: 11px; letter-spacing: .1em; }
h1 { margin: 0; color: var(--ink); font-size: clamp(30px, 7vw, 42px); font-weight: 600; line-height: 1.18; }
.home-hero > p:last-child { max-width: 420px; margin: 16px 0 0; color: var(--ink-soft); line-height: 1.65; }

/* ── 현재 위치 ── */
.here { display: grid; gap: 14px; padding: 20px 24px; }
.here.ready { grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; }
.here-icon { display: grid; width: 66px; height: 66px; border-radius: 20px; place-items: center; }
.here-icon.warm { background: #fdf2d5; }
.here-icon.cool { background: #e5eff9; }
.here-icon.neutral { background: #edf0f3; }
.here-label { display: flex; gap: 5px; align-items: center; margin: 0 0 3px; color: var(--accent); font-size: 11px; font-weight: 700; }
.here h2 { margin: 0; color: var(--ink); font-size: 24px; font-weight: 600; line-height: 1.2; }
.here-status { margin: 3px 0 0; color: var(--muted); font-size: 12.5px; }
.here-temp { margin: 0; color: var(--ink); font-family: var(--font-mono); font-size: 34px; font-weight: 700; letter-spacing: -.03em; }
.here-temp span { margin-left: 2px; color: var(--faint); font-size: 16px; font-weight: 500; }
.here-more { grid-column: 1 / -1; justify-self: end; color: var(--accent); font-size: 12.5px; font-weight: 600; text-decoration: none; }
.here-more:hover { text-decoration: underline; }
.here-note { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin: 0; color: var(--muted); font-size: 13px; }
.here-note a { color: var(--accent); font-weight: 600; text-decoration: none; }
.here-note button { padding: 5px 12px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); color: var(--muted); cursor: pointer; font: inherit; font-size: 12px; }
.here-note button:hover { border-color: var(--accent); color: var(--accent); }
.here-note.ask { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 14px; align-items: center; }
.here-note.ask > div { display: grid; gap: 3px; }
.here-note.ask b { color: var(--ink); font-size: 13.5px; }
.here-note.ask span { color: var(--muted); font-size: 12.5px; line-height: 1.6; }
.here-note .allow { display: inline-flex; gap: 6px; align-items: center; padding: 9px 16px; border: 0; border-radius: 999px; color: var(--on-accent); background: var(--accent); font-size: 12.5px; font-weight: 600; }
.here-note .allow:hover { border: 0; color: var(--on-accent); opacity: .9; }
@media (max-width: 560px) { .here-note.ask { grid-template-columns: 1fr; } }

.home-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.home-link { display: grid; gap: 8px; min-height: 170px; padding: 22px; color: var(--ink); text-decoration: none; transition: transform .2s ease, background .2s ease; }
.home-link:hover { transform: translateY(-3px); background: var(--surface); }
.home-link > span { font-size: 30px; line-height: 1; }
.home-link strong { margin-top: auto; font-size: 25px; font-weight: 600; }
.home-link small { color: var(--muted); }
.weather-link > span { color: #49788d; }
.tarot-link > span { color: #755899; }

@media (max-width: 520px) {
  .here.ready { grid-template-columns: auto minmax(0, 1fr); }
  .here-temp { grid-column: 2; }
}
@media (max-width: 420px) { .home-links { grid-template-columns: 1fr; } }
</style>
