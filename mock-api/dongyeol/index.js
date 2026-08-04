import { handleAuthRoutes } from './routes/authRoutes.js'
import { handlePostRoutes } from './routes/postRoutes.js'
import { handleProductRoutes } from './routes/productRoutes.js'
import { handleSystemRoutes } from './routes/systemRoutes.js'
import { sendError, sendJson, waitForRequestedDelay } from './utils/httpUtils.js'

const prefix = '/api/dongyeol'

export async function handleDongyeolRoutes(request, response, url) {
  if (url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`)) return false

  try {
    await waitForRequestedDelay(url)
    if (handleSystemRoutes(request, response, url)) return true
    if (await handleAuthRoutes(request, response, url)) return true
    if (await handleProductRoutes(request, response, url)) return true
    if (await handlePostRoutes(request, response, url)) return true
    sendJson(response, 404, { message: '존재하지 않는 동열 API 경로입니다.' })
  } catch (error) {
    sendError(response, error)
  }
  return true
}
