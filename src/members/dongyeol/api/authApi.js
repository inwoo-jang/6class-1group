import { browserFallback } from './browserFallback.js'
import { accessTokenKey, http, withBrowserFallback } from './http.js'

export const authApi = {
  async login(credentials) {
    return withBrowserFallback(
      async () => (await http.post('/auth/login', credentials)).data,
      () => browserFallback.login(credentials),
    )
  },

  async getMyProfile() {
    return withBrowserFallback(
      async () => (await http.get('/auth/me')).data,
      () => browserFallback.getMyProfile(sessionStorage.getItem(accessTokenKey)),
    )
  },

  async getProtectedMessage() {
    return withBrowserFallback(
      async () => (await http.get('/auth/protected-message')).data,
      () => browserFallback.getProtectedMessage(sessionStorage.getItem(accessTokenKey)),
    )
  },
}
