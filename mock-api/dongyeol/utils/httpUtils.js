import { Buffer } from 'node:buffer'

const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Dongyeol-Lab-Client',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Dongyeol-Lab-Transport': 'node',
}

export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, corsHeaders)
  if (statusCode === 204) return response.end()
  response.end(JSON.stringify(payload))
}

export function createHttpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let receivedBytes = 0
    let isTooLarge = false

    request.on('data', (chunk) => {
      receivedBytes += chunk.length
      if (receivedBytes > 1_000_000) {
        isTooLarge = true
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => {
      if (isTooLarge) return reject(createHttpError(413, '요청 본문은 1MB를 넘을 수 없습니다.'))
      if (chunks.length === 0) return resolve({})
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        if (!body || Array.isArray(body) || typeof body !== 'object') return reject(createHttpError(400, '요청 본문은 JSON 객체여야 합니다.'))
        resolve(body)
      } catch (error) {
        reject(error.statusCode ? error : createHttpError(400, '올바른 JSON 형식이 아닙니다.'))
      }
    })
    request.on('error', reject)
  })
}

export function sendError(response, error) {
  const statusCode = Number(error.statusCode) || 500
  if (statusCode >= 500) console.error(error)
  sendJson(response, statusCode, { message: statusCode === 500 ? '서버 내부 오류가 발생했습니다.' : error.message })
}

export async function waitForRequestedDelay(url) {
  const requestedDelay = Number(url.searchParams.get('delay') ?? 0)
  const delay = Number.isFinite(requestedDelay) ? Math.min(Math.max(requestedDelay, 0), 3000) : 0
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))
}
