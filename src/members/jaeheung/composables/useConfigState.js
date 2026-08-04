import { reactive } from 'vue'

// Pinia 없이 모듈 스코프 싱글턴으로 흉내낸 미니 상태 저장소.
// 갤러리의 main.js에 Pinia가 설치되어 있지 않으므로 의존성을 새로 얹지 않는다.
// reactive()로 감싸야 컴포넌트에서 `configStore.unit` 처럼 중첩 접근해도
// (구조분해 없이도) 반응형이 유지된다 — Pinia 스토어 인스턴스와 동일한 사용감.
const state = reactive({
  unit: 'celsius',
  get unitSymbol() {
    return state.unit === 'fahrenheit' ? '°F' : '°C'
  },
  toggleUnit() {
    state.unit = state.unit === 'celsius' ? 'fahrenheit' : 'celsius'
  },
})

export function useConfigStore() {
  return state
}
