<script setup>
import '@/assets/mockapi.css'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { systemApi } from '@/api/systemApi.js'
import PostManager from '@/components/mockapi/PostManager.vue'
import ProductManager from '@/components/mockapi/ProductManager.vue'
import StatusBanner from '@/components/mockapi/StatusBanner.vue'

const activeTab = ref('products')
const health = ref(null)
const isChecking = ref(false)
const isResetting = ref(false)
const refreshKey = ref(0)
const notice = ref(null)

let noticeTimer

function showNotice(payload) {
  notice.value = payload
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    notice.value = null
  }, 3500)
}

async function checkHealth() {
  isChecking.value = true
  try {
    health.value = await systemApi.getHealth()
  } catch (error) {
    health.value = null
    showNotice({ type: 'error', message: error.message })
  } finally {
    isChecking.value = false
  }
}

async function resetAllData() {
  const accepted = window.confirm('상품과 게시글 데이터를 처음 상태로 되돌릴까요?')
  if (!accepted) return

  isResetting.value = true
  try {
    const result = await systemApi.reset()
    refreshKey.value += 1
    await checkHealth()
    showNotice({ type: 'success', message: result.message })
  } catch (error) {
    showNotice({ type: 'error', message: error.message })
  } finally {
    isResetting.value = false
  }
}

onMounted(checkHealth)
onBeforeUnmount(() => clearTimeout(noticeTimer))
</script>

<template>
  <div class="app-shell">
    <header class="hero">
      <div class="hero__eyebrow">VUE 3 · AXIOS · NODE HTTP</div>
      <div class="hero__body">
        <div>
          <h1>Mock API 실습실</h1>
          <p>상품과 게시글 CRUD를 직접 실행하며 Vue의 비동기 통신 흐름을 익혀보세요.</p>
        </div>

        <div class="server-card" aria-live="polite">
          <span
            class="server-card__indicator"
            :class="{ 'server-card__indicator--online': health }"
          ></span>
          <div>
            <strong>{{ health ? 'API 연결됨' : 'API 연결 확인 필요' }}</strong>
            <small v-if="health"
              >상품 {{ health.productCount }}개 · 게시글 {{ health.postCount }}개</small
            >
            <small v-else>localhost:3001</small>
          </div>
          <button
            class="button button--ghost button--small"
            :disabled="isChecking"
            @click="checkHealth"
          >
            {{ isChecking ? '확인 중' : '다시 확인' }}
          </button>
        </div>
      </div>
    </header>

    <main class="workspace">
      <div class="toolbar">
        <nav class="tabs" aria-label="API 실습 선택">
          <button
            class="tabs__button"
            :class="{ 'tabs__button--active': activeTab === 'products' }"
            @click="activeTab = 'products'"
          >
            상품 API
          </button>
          <button
            class="tabs__button"
            :class="{ 'tabs__button--active': activeTab === 'posts' }"
            @click="activeTab = 'posts'"
          >
            게시글 API
          </button>
        </nav>

        <button class="button button--danger-soft" :disabled="isResetting" @click="resetAllData">
          {{ isResetting ? '초기화 중…' : 'Mock 데이터 초기화' }}
        </button>
      </div>

      <Transition name="notice">
        <StatusBanner v-if="notice" :type="notice.type" :message="notice.message" />
      </Transition>

      <ProductManager
        v-if="activeTab === 'products'"
        :refresh-key="refreshKey"
        @notify="showNotice"
        @changed="checkHealth"
      />
      <PostManager v-else :refresh-key="refreshKey" @notify="showNotice" @changed="checkHealth" />
    </main>

    <footer class="page-footer">
      <code>Vue :5173</code>
      <span>→ Axios 요청 →</span>
      <code>Mock API :3001</code>
    </footer>
  </div>
</template>
