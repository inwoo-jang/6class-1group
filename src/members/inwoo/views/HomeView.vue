<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import WeatherIcon from '../components/WeatherIcon.vue'
import UiIcon from '../components/UiIcon.vue'
import { fetchWeather, nearestCity } from '../components/weatherApi'
import { backdropStatus } from '../data/backdropState'
import FortuneCookie from '../components/FortuneCookie.vue'
import TestStrip from '../components/TestStrip.vue'
import { useConfigStore } from '../stores/configStore'
import { link } from '../routes'

/**
 * 홈 — 오늘을 시작하는 대시보드
 * ------------------------------------------------------------------
 * 3초 안에 "여기가 뭐 하는 곳인지" 알게 하는 것이 이 화면의 일이다.
 *
 *   ① 히어로     무엇을 할 수 있는지 + 포춘쿠키(가장 먼저 누르게 될 것)
 *   ② 요약 줄    오늘의 핵심을 한 줄로
 *   ③ 위치 카드  지금 있는 곳의 날씨 (권한이 없으면 연결 안내)
 *   ④ 기능 카드  날씨 · 운세 · 테스트
 *
 * 위치 권한이 있을 때와 없을 때 레이아웃은 그대로 두고 ③ 안쪽만 바뀐다.
 * 권한이 없다고 화면이 무너지면 "허용해야만 쓸 수 있는 앱"처럼 보이기 때문이다.
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
const isReady = computed(() => state.value === 'ready' && here.value)

/**
 * 위치를 못 얻었을 때 배경이 기대는 도시.
 *
 * 갤러리 목록의 미리보기는 이 홈을 iframe 으로 띄우는데, iframe 안에서는
 * 위치 권한을 물어볼 수 없어 언제 봐도 같은 하늘이었다.
 * 그래서 현재 위치를 모를 때는 이 도시의 날씨로 배경을 채운다.
 */
const FALLBACK_CITY_ID = 'seongnam'

/** 배경이 따라갈 날씨를 정한다. 현재 위치를 알면 그곳, 모르면 기준 도시 */
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

/* ── 오늘의 요약 ───────────────────────────────────────────────── */

/**
 * 행운지수.
 *
 * 날짜를 씨앗으로 만들어, 새로고침해도 오늘 안에는 값이 바뀌지 않는다.
 * 볼 때마다 달라지면 "오늘의" 숫자가 아니라 그냥 난수로 보인다.
 */
const luck = computed(() => {
  const now = new Date()
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
  return 62 + ((seed * 37) % 38) // 62 ~ 99
})

/**
 * 요약 줄 끝의 한마디.
 *
 * 날씨 이름만 보고 정하면 36℃ 맑은 날에 "밖으로 나가기 좋다"고 말하게 된다.
 * 그래서 기온 · 습도 · 하늘 상태를 함께 보고, 사람이 실제로 느끼는 순서대로
 * 위에서부터 걸러 낸다. 위험한 것(폭염·한파)이 먼저고, 그다음이 비·눈,
 * 그리고 아무 문제 없을 때에만 "나가기 좋다"고 말한다.
 */
const todayNote = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 20 || hour < 6) {
    return { icon: '🌙', text: '오늘 하루도 고생했어요. 내일 운세 미리 볼래요?' }
  }

  const status = here.value?.status ?? ''
  if (!status) return { icon: '🥠', text: '오늘의 한 줄이 기다리고 있어요.' }

  const temp = here.value?.temp ?? null
  const humid = here.value?.humidity ?? null

  // ① 비·눈은 무엇보다 먼저 알린다 — 나가기 전에 챙길 것이 있다
  if (status.includes('비') || status.includes('소나기')) {
    return { icon: '☔', text: '비 와요. 우산 챙기는 거 잊지 마세요.' }
  }
  if (status.includes('눈')) {
    return { icon: '❄️', text: '눈이 와요. 길 미끄러우니 조금만 일찍 나서요.' }
  }

  // ② 더위·추위 — 하늘이 맑아도 이쪽이 우선이다
  if (temp !== null && temp >= 33) {
    return { icon: '🥵', text: '오늘 너무 더워요. 물 챙기고 그늘로 다니세요.' }
  }
  if (temp !== null && temp >= 30) {
    return humid !== null && humid >= 70
      ? { icon: '💦', text: '덥고 끈적해요. 바쁜 일은 저녁으로 미뤄도 돼요.' }
      : { icon: '🌡', text: '좀 더워요. 시원한 데로 다니세요.' }
  }
  if (temp !== null && temp <= 0) {
    return { icon: '🧣', text: '많이 추워요. 목도리까지 챙기세요.' }
  }
  if (temp !== null && temp <= 8) {
    return { icon: '🧥', text: '쌀쌀해요. 겉옷 하나 걸치면 딱 좋아요.' }
  }

  // ③ 습도만 높은 날 — 온도는 괜찮아도 몸이 무겁다
  if (humid !== null && humid >= 80) {
    return { icon: '💧', text: '공기가 눅눅해요. 실내에서 천천히 시작해요.' }
  }

  // ④ 여기까지 왔으면 정말 괜찮은 날이다
  if (status.includes('맑')) {
    return { icon: '☀️', text: '날씨 좋아요. 밖에 나가기 딱이에요.' }
  }
  return { icon: '☁️', text: '흐릿해요. 천천히 시작하기 좋은 날이에요.' }
})

/** 요약 줄에 쓰는 작은 날씨 표시 */
const summaryIcon = computed(() => {
  const status = here.value?.status ?? ''
  if (status.includes('비') || status.includes('소나기')) return '🌧'
  if (status.includes('눈')) return '🌨'
  if (status.includes('맑')) return '☀️'
  return '☁️'
})

/** 아래 네 칸 — 이 서비스가 하는 일 전부 */
const menus = [
  { to: 'weather', icon: 'sun-cloud', tone: 'sky', title: '날씨', desc: '오늘의 날씨와 전국 현황' },
  { to: 'tarot', icon: 'moon-star', tone: 'plum', title: '운세', desc: '타로로 오늘의 운세 보기' },
  { to: 'tests', icon: 'checklist', tone: 'leaf', title: '테스트', desc: '오늘의 심리테스트' },
]

/** 위치를 허용하면 받을 수 있는 것들 — 권한이 없을 때만 보여 준다 */
const locationPerks = ['현재 기온', '체감온도', '강수확률', '미세먼지']
</script>

<template>
  <main class="home-page">
    <!-- ① 히어로 -->
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">TODAY</p>
        <h1>오늘을 가볍게<br />시작해보세요.</h1>
        <p class="lead">
          지금 날씨부터 오늘의 운세,<br />
          그리고 작은 행운까지 한 번에 확인하세요.
        </p>
      </div>

      <!-- 이 화면에서 가장 먼저 누르게 될 것 -->
      <FortuneCookie />
    </section>

    <!-- ② 오늘의 요약 -->
    <section class="summary" aria-label="오늘의 요약">
      <span v-if="isReady" class="chip">
        <UiIcon name="location" :size="14" /> {{ here.name }}
      </span>
      <span v-if="isReady" class="chip temp">
        <UiIcon name="thermometer" :size="19" /> {{ toUnit(here.temp) }}{{ unitSymbol }}
      </span>
      <span class="chip luck">
        <UiIcon name="clover" :size="20" /> 행운지수 {{ luck }}%
      </span>
      <span class="chip note">
        <!-- 한마디 앞에는 지금 날씨를 그대로 보여 준다 (WeatherIcon 은 데이터용 그림) -->
        <WeatherIcon v-if="isReady" :status="here.status" :size="18" />
        <UiIcon v-else name="star" :size="14" />
        {{ todayNote.text }}
      </span>
    </section>

    <!-- ③ 현재 위치 -->
    <section class="place" :class="{ ready: isReady }">
      <!-- CASE 1 · 위치를 아는 경우 -->
      <template v-if="isReady">
        <div class="place-icon" :class="tone">
          <WeatherIcon :status="here.status" :size="40" />
        </div>
        <div class="place-text">
          <p class="place-label"><UiIcon name="location" :size="12" /> 현재 위치</p>
          <h2>{{ here.name }}</h2>
          <p class="place-status">{{ here.status }} · 습도 {{ here.humidity }}%</p>
        </div>
        <p class="place-temp">
          {{ toUnit(here.temp) }}<span>{{ unitSymbol }}</span>
        </p>
        <RouterLink :to="link('detail', { cityId: here.id })" class="place-more">
          자세히 보기 →
        </RouterLink>
      </template>

      <p v-else-if="state === 'locating'" class="place-note">현재 위치의 날씨를 찾는 중입니다…</p>

      <!-- CASE 2 · 위치를 모르는 경우 — 칸은 그대로 두고 안쪽만 바꾼다 -->
      <div v-else class="connect">
        <p class="connect-head"><UiIcon name="location" :size="13" /> 위치 정보를 연결하면</p>
        <p class="connect-body">현재 지역 날씨와<br />맞춤 정보를 확인할 수 있습니다.</p>

        <ul class="perks">
          <li v-for="perk in locationPerks" :key="perk">{{ perk }}</li>
        </ul>

        <button v-if="state !== 'blocked'" type="button" class="connect-btn" @click="load">
          현재 위치 연결
        </button>
        <p v-else class="connect-hint">
          브라우저가 이 사이트의 위치를 막아 두었습니다. 주소창의 자물쇠에서 '허용'으로 바꿔 주세요.
        </p>

        <RouterLink :to="link('weather')" class="connect-skip">전국 날씨 보기 →</RouterLink>
      </div>
    </section>

    <!-- ④ 기능 카드 -->
    <section class="menus" aria-label="바로가기">
      <RouterLink v-for="menu in menus" :key="menu.to" :to="link(menu.to)" class="menu">
        <span class="menu-icon" :class="menu.tone" aria-hidden="true">
          <UiIcon :name="menu.icon" :size="22" />
        </span>
        <b>{{ menu.title }}</b>
        <small>{{ menu.desc }}</small>
      </RouterLink>
    </section>

    <TestStrip />
  </main>
</template>

<style scoped>
/* 카드 사이를 넓게 — 여백이 정보를 정리해 준다 */
.home-page {
  display: grid;
  gap: 18px;
}

.hero,
.place,
.menu {
  border: 1px solid color-mix(in srgb, var(--surface) 75%, transparent);
  border-radius: 22px;
  background: color-mix(in srgb, var(--surface) 82%, transparent);
  backdrop-filter: blur(12px);
}

/* ── ① 히어로 ── */
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px;
  gap: 30px;
  align-items: center;
  padding: 40px 34px;
}

.hero-text {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 14px;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
}

h1 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(28px, 5.4vw, 38px);
  font-weight: 700;
  line-height: 1.28;
  letter-spacing: -0.02em;
}

.lead {
  margin: 18px 0 0;
  color: var(--ink-soft);
  font-size: 14.5px;
  line-height: 1.75;
}

/* ── ② 요약 줄 ── */
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  padding: 9px 15px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 600;
}

.chip :deep(svg) {
  flex: none;
  color: var(--muted);
}

/* 온도계와 클로버는 이 줄의 주인공이라 크고 색이 있다 */
.chip.temp :deep(svg) {
  color: #b06a2c;
  stroke-width: 1.9;
}

.chip.luck :deep(svg) {
  color: #2f6b47;
  stroke-width: 1.9;
}

/* 날씨 그림은 원래 색을 살린다 */
.chip :deep(img) {
  flex: none;
}

/* 한마디는 남은 자리를 다 쓴다 */
.chip.note {
  flex: 1;
  min-width: 210px;
  color: var(--muted);
  font-weight: 500;
}

/* ── ③ 현재 위치 ── */
.place {
  display: grid;
  gap: 14px;
  padding: 24px 26px;
}

.place.ready {
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
}

.place-icon {
  display: grid;
  width: 66px;
  height: 66px;
  border-radius: 20px;
  place-items: center;
}

.place-icon.warm {
  background: #fdf2d5;
}

.place-icon.cool {
  background: #e5eff9;
}

.place-icon.neutral {
  background: #edf0f3;
}

.place-label {
  display: flex;
  gap: 5px;
  align-items: center;
  margin: 0 0 3px;
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
}

.place h2 {
  margin: 0;
  color: var(--ink);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
}

.place-status {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 12.5px;
}

.place-temp {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.place-temp span {
  margin-left: 2px;
  color: var(--faint);
  font-size: 16px;
  font-weight: 500;
}

.place-more {
  grid-column: 1 / -1;
  justify-self: end;
  color: var(--accent);
  font-size: 12.5px;
  font-weight: 600;
  text-decoration: none;
}

.place-more:hover {
  text-decoration: underline;
}

.place-note {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

/* CASE 2 — 위치 연결 안내 */
.connect {
  display: grid;
  gap: 12px;
  justify-items: start;
}

.connect-head {
  display: flex;
  gap: 5px;
  align-items: center;
  margin: 0;
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
}

.connect-body {
  margin: 0;
  color: var(--ink);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.6;
}

.perks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.perks li {
  padding: 5px 11px;
  border-radius: 999px;
  background: var(--accent-tint);
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
}

.connect-btn {
  padding: 11px 20px;
  border: 0;
  border-radius: 999px;
  background: var(--accent);
  color: var(--on-accent);
  cursor: pointer;
  font: inherit;
  font-size: 13.5px;
  font-weight: 700;
}

.connect-btn:hover {
  opacity: 0.9;
}

.connect-hint {
  margin: 0;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.7;
}

.connect-skip {
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 600;
  text-decoration: none;
}

.connect-skip:hover {
  color: var(--accent);
}

/* ── ④ 기능 카드 ── */
.menus {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.menu {
  display: grid;
  gap: 4px;
  align-content: start;
  padding: 20px 18px;
  color: inherit;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;
}

.menu:hover {
  transform: translateY(-3px);
  border-color: var(--accent-line);
}

/* 아이콘은 색 받침 위에 올린다. 카드마다 색을 달리해 구분이 빨라진다 */
.menu-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-bottom: 10px;
  border-radius: 13px;
}

.menu-icon.sky {
  background: #e5eff9;
  color: #3d6f92;
}

.menu-icon.plum {
  background: #efe9f7;
  color: #6b4fa1;
}

.menu-icon.leaf {
  background: #e6f0e9;
  color: #2f6b47;
}

.menu b {
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}

.menu small {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.55;
}

@media (max-width: 640px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    padding: 30px 24px;
  }

  /* 좁은 화면에서는 쿠키를 작게 가운데로 */
  .hero > .cookie {
    width: 170px;
    justify-self: center;
  }
}

@media (max-width: 520px) {
  .place.ready {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .place-temp {
    grid-column: 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .menu {
    transition: none;
  }
}
</style>
