import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * AI 해석에 쓸 API 키를 담아 두는 Store.
 *
 * ── 왜 키를 소스에 두지 않는가 ──
 * Vite 의 VITE_ 환경변수는 빌드할 때 번들 파일 안에 글자 그대로 박힌다.
 * 그래서 키를 .env 에 넣고 배포하면 dist/assets/*.js 를 열어 본 누구나
 * 그 키를 그대로 꺼내 쓸 수 있다. 저장소가 Public 이면 더 말할 것도 없다.
 *
 * 그래서 이 앱은 키를 세 곳 중 어디에도 남기지 않는다.
 *   · 소스 코드     — 없음
 *   · Git 기록      — 없음 (.env.local 은 .gitignore 의 *.local 에 걸린다)
 *   · 배포 번들     — 없음
 *
 * 대신 쓰는 사람이 자기 키를 화면에서 넣고, 그 값은 이 브라우저의
 * localStorage 에만 남는다. 키가 없으면 AI 대신 카드 기본 해설이 나온다.
 */
const STORAGE_KEY = 'inwoo-openai-key'

export const useAiStore = defineStore('ai', () => {
  /**
   * 개발 서버에서만 .env.local 의 값을 기본으로 쓴다.
   *
   * import.meta.env.DEV 는 빌드할 때 false 라는 글자로 치환되고, 그러면
   * 이 삼항식이 통째로 접혀 키 문자열이 번들에 아예 남지 않는다.
   * (그냥 VITE_ 변수만 읽으면 dist/assets/*.js 안에 키가 그대로 박힌다)
   *
   * 이 값은 localStorage 에 옮겨 적지 않는다 — 저장할 값은 사용자가 넣은 것뿐이다.
   */
  const devKey = import.meta.env.DEV ? (import.meta.env.VITE_OPENAI_API_KEY ?? '') : ''

  const apiKey = ref(localStorage.getItem(STORAGE_KEY) ?? devKey)

  const hasKey = computed(() => apiKey.value.trim().length > 0)

  /** 화면에 보여 줄 때는 앞뒤만 남긴다 (어떤 키를 넣었는지 확인용) */
  const maskedKey = computed(() => {
    const value = apiKey.value.trim()
    if (value.length < 12) return value ? '••••' : ''
    return `${value.slice(0, 7)}…${value.slice(-4)}`
  })

  function setKey(next) {
    apiKey.value = (next ?? '').trim()
    if (apiKey.value) localStorage.setItem(STORAGE_KEY, apiKey.value)
    else localStorage.removeItem(STORAGE_KEY)
  }

  function clearKey() {
    setKey('')
  }

  return { apiKey, hasKey, maskedKey, setKey, clearKey }
})
