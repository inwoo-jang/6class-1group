<script setup>
import { RouterLink, RouterView } from 'vue-router'
import FeedbackWidget from '@/members/gayeon/components/exercise/FeedbackWidget.vue'
import { useAuthStore } from '@/members/gayeon/stores/authStore'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()

const handleLogout = () => {
  const userName = authStore.userName
  authStore.logout()
  ElMessage.info(`${userName}님, 다음에 또 만나요! 👋`)
}
</script>

<template>
  <div class="auth-corner">
    <template v-if="authStore.isLoggedIn">
      <span class="auth-greeting">👋 {{ authStore.userName }}님</span>
      <button class="auth-btn ghost" @click="handleLogout">로그아웃</button>
    </template>
    <template v-else>
      <RouterLink to="/login" class="auth-btn ghost">로그인</RouterLink>
      <RouterLink to="/signup" class="auth-btn filled">회원가입</RouterLink>
    </template>
  </div>

  <div class="app-shell">
    <nav class="navbar">
      <RouterLink to="/" class="nav-brand">
        <i class="fa-solid fa-cloud-sun"></i> 날씨 다이어리
      </RouterLink>
      <div class="nav-links">
        <RouterLink to="/" class="nav-link">홈</RouterLink>
        <RouterLink to="/about" class="nav-link">소개</RouterLink>
        <RouterLink to="/festivals" class="nav-link">축제</RouterLink>
        <RouterLink to="/mock-api" class="nav-link">Mock API</RouterLink>
      </div>
    </nav>

    <main class="weather-app">
      <RouterView />
    </main>
  </div>
  <FeedbackWidget />
</template>

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
