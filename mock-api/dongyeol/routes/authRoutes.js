import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import process from 'node:process'

import { createHttpError, readJsonBody, sendJson } from '../utils/httpUtils.js'

const prefix = '/api/dongyeol'
const mockUsers = [
  { id: 1, email: 'student@skala.com', password: '1234', name: 'SKALA 수강생', role: 'STUDENT', department: 'Frontend Class' },
  { id: 2, email: 'admin@skala.com', password: 'admin1234', name: '실습 관리자', role: 'ADMIN', department: 'Training Center' },
]
const jwtSecret = process.env.DONGYEOL_MOCK_JWT_SECRET || process.env.MOCK_JWT_SECRET || 'dongyeol-mock-secret-for-classroom-only'
const tokenTtlSeconds = 60 * 60
const encodeJson = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
const toPublicUser = ({ password: _password, ...user }) => user

function createAccessToken(user) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = { sub: String(user.id), email: user.email, name: user.name, role: user.role, iat: issuedAt, exp: issuedAt + tokenTtlSeconds, iss: 'dongyeol-vue-mock-api' }
  const unsignedToken = `${encodeJson(header)}.${encodeJson(payload)}`
  const signature = crypto.createHmac('sha256', jwtSecret).update(unsignedToken).digest('base64url')
  return `${unsignedToken}.${signature}`
}

function verifyAccessToken(token) {
  const segments = token.split('.')
  if (segments.length !== 3) throw createHttpError(401, '올바른 JWT 형식이 아닙니다.')
  const [encodedHeader, encodedPayload, receivedSignature] = segments
  const unsignedToken = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = crypto.createHmac('sha256', jwtSecret).update(unsignedToken).digest('base64url')
  const expectedBuffer = Buffer.from(expectedSignature)
  const receivedBuffer = Buffer.from(receivedSignature)
  if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) throw createHttpError(401, 'JWT 서명이 올바르지 않습니다.')

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
    if (payload.iss !== 'dongyeol-vue-mock-api' || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) throw createHttpError(401, 'Access Token이 만료되었거나 올바르지 않습니다.')
    return payload
  } catch (error) {
    if (error.statusCode) throw error
    throw createHttpError(401, 'JWT Payload를 해석할 수 없습니다.')
  }
}

function authenticateRequest(request) {
  const [tokenType, token] = (request.headers.authorization ?? '').split(' ')
  if (tokenType !== 'Bearer' || !token) throw createHttpError(401, 'Bearer Access Token이 필요합니다.')
  const payload = verifyAccessToken(token)
  const user = mockUsers.find(({ id }) => String(id) === payload.sub)
  if (!user) throw createHttpError(401, '토큰의 사용자를 찾을 수 없습니다.')
  return toPublicUser(user)
}

export async function handleAuthRoutes(request, response, url) {
  if (request.method === 'POST' && url.pathname === `${prefix}/auth/login`) {
    const body = await readJsonBody(request)
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    if (!email || !password) throw createHttpError(400, '이메일과 비밀번호를 입력해주세요.')
    const user = mockUsers.find((item) => item.email === email && item.password === password)
    if (!user) throw createHttpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.')
    sendJson(response, 200, {
      message: '로그인에 성공했습니다.',
      tokenType: 'Bearer',
      accessToken: createAccessToken(user),
      expiresIn: tokenTtlSeconds,
      user: toPublicUser(user),
    })
    return true
  }

  if (request.method === 'GET' && url.pathname === `${prefix}/auth/me`) {
    sendJson(response, 200, authenticateRequest(request))
    return true
  }

  if (request.method === 'GET' && url.pathname === `${prefix}/auth/protected-message`) {
    const user = authenticateRequest(request)
    sendJson(response, 200, { message: `${user.name}님, JWT 인증이 필요한 API 호출에 성공했습니다.`, role: user.role, requestedAt: new Date().toISOString() })
    return true
  }
  return false
}
