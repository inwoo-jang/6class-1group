import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchMe, login as requestLogin, onAuthExpired, setAccessToken } from '../data/fortuneApi'

/**
 * 로그인 Store — 교안 6장(Pinia)
 * ------------------------------------------------------------------
 * "지금 누가 로그인해 있는가"는 한 화면의 사정이 아니다.
 * 내비게이션(로그아웃 버튼) · 기록 화면 · 라우터 가드가 전부 같은 답을 봐야 한다.
 * 그래서 화면 밖 사물함에 하나만 둔다.
 *
 * 토큰은 localStorage 에 남긴다. 새로고침해도 로그인이 풀리지 않아야 하기 때문이다.
 * 다만 진짜 판단은 서버가 한다 — 아래 restore() 가 /api/auth/me 로 확인한다.
 */
const TOKEN_KEY = 'inwoo-final-token'

export const useAuthStore = defineStore('auth', () => {
  // ── state ──
  const token = ref(localStorage.getItem(TOKEN_KEY) ?? '')
  const user = ref(null)
  const isLoading = ref(false)
  const errorMessage = ref('')

  // 새로고침 직후, 화면이 그려지기 전에 API 창구도 같은 토큰을 알고 있어야 한다
  setAccessToken(token.value)

  // ── getters ──
  const isLoggedIn = computed(() => Boolean(token.value))
  const displayName = computed(() => user.value?.name ?? '')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  /** 토큰을 한 곳에서만 갈아 끼운다 — Store · localStorage · API 창구가 항상 같은 값 */
  const applyToken = (next) => {
    token.value = next ?? ''
    setAccessToken(token.value)
    if (token.value) localStorage.setItem(TOKEN_KEY, token.value)
    else localStorage.removeItem(TOKEN_KEY)
  }

  // ── actions ──
  const logout = () => {
    applyToken('')
    user.value = null
    errorMessage.value = ''
  }

  /**
   * 토큰이 만료되면 서버가 401 로 답한다.
   * 그때 조용히 로그아웃시켜, 화면이 "로그인한 척"하고 있지 않도록 한다.
   */
  onAuthExpired(logout)

  const login = async (email, password) => {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const data = await requestLogin(email, password)
      applyToken(data.accessToken)
      user.value = data.user
      return true
    } catch (error) {
      logout()
      errorMessage.value = error.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 새로고침 뒤 한 번 부른다.
   * 저장해 둔 토큰이 아직 살아 있는지는 서버만 알고 있으므로 물어본다.
   * 죽었으면 onAuthExpired → logout 이 이미 정리해 준다.
   */
  const restore = async () => {
    if (!token.value || user.value) return
    try {
      user.value = await fetchMe()
    } catch {
      logout()
    }
  }

  return {
    token,
    user,
    isLoading,
    errorMessage,
    isLoggedIn,
    displayName,
    isAdmin,
    login,
    logout,
    restore,
  }
})
