import { getPostCount, resetPosts } from '../data/postStore.js'
import { getProductCount, resetProducts } from '../data/productStore.js'
import { sendJson } from '../utils/httpUtils.js'

const prefix = '/api/dongyeol'

export function handleSystemRoutes(request, response, url) {
  if (request.method === 'GET' && url.pathname === `${prefix}/health`) {
    sendJson(response, 200, {
      status: 'ok',
      service: 'Dongyeol Mock API',
      productCount: getProductCount(),
      postCount: getPostCount(),
      authentication: 'ready',
      transport: 'node',
    })
    return true
  }

  if (request.method === 'POST' && url.pathname === `${prefix}/reset`) {
    const products = resetProducts()
    const posts = resetPosts()
    sendJson(response, 200, {
      message: '상품과 게시글 Mock 데이터가 초기화되었습니다.',
      productCount: products.length,
      postCount: posts.length,
    })
    return true
  }
  return false
}
