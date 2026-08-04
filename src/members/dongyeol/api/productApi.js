import { browserFallback } from './browserFallback.js'
import { http, withBrowserFallback } from './http.js'

export const productApi = {
  async getAll(params = {}) {
    return withBrowserFallback(
      async () => (await http.get('/products', { params })).data,
      () => browserFallback.getProducts(params),
    )
  },

  async getById(productId) {
    return withBrowserFallback(
      async () => (await http.get(`/products/${productId}`)).data,
      () => browserFallback.getProduct(productId),
    )
  },

  async create(product) {
    return withBrowserFallback(
      async () => (await http.post('/products', product)).data,
      () => browserFallback.createProduct(product),
    )
  },

  async update(productId, patch) {
    return withBrowserFallback(
      async () => (await http.patch(`/products/${productId}`, patch)).data,
      () => browserFallback.updateProduct(productId, patch),
    )
  },

  async remove(productId) {
    return withBrowserFallback(
      async () => (await http.delete(`/products/${productId}`)).data,
      () => browserFallback.deleteProduct(productId),
    )
  },
}
