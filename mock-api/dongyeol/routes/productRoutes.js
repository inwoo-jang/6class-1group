import { createProduct, deleteProduct, findProductById, listProducts, updateProduct } from '../data/productStore.js'
import { createHttpError, readJsonBody, sendJson } from '../utils/httpUtils.js'

const collectionPath = '/api/dongyeol/products'
const allowedFields = ['name', 'category', 'price', 'stock', 'description']

function validateProduct(input, partial = false) {
  const errors = []
  if ((!partial || Object.hasOwn(input, 'name')) && (typeof input.name !== 'string' || !input.name.trim())) errors.push('상품명은 필수입니다.')
  if ((!partial || Object.hasOwn(input, 'price')) && (input.price === '' || !Number.isFinite(Number(input.price)) || Number(input.price) < 0)) errors.push('가격은 0 이상의 숫자여야 합니다.')
  if ((!partial || Object.hasOwn(input, 'stock')) && (input.stock === '' || !Number.isInteger(Number(input.stock)) || Number(input.stock) < 0)) errors.push('재고는 0 이상의 정수여야 합니다.')
  if (Object.hasOwn(input, 'category') && typeof input.category !== 'string') errors.push('카테고리는 문자열이어야 합니다.')
  if (Object.hasOwn(input, 'description') && typeof input.description !== 'string') errors.push('상품 설명은 문자열이어야 합니다.')
  return errors
}

function normalizeProduct(input, partial = false) {
  const normalized = {}
  for (const field of allowedFields) {
    if (!Object.hasOwn(input, field)) continue
    normalized[field] = field === 'price' || field === 'stock' ? Number(input[field]) : field === 'name' ? input[field].trim() : input[field]
  }
  if (!partial) {
    normalized.category = normalized.category?.trim() || '기타'
    normalized.description = normalized.description ?? ''
  }
  return normalized
}

export async function handleProductRoutes(request, response, url) {
  const itemMatch = url.pathname.match(/^\/api\/dongyeol\/products\/(\d+)$/)

  if (request.method === 'GET' && url.pathname === collectionPath) {
    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    const category = url.searchParams.get('category') ?? '전체'
    const onlyAvailable = url.searchParams.get('available') === 'true'
    const result = listProducts().filter((product) => {
      const matchesQuery = !query || product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query)
      return matchesQuery && (category === '전체' || product.category === category) && (!onlyAvailable || product.stock > 0)
    })
    sendJson(response, 200, result)
    return true
  }

  if (request.method === 'GET' && itemMatch) {
    const product = findProductById(Number(itemMatch[1]))
    if (!product) throw createHttpError(404, '상품을 찾을 수 없습니다.')
    sendJson(response, 200, product)
    return true
  }

  if (request.method === 'POST' && url.pathname === collectionPath) {
    const body = await readJsonBody(request)
    const errors = validateProduct(body)
    if (errors.length) throw createHttpError(400, errors.join(' '))
    sendJson(response, 201, createProduct(normalizeProduct(body)))
    return true
  }

  if (request.method === 'PATCH' && itemMatch) {
    const productId = Number(itemMatch[1])
    if (!findProductById(productId)) throw createHttpError(404, '수정할 상품을 찾을 수 없습니다.')
    const body = await readJsonBody(request)
    const errors = validateProduct(body, true)
    if (errors.length) throw createHttpError(400, errors.join(' '))
    sendJson(response, 200, updateProduct(productId, normalizeProduct(body, true)))
    return true
  }

  if (request.method === 'DELETE' && itemMatch) {
    const product = deleteProduct(Number(itemMatch[1]))
    if (!product) throw createHttpError(404, '삭제할 상품을 찾을 수 없습니다.')
    sendJson(response, 200, product)
    return true
  }
  return false
}
