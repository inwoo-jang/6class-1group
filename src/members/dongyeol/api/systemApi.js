import { browserFallback } from './browserFallback.js'
import { http, withBrowserFallback } from './http.js'

export const systemApi = {
  async getHealth() {
    return withBrowserFallback(
      async () => (await http.get('/health')).data,
      () => browserFallback.getHealth(),
    )
  },

  async reset() {
    return withBrowserFallback(
      async () => (await http.post('/reset')).data,
      () => browserFallback.reset(),
    )
  },
}
