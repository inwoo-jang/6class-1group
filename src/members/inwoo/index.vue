<script setup>
/**
 * 최종 결과물 — 껍데기
 * ------------------------------------------------------------------
 * 교안의 App.vue 자리다.
 *   내비게이션 : <RouterLink>
 *   본문       : <RouterView />
 *
 * 주소가 바뀌면 <RouterView /> 자리만 갈아끼워진다.
 * 어떤 주소가 어떤 화면인지는 옆의 routes.js 에 적혀 있다.
 *
 * 색·글꼴은 따로 선언하지 않는다. assets/main.css 의 토큰을 그대로 물려받아야
 * 환경 설정에서 테마를 바꿨을 때 이 화면도 같이 따라온다.
 */
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import WeatherBackdrop from './components/WeatherBackdrop.vue'
import { useAuthStore } from './stores/authStore'
import { useRecordStore } from './stores/recordStore'
import { backdropStatus } from './data/backdropState'
import { link } from './routes'

const route = useRoute()
const router = useRouter()

/** 상세 화면에서도 '날씨' 탭이 눌린 채로 남아야 한다 */
const isWeather = computed(() => route.name === 'inwoo.weather' || route.name === 'inwoo.detail')
const isTarot = computed(() => route.name === 'inwoo.tarot')
const isRecords = computed(() => route.name === 'inwoo.records')
const isLogin = computed(() => route.name === 'inwoo.login')
const isHome = computed(
  () => !isWeather.value && !isTarot.value && !isRecords.value && !isLogin.value,
)

/**
 * 로그인 상태는 내비게이션이 늘 보여 준다.
 * 지금 누구인지 모른 채로 '기록' 탭만 덩그러니 있으면,
 * 눌러 보고 나서야 로그인이 필요하다는 걸 알게 된다.
 */
const auth = useAuthStore()
const { isLoggedIn, displayName } = storeToRefs(auth)
const recordStore = useRecordStore()

// 새로고침해도 로그인이 유지되도록, 저장해 둔 토큰이 살아 있는지 한 번 확인한다
onMounted(() => auth.restore())

const logout = () => {
  auth.logout()
  // 내 기록이 다음 사람 화면에 남아 있으면 안 된다
  recordStore.clear()
  ElMessage.success({ message: '로그아웃했습니다.', duration: 1600 })
  // 기록 화면에 서 있었다면 그대로 둘 수 없다
  if (route.meta.requiresAuth) router.replace(link('home'))
}
</script>

<template>
  <div class="final">
    <!-- 보고 있는 도시의 날씨가 배경이 된다 -->
    <WeatherBackdrop :status="backdropStatus" />

    <!-- 홈 · 날씨 · 운세가 전부 같은 폭을 쓰도록 한 기둥 안에 넣는다 -->
    <div class="column">
      <nav class="nav">
        <RouterLink :to="link('home')" :class="{ on: isHome }">홈</RouterLink>
        <RouterLink :to="link('weather')" :class="{ on: isWeather }">날씨</RouterLink>
        <RouterLink :to="link('tarot')" :class="{ on: isTarot }">운세</RouterLink>
        <RouterLink :to="link('records')" :class="{ on: isRecords }">기록</RouterLink>

        <code class="url">{{ route.path }}</code>

        <!-- 로그인했으면 이름과 로그아웃, 아니면 로그인 링크 -->
        <span v-if="isLoggedIn" class="who">
          <b>{{ displayName }}</b>
          <button type="button" @click="logout">로그아웃</button>
        </span>
        <RouterLink v-else :to="link('login')" class="sign" :class="{ on: isLogin }">
          로그인
        </RouterLink>
      </nav>

      <!-- 주소에 맞는 화면이 여기 놓인다 -->
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.final {
  position: relative;
  display: grid;
  overflow: hidden;
  min-height: 70vh;
  padding: 12px;
  border-radius: 16px;
  background: var(--paper);
}

/* 배경(z-index 0) 위에 내용이 오도록 */
.final > *:not(.backdrop) {
  position: relative;
  z-index: 1;
}

/*
 * 화면의 폭을 여기 한 곳에서 정한다.
 * 안에 들어오는 화면은 자기 너비를 신경 쓰지 않아도 되고,
 * 그래서 홈에서 날씨로 넘어가도 판이 흔들리지 않는다.
 */
.column {
  display: grid;
  /*
   * minmax(0, 1fr) 이 없으면 안 되는 이유 —
   * grid 칸은 기본이 min-width: auto 라, 시간별 예보처럼 가로로 긴 내용이
   * 들어오면 칸이 그만큼 벌어져 max-width 를 넘어가 버린다.
   * 0 을 최소로 못박아야 넘치는 대신 그 안에서 스크롤된다.
   */
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 12px;
  width: 100%;
  max-width: 660px;
  margin: 0 auto;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  align-items: center;
  padding: 2px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 72%, transparent);
  backdrop-filter: blur(10px);
}

.nav a {
  padding: 8px 16px;
  border-radius: 999px;
  color: var(--muted);
  font-size: 13.5px;
  font-weight: 600;
  text-decoration: none;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.nav a:hover {
  color: var(--ink);
}

.nav a.on {
  color: var(--on-accent);
  background: var(--accent);
}

.url {
  margin-left: auto;
  padding: 0 12px;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11.5px;
  overflow-wrap: anywhere;
}

/* ── 로그인 자리 ── */
.who {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding-right: 6px;
  white-space: nowrap;
}

.who b {
  color: var(--ink-soft);
  font-size: 12.5px;
}

.who button {
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
}

.who button:hover {
  border-color: var(--danger);
  color: var(--danger);
}

/*
 * 로그인은 '어디에 있는지'가 아니라 '할 일'이라, 홈·날씨·운세처럼 꽉 채우지 않는다.
 * 테두리만 두른 채 옆의 로그아웃 버튼과 같은 모양을 쓴다.
 *
 * .on 까지 함께 적어 두는 이유 —
 * 로그인 화면에 서 있으면 위의 .nav a.on 이 배경을 초록으로 칠한다.
 * 여기서 글자색만 바꾸면 초록 글자에 초록 배경이 되어 글자가 사라진다.
 * (실제로 그렇게 만들어 메뉴에 구멍이 뚫린 것처럼 보였다.)
 * 그래서 배경·글자색을 한 벌로 같이 정한다.
 */
.nav a.sign,
.nav a.sign.on {
  border: 1px solid var(--accent-line);
  background: var(--surface);
  color: var(--accent);
}

/* 지금 로그인 화면에 있다는 표시는 옅은 배경으로만 준다 */
.nav a.sign.on {
  background: var(--accent-tint);
}

.nav a.sign:hover {
  border-color: var(--accent);
  background: var(--accent-tint);
  color: var(--accent);
}

@media (max-width: 620px) {
  .url {
    display: none;
  }

  /* 좁은 화면에서는 이름을 접고 버튼만 남긴다 */
  .who b {
    display: none;
  }
}
</style>
