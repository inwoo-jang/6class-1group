<script setup>
/**
 * 가연의 결과물 진입점.
 * ------------------------------------------------------------------
 * 원래 App.vue 였던 껍데기다. 갤러리 안으로 들어오면서 두 가지만 달라졌다.
 *
 *   1. 주소를 '/about' 처럼 박아 두지 않고 link('about') 로 부른다.
 *      갤러리에서는 이 앱이 /m/gayeon 아래에 산다.
 *   2. main.js 가 통째로 불러 주던 전역 CSS 를 이 껍데기 안으로 들였다.
 *      여섯 사람이 한 페이지에 있으므로, 남의 화면까지 물들이면 안 된다.
 *
 * 화면에 보이는 것은 그대로다 — 색도, 여백도, 그림자도 손대지 않았다.
 */
// 아이콘 글꼴. 이 화면 곳곳에서 <i class="fa-solid ..."> 로 쓴다 —
// 불러 두지 않으면 아이콘 자리가 전부 빈칸이 된다
import '@fortawesome/fontawesome-free/css/all.min.css'

import { RouterLink, RouterView } from 'vue-router'
import FeedbackWidget from '@/members/gayeon/components/exercise/FeedbackWidget.vue'
import { useAuthStore } from '@/members/gayeon/stores/authStore'
import { ElMessage } from 'element-plus'
import { link } from './routes'

const authStore = useAuthStore()

const handleLogout = () => {
  const userName = authStore.userName
  authStore.logout()
  ElMessage.info(`${userName}님, 다음에 또 만나요! 👋`)
}
</script>

<template>
  <div class="gayeon-app">
    <div class="auth-corner">
      <template v-if="authStore.isLoggedIn">
        <span class="auth-greeting">👋 {{ authStore.userName }}님</span>
        <button class="auth-btn ghost" @click="handleLogout">로그아웃</button>
      </template>
      <template v-else>
        <RouterLink :to="link('login')" class="auth-btn ghost">로그인</RouterLink>
        <RouterLink :to="link('signup')" class="auth-btn filled">회원가입</RouterLink>
      </template>
    </div>

    <div class="app-shell">
      <nav class="navbar">
        <RouterLink :to="link('home')" class="nav-brand">
          <i class="fa-solid fa-cloud-sun"></i> 날씨 다이어리
        </RouterLink>
        <div class="nav-links">
          <RouterLink :to="link('home')" class="nav-link">홈</RouterLink>
          <RouterLink :to="link('about')" class="nav-link">소개</RouterLink>
          <RouterLink :to="link('festivals')" class="nav-link">축제</RouterLink>
          <RouterLink :to="link('mockApi')" class="nav-link">Mock API</RouterLink>
        </div>
      </nav>

      <main class="weather-app">
        <RouterView />
      </main>
    </div>
    <FeedbackWidget />
  </div>
</template>

<!--
  base.css / main.css 가 body 와 * 에 걸어 두던 것들.
  선택자 앞에 .gayeon-app 을 붙여, 이 앱 안에서만 듣게 했다.
  scoped 로 감싸면 자식 화면까지 닿지 않으므로 여기서는 쓰지 않는다.
-->
<style>
.gayeon-app {
  width: 100%;
  min-height: 100vh;
  color: var(--vt-c-indigo, #2c3e50);
  font-weight: normal;
  font-size: 15px;
  line-height: 1.6;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Fira Sans',
    'Droid Sans',
    'Helvetica Neue',
    sans-serif;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.gayeon-app *,
.gayeon-app *::before,
.gayeon-app *::after {
  box-sizing: border-box;
  margin: 0;
  font-weight: normal;
}

/*
 * 아이콘 글꼴은 굵기로 모양을 고른다 — Solid 는 900, Regular 와 Brands 는 400.
 * 위의 리셋이 전부 normal 로 눕히면 Solid 아이콘을 Regular 글꼴에서 찾게 되고,
 * 거기 없는 것은 빈 네모로 나온다.
 *
 * ::before 까지 함께 세워야 한다. 아이콘은 그 자리에 그려지는데, 위의 리셋이
 * 가상 요소를 콕 집어 눕히므로 부모에게서 굵기를 물려받지 못한다.
 */
.gayeon-app .fa-solid,
.gayeon-app .fa-solid::before,
.gayeon-app .fas,
.gayeon-app .fas::before {
  font-weight: 900;
}

.gayeon-app .fa-regular,
.gayeon-app .fa-regular::before,
.gayeon-app .far,
.gayeon-app .far::before,
.gayeon-app .fa-brands,
.gayeon-app .fa-brands::before,
.gayeon-app .fab,
.gayeon-app .fab::before {
  font-weight: 400;
}

.gayeon-app a {
  padding: 3px;
  color: hsla(160, 100%, 37%, 1);
  text-decoration: none;
  transition: 0.4s;
}

@media (hover: hover) {
  .gayeon-app a:hover {
    background-color: hsla(160, 100%, 37%, 0.2);
  }
}
</style>

<style scoped>
.auth-corner {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 40;
  display: flex;
  gap: 8px;
}
.auth-btn {
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}
.auth-btn.ghost {
  background-color: rgba(255, 255, 255, 0.85);
  color: #45415f;
  border: 2px solid #f1ecff;
}
.auth-btn.ghost:hover {
  border-color: #ff7faa;
  color: #ff7faa;
}
.auth-btn.filled {
  background-color: #ff7faa;
  color: #ffffff;
}
.auth-btn.filled:hover {
  background-color: #ff5c8a;
}
.auth-greeting {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  color: #45415f;
}

.app-shell {
  position: relative;
  z-index: 0;
  min-height: 100vh;
  width: 100%;
  padding: 40px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(160deg, #fff8ef 0%, #eaf6ff 60%, #eef2ff 100%);
}

.navbar {
  width: 100%;
  max-width: 720px;
  margin-bottom: 16px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(6px);
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(69, 65, 95, 0.08);
  box-sizing: border-box;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Jua', 'Pretendard', sans-serif;
  font-size: 15px;
  color: #45415f;
  text-decoration: none;
}
.nav-links {
  display: flex;
  gap: 6px;
}
.nav-link {
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #a6a0be;
  text-decoration: none;
  transition: all 0.2s ease;
}
.nav-link:hover {
  color: #ff7faa;
}
.nav-link.router-link-exact-active {
  background-color: #ff7faa;
  color: #ffffff;
}

.weather-app {
  width: 100%;
  max-width: 720px;
  padding: 32px;
  background-color: #ffffff;
  color: #45415f;
  border-radius: 28px;
  box-shadow: 0 20px 50px rgba(69, 65, 95, 0.1);
  font-family:
    'Pretendard',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  box-sizing: border-box;
}

@media (max-width: 480px) {
  .navbar {
    border-radius: 20px;
  }
  .auth-corner {
    top: 12px;
    right: 12px;
  }
  .auth-btn {
    padding: 6px 12px;
    font-size: 11px;
  }
}
</style>
