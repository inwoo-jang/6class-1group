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
/** 테스트 진행 화면에서도 '테스트' 탭이 눌린 채로 남아야 한다 */
const isTests = computed(() => route.name === 'inwoo.tests' || route.name === 'inwoo.test')
const isGames = computed(() => ['games', 'roulette', 'lotto'].includes(String(route.name ?? '').split('.').pop()))
const isAdminPage = computed(() => String(route.name ?? '').endsWith('.admin'))
const isRecords = computed(() => route.name === 'inwoo.records')
const isLogin = computed(() => route.name === 'inwoo.login')
const isHome = computed(
  () =>
    !isWeather.value &&
    !isTarot.value &&
    !isTests.value &&
    !isGames.value &&
    !isAdminPage.value &&
    !isRecords.value &&
    !isLogin.value,
)

/**
 * 로그인 상태는 내비게이션이 늘 보여 준다.
 * 지금 누구인지 모른 채로 '기록' 탭만 덩그러니 있으면,
 * 눌러 보고 나서야 로그인이 필요하다는 걸 알게 된다.
 */
const auth = useAuthStore()
const { isLoggedIn, isAdmin, displayName } = storeToRefs(auth)
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
        <RouterLink :to="link('tests')" :class="{ on: isTests }">테스트</RouterLink>
        <RouterLink :to="link('games')" :class="{ on: isGames }">게임</RouterLink>
        <RouterLink :to="link('records')" :class="{ on: isRecords }">My</RouterLink>

        <!-- 관리자에게만 보인다. 화면을 막는 일은 가드와 서버가 따로 한다 -->
        <RouterLink v-if="isAdmin" :to="link('admin')" class="admin-tab" :class="{ on: isAdminPage }">
          관리
        </RouterLink>

        <code class="url">{{ route.path }}</code>

        <!-- 로그인했으면 이름과 로그아웃, 아니면 로그인 링크 -->
        <span v-if="isAdmin" class="admin-badge">ADMIN MODE</span>

        <span v-if="isLoggedIn" class="who">
          <b>{{ displayName }}</b>
          <button type="button" @click="logout">로그아웃</button>
        </span>
        <RouterLink v-else :to="link('login')" class="sign tint-cta" :class="{ on: isLogin }">
          로그인
        </RouterLink>
      </nav>

      <!-- 주소에 맞는 화면이 여기 놓인다 -->
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
/*
 * ── 내 화면의 색 ───────────────────────────────────────────────
 *
 * 갤러리의 공용 토큰(--card · --fg …)과 내 화면이 쓰는 토큰(--accent ·
 * --paper · --ink …)은 이름이 다르다. 그래서 개인 저장소에서 그대로
 * 옮겨 오면 값이 비어 회색으로 주저앉는다.
 *
 * 공용 assets/main.css 를 고치면 팀원 화면까지 같이 바뀌므로,
 * 여기 .final 안에만 내 팔레트를 선언한다. CSS 변수는 자식으로
 * 내려가므로 이 아래 화면들은 전부 개인 프로젝트와 같은 색을 쓴다.
 *
 * 값은 inwoo-vue/src/assets/main.css 의 editorial · terminal 테마를 따르되,
 * 강조색만 검정으로 바꿨다. 갤러리 전체가 무채색이라 초록이 혼자 튄다.
 */
.final {
  --paper: #f6f4ef;
  --surface: #fffefb;
  --surface-sunken: #efece4;

  --ink: #16191c;
  --ink-soft: #3d4348;
  --muted: #6f7479;
  --faint: #9b9f9f;

  --line: #e4e0d6;
  --line-strong: #cfcabb;

  --accent: #16191c;
  --accent-deep: #000000;
  --accent-tint: #ecebe6;
  --accent-line: #cfcabb;
  --on-accent: #ffffff;

  --signal: #9a5b18;
  --signal-tint: #f7efe3;
  --signal-line: #e3d3ba;

  --slate: #3f5666;
  --slate-deep: #26373f;
  --slate-tint: #ecefef;
  --slate-line: #d2d8d9;

  --danger: #a63d32;
  --danger-tint: #f8ebe8;

  --radius: 6px;
  --radius-lg: 8px;
  --shadow: none;
  --card-border: 1px solid var(--line);

  color: var(--ink);
}

/* 어두운 화면 — 갤러리의 전환 방식(시스템 설정 · 우측 상단 토글)을 그대로 따른다 */
@media (prefers-color-scheme: dark) {
  .final {
    --paper: #14181f;
    --surface: #1b212b;
    --surface-sunken: #232b37;

    --ink: #e8edf4;
    --ink-soft: #c2ccda;
    --muted: #8b98a9;
    --faint: #6c7889;

    --line: #2b3543;
    --line-strong: #3c4859;

    --accent: #e8edf4;
    --accent-deep: #ffffff;
    --accent-tint: #232b37;
    --accent-line: #3c4859;
    --on-accent: #14181f;

    --signal: #e8a866;
    --signal-tint: #2a2318;
    --signal-line: #4a3a24;

    --slate: #79b8e0;
    --slate-deep: #a5d3f0;
    --slate-tint: #1a2530;
    --slate-line: #2d3f4e;

    --danger: #f0847a;
    --danger-tint: #2c1d1c;
  }
}

/* 토글로 밝게 되돌렸을 때는 시스템 설정보다 그쪽이 이긴다 */
:root[data-theme='light'] .final {
  --paper: #f6f4ef;
  --surface: #fffefb;
  --surface-sunken: #efece4;
  --ink: #16191c;
  --ink-soft: #3d4348;
  --muted: #6f7479;
  --faint: #9b9f9f;
  --line: #e4e0d6;
  --line-strong: #cfcabb;
  --accent: #16191c;
  --accent-deep: #000000;
  --accent-tint: #ecebe6;
  --accent-line: #cfcabb;
  --on-accent: #ffffff;
  --signal: #9a5b18;
  --signal-tint: #f7efe3;
  --signal-line: #e3d3ba;
  --slate: #3f5666;
  --slate-deep: #26373f;
  --slate-tint: #ecefef;
  --slate-line: #d2d8d9;
  --danger: #a63d32;
  --danger-tint: #f8ebe8;
}

:root[data-theme='dark'] .final {
  --paper: #14181f;
  --surface: #1b212b;
  --surface-sunken: #232b37;
  --ink: #e8edf4;
  --ink-soft: #c2ccda;
  --muted: #8b98a9;
  --faint: #6c7889;
  --line: #2b3543;
  --line-strong: #3c4859;
  --accent: #e8edf4;
  --accent-deep: #ffffff;
  --accent-tint: #232b37;
  --accent-line: #3c4859;
  --on-accent: #14181f;
  --signal: #e8a866;
  --signal-tint: #2a2318;
  --signal-line: #4a3a24;
  --slate: #79b8e0;
  --slate-deep: #a5d3f0;
  --slate-tint: #1a2530;
  --slate-line: #2d3f4e;
  --danger: #f0847a;
  --danger-tint: #2c1d1c;
}

/*
 * 판(카드)의 유리 — 뒤의 하늘이 비쳐 보이게 한다.
 *
 * 배경에 날씨를 그려 놓고 그 위에 불투명한 판을 덮으면 배경이 있으나 마나다.
 * 운세 화면은 진작 반투명이었는데 날씨·기록만 꽉 막혀 있어 서로 달라 보였다.
 *
 * 값을 여기 한 번만 적어도 되는 이유 —
 * color-mix 안의 var(--surface) 는 이 줄에서 계산되지 않고 쓰이는 순간
 * 풀린다. 그래서 밝을 때·어두울 때 각각의 --surface 를 알아서 따라간다.
 */
.final {
  --panel: color-mix(in srgb, var(--surface) 82%, transparent);
  --panel-line: color-mix(in srgb, var(--surface) 75%, transparent);

  /*
   * 판 안에 다시 얹히는 줄(날씨 카드 · 기록 항목)은 더 옅게 깐다.
   * 반투명 위에 반투명을 겹치면 불투명에 가까워져, 겉판만 비치고
   * 정작 목록이 있는 가운데는 다시 꽉 막힌 것처럼 보이기 때문이다.
   */
  --panel-inner: color-mix(in srgb, var(--surface) 55%, transparent);
}

.final {
  position: relative;
  display: grid;
  overflow: hidden;
  min-height: 100dvh;
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

/* 채워 넣는 것은 '어디에 있는지'를 알리는 섹션 탭뿐. 로그인은 따로 둔다 */
.nav a.on:not(.sign) {
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
 * 로그인은 늘 떠 있는 자리라 조용해야 한다.
 * 강조색은 섹션 탭이 쓰고 있으므로 여기는 청회색으로 물러난다.
 * (개인 저장소의 main.css .tint-cta 와 같은 값 — 여기서는 내 영역에만 심는다)
 */
/* 관리자 표시 — 지금 어떤 권한으로 보고 있는지 */
.admin-badge {
  padding: 4px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--danger, #c0554b) 82%, transparent);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.nav a.admin-tab {
  color: var(--danger, #c0554b);
}

.nav a.admin-tab.on {
  background: var(--danger, #c0554b);
  color: #fff;
}

.nav a.sign {
  padding: 8px 18px;
  border: 1px solid color-mix(in srgb, var(--slate) 26%, transparent);
  background: color-mix(in srgb, var(--slate) 11%, transparent);
  backdrop-filter: blur(8px);
  color: var(--slate);
  font-weight: 700;
  transition: background .2s ease, border-color .2s ease, color .2s ease;
}

.nav a.sign:hover {
  border-color: color-mix(in srgb, var(--slate) 44%, transparent);
  background: color-mix(in srgb, var(--slate) 20%, transparent);
  color: var(--slate-deep);
}

.nav a.sign.on {
  transform: translateY(1px);
}

/*
 * 로그인 화면의 '로그인' 버튼 — 기대되는 행동이라 유리처럼 비치게 한다.
 * 자식 컴포넌트 안의 요소라 :deep() 으로 닿는다. 내 영역(.final) 안에만 걸린다.
 */
.final :deep(.glass-cta) {
  border: 1px solid rgb(255 255 255 / 0.5);
  background: linear-gradient(
    110deg,
    rgb(122 132 138 / 0.42) 0%,
    rgb(74 132 108 / 0.42) 38%,
    rgb(96 148 176 / 0.44) 72%,
    rgb(150 166 176 / 0.4) 100%
  );
  backdrop-filter: blur(8px) saturate(1.25);
  color: #fff;
  font-weight: 700;
  text-shadow: 0 1px 6px rgb(20 30 34 / 0.45);
  box-shadow: 0 8px 22px rgb(60 90 90 / 0.22), inset 0 1px 0 rgb(255 255 255 / 0.4);
  transition: transform .2s ease, box-shadow .2s ease;
}

/* 눌리기 직전에는 옅어지는 게 아니라 짙어져야 한다 */
.final :deep(.glass-cta:hover),
.final :deep(.glass-cta:focus),
.final :deep(.glass-cta:active) {
  background: linear-gradient(
    110deg,
    rgb(92 102 108 / 0.68) 0%,
    rgb(46 104 80 / 0.7) 38%,
    rgb(62 116 146 / 0.72) 72%,
    rgb(112 130 142 / 0.68) 100%
  );
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgb(40 70 70 / 0.32), inset 0 1px 0 rgb(255 255 255 / 0.4);
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

<!--
  대화창은 <body> 로 옮겨져 그려지므로 scoped 로는 닿지 않는다.
  전역 블록을 쓰되 .inwoo-confirm 으로 범위를 좁혀 남의 화면에는 번지지 않게 한다.
-->
<style>
/* ──────────────────────────────────────────────────────────────
 * 확인 대화창 (ElMessageBox)
 *
 * 대화창은 <body> 끝으로 옮겨져 그려지므로 화면 안쪽 스타일이 닿지 않는다.
 * 그래서 여기 한 곳에 두되, customClass 로 이 프로젝트 대화창만 고른다 —
 * 갤러리처럼 여러 사람 화면이 한 앱에 있을 때 남의 것까지 바뀌지 않도록.
 * 색은 전부 테마 토큰을 쓴다. 테마를 바꾸면 대화창도 같이 따라온다.
 * ────────────────────────────────────────────────────────────── */
.el-overlay:has(.inwoo-confirm) {
  background: rgb(24 30 38 / 0.34);
  backdrop-filter: blur(3px);
}

.el-message-box.inwoo-confirm {
  padding: 22px 22px 18px;
  border: 0;
  border-radius: 20px;
  background: var(--surface);
  box-shadow: 0 20px 50px rgb(30 36 46 / 0.22);
}

.inwoo-confirm .el-message-box__header {
  padding: 0 0 10px;
}

.inwoo-confirm .el-message-box__title {
  color: var(--ink);
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.inwoo-confirm .el-message-box__content {
  padding: 0;
  color: var(--ink-soft);
  font-size: 13.5px;
  line-height: 1.7;
}

.inwoo-confirm .el-message-box__status.el-icon {
  color: var(--signal);
}

.inwoo-confirm .el-message-box__btns {
  padding: 18px 0 0;
  gap: 6px;
}

.inwoo-confirm .el-button {
  height: 34px;
  padding: 0 16px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}

.inwoo-confirm .el-button:hover {
  border-color: var(--line-strong);
  color: var(--ink-soft);
}

/* 되돌릴 수 없는 쪽이라 확인 버튼만 채운다 */
.inwoo-confirm .el-button--primary {
  border-color: var(--danger);
  background: var(--danger);
  color: #fff;
}

.inwoo-confirm .el-button--primary:hover {
  border-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 84%, #000);
  color: #fff;
}
</style>
