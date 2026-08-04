// 네이티브 fetch는 타임아웃이 없어서, 서버가 응답을 아예 안 주면 무한 로딩에 빠진다.
// AbortController로 일정 시간 뒤 강제로 요청을 끊는다.
export async function fetchWithTimeout(url, { timeout = 10000, ...options } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}
