import { createPost, deletePost, findPostById, listPosts, updatePost } from '../data/postStore.js'
import { createHttpError, readJsonBody, sendJson } from '../utils/httpUtils.js'

const collectionPath = '/api/dongyeol/posts'
const allowedFields = ['title', 'content', 'author']

function validatePost(input, partial = false) {
  const errors = []
  if ((!partial || Object.hasOwn(input, 'title')) && (typeof input.title !== 'string' || !input.title.trim())) errors.push('게시글 제목은 필수입니다.')
  for (const field of ['content', 'author']) {
    if (Object.hasOwn(input, field) && typeof input[field] !== 'string') errors.push(`${field === 'content' ? '내용' : '작성자'}은 문자열이어야 합니다.`)
  }
  return errors
}

function normalizePost(input, partial = false) {
  const normalized = {}
  for (const field of allowedFields) {
    if (Object.hasOwn(input, field)) normalized[field] = input[field].trim()
  }
  if (!partial) {
    normalized.content = normalized.content ?? ''
    normalized.author = normalized.author || '익명'
  }
  return normalized
}

export async function handlePostRoutes(request, response, url) {
  const itemMatch = url.pathname.match(/^\/api\/dongyeol\/posts\/(\d+)$/)

  if (request.method === 'GET' && url.pathname === collectionPath) {
    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    const posts = listPosts()
      .filter((post) => !query || post.title.toLowerCase().includes(query) || post.content.toLowerCase().includes(query) || post.author.toLowerCase().includes(query))
      .toSorted((first, second) => second.id - first.id)
    sendJson(response, 200, posts)
    return true
  }

  if (request.method === 'GET' && itemMatch) {
    const post = findPostById(Number(itemMatch[1]))
    if (!post) throw createHttpError(404, '게시글을 찾을 수 없습니다.')
    sendJson(response, 200, post)
    return true
  }

  if (request.method === 'POST' && url.pathname === collectionPath) {
    const body = await readJsonBody(request)
    const errors = validatePost(body)
    if (errors.length) throw createHttpError(400, errors.join(' '))
    sendJson(response, 201, createPost(normalizePost(body)))
    return true
  }

  if (request.method === 'PATCH' && itemMatch) {
    const postId = Number(itemMatch[1])
    if (!findPostById(postId)) throw createHttpError(404, '수정할 게시글을 찾을 수 없습니다.')
    const body = await readJsonBody(request)
    const errors = validatePost(body, true)
    if (errors.length) throw createHttpError(400, errors.join(' '))
    sendJson(response, 200, updatePost(postId, normalizePost(body, true)))
    return true
  }

  if (request.method === 'DELETE' && itemMatch) {
    const post = deletePost(Number(itemMatch[1]))
    if (!post) throw createHttpError(404, '삭제할 게시글을 찾을 수 없습니다.')
    sendJson(response, 200, post)
    return true
  }
  return false
}
