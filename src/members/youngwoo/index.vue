<script setup>
import { RouterLink, RouterView } from 'vue-router'
import '@fortawesome/fontawesome-free/css/all.min.css'
import UnitToggler from './components/UnitToggler.vue'
import { link } from './routes'
</script>

<template>
  <div class="youngwoo">
    <nav class="youngwoo-nav">
      <div class="youngwoo-nav__row">
        <RouterLink :to="link('home')" class="youngwoo-nav__link">
          <i class="fa-solid fa-cloud-sun-rain"></i> 날씨 대시보드
        </RouterLink>
        <RouterLink :to="link('about')" class="youngwoo-nav__link">
          <i class="fa-solid fa-circle-info"></i> 서비스 소개
        </RouterLink>
        <UnitToggler class="youngwoo-nav__unit" />
      </div>
    </nav>

    <RouterView />
  </div>
</template>

<style scoped>
/* 내 색·글꼴은 여기 한 곳에만 선언한다. CSS 변수는 자식으로 흘러내리므로
   하위 컴포넌트는 이것만 보고 그린다. body 나 :root 는 건드리지 않는다.

   구조색(카드 배경·글자·테두리)은 갤러리 토큰(--fg · --card)에 맞춰 밝기/어둠
   토글을 그대로 따라가게 하고, 강조색(노랑 계열)은 원래 프로젝트 팔레트를 그대로 둔다.

   내 네비는 sticky 없이 일반 흐름으로 둔다(갤러리 SiteHeader만 상단 고정).
   --nav-height는 SiteHeader 높이(36px)만 반영해서, 홈 화면 사이드바가
   SiteHeader 밑으로만 비켜 앉게 한다. */
.youngwoo {
  --color-card-background: #ffffff;
  --color-text: #232323;
  --color-text-secondary: #666666;
  --color-text-light: #999999;
  --border-color-default: #e0e0e0;

  --color-primary: #ffd966;
  --color-primary-light: #ffe599;
  --color-primary-dark: #ffcc02;
  --color-primary-darker: #f1c232;

  --color-success: #4caf50;
  --color-error: #f44336;
  --color-warning: #ff9800;
  --color-info: #2196f3;

  --color-primary-opacity-10: rgba(255, 217, 102, 0.1);
  --color-primary-opacity-20: rgba(255, 217, 102, 0.2);
  --color-primary-opacity-30: rgba(255, 217, 102, 0.3);
  --color-primary-opacity-50: rgba(255, 217, 102, 0.5);
  --color-primary-opacity-80: rgba(255, 217, 102, 0.8);

  --color-success-bg: rgba(76, 175, 80, 0.12);
  --color-error-bg: rgba(244, 67, 54, 0.12);
  --color-warm: #c2410c;

  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.15);

  --border-radius-small: 4px;
  --border-radius-medium: 8px;
  --border-radius-large: 12px;

  --nav-height: 36px;
}

@media (prefers-color-scheme: dark) {
  .youngwoo {
    --color-card-background: #1e1e1e;
    --color-text: #f0f0f0;
    --color-text-secondary: #b0b0b0;
    --color-text-light: #888888;
    --border-color-default: #3a3a3a;
  }
}

:root[data-theme='light'] .youngwoo {
  --color-card-background: #ffffff;
  --color-text: #232323;
  --color-text-secondary: #666666;
  --color-text-light: #999999;
  --border-color-default: #e0e0e0;
}

:root[data-theme='dark'] .youngwoo {
  --color-card-background: #1e1e1e;
  --color-text: #f0f0f0;
  --color-text-secondary: #b0b0b0;
  --color-text-light: #888888;
  --border-color-default: #3a3a3a;
}

.youngwoo-nav {
  height: 56px;
  margin-bottom: 4px;
}

.youngwoo-nav__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 100%;
  max-width: 1048px;
  margin: 0 auto;
  padding: 0 16px;
  background: var(--color-card-background);
  border-radius: var(--border-radius-medium);
}

.youngwoo-nav__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--border-radius-medium);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.youngwoo-nav__link:hover {
  background: var(--color-primary-opacity-10);
  color: var(--color-text);
}

.youngwoo-nav__link.router-link-exact-active {
  background: var(--color-primary-darker);
  color: #ffffff;
}

.youngwoo-nav__unit {
  margin-left: auto;
}
</style>
