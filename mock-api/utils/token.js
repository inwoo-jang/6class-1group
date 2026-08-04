import crypto from 'node:crypto'

const secret = process.env.MOCK_JWT_SECRET || 'local-practice-secret-change-me'
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

export const createToken = (user) => {
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({ sub: user.id, name: user.name, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 })
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

export const verifyToken = (authorization = '') => {
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  const [header, payload, signature] = token.split('.')
  if (!header || !payload || !signature) return null
  const expected = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return data.exp > Math.floor(Date.now() / 1000) ? data : null
  } catch {
    return null
  }
}
