import { browserFallback } from './browserFallback.js'
import { http, withBrowserFallback } from './http.js'

export const postApi = {
  async getAll(params = {}) {
    return withBrowserFallback(
      async () => (await http.get('/posts', { params })).data,
      () => browserFallback.getPosts(params),
    )
  },

  async getById(postId) {
    return withBrowserFallback(
      async () => (await http.get(`/posts/${postId}`)).data,
      () => browserFallback.getPost(postId),
    )
  },

  async create(post) {
    return withBrowserFallback(
      async () => (await http.post('/posts', post)).data,
      () => browserFallback.createPost(post),
    )
  },

  async update(postId, patch) {
    return withBrowserFallback(
      async () => (await http.patch(`/posts/${postId}`, patch)).data,
      () => browserFallback.updatePost(postId, patch),
    )
  },

  async remove(postId) {
    return withBrowserFallback(
      async () => (await http.delete(`/posts/${postId}`)).data,
      () => browserFallback.deletePost(postId),
    )
  },
}
