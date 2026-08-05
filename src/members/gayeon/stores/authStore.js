import { defineStore } from 'pinia'

const AUTH_KEY = 'weather-diary-auth'

const loadAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : { isLoggedIn: false, userName: '' }
  } catch {
    return { isLoggedIn: false, userName: '' }
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => loadAuth(),
  actions: {
    login(userName) {
      this.isLoggedIn = true
      this.userName = userName
      localStorage.setItem(AUTH_KEY, JSON.stringify({ isLoggedIn: true, userName }))
    },
    logout() {
      this.isLoggedIn = false
      this.userName = ''
      localStorage.setItem(AUTH_KEY, JSON.stringify({ isLoggedIn: false, userName: '' }))
    },
  },
})
