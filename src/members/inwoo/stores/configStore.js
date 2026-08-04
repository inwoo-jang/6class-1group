import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * 누적 과제 5 — 날씨 단위 Store (교안 191쪽)
 *
 * 온도 단위는 메인 화면과 상세 화면이 함께 보는 값이다.
 * 두 화면은 형제라 서로에게 props 를 내려 줄 수 없고, 공통 부모까지 값을
 * 끌어올리면 그 부모가 상관없는 상태까지 떠안게 된다.
 * 그래서 화면 밖의 공용 사물함(Store)에 하나만 두고 둘 다 여기를 본다.
 *
 * 주의: 컴포넌트에서 꺼낼 때 unit·unitSymbol 은 storeToRefs() 로 감싸야
 * 반응성이 끊기지 않는다. toggleUnit 은 함수라 그냥 꺼내 쓴다.
 */
export const useConfigStore = defineStore('config', () => {
  // 1. state: 단위를 저장하는 변수 (초기값은 'celsius')
  // 값은 오직 'celsius' 또는 'fahrenheit' 두 가지만 가집니다.
  const unit = ref('celsius')

  // 2. getters: 현재 단위 상태에 맞춰 화면에 뿌릴 기호(℃ / ℉)를 실시간 리턴
  const unitSymbol = computed(() => {
    return unit.value === 'celsius' ? '℃' : '℉'
  })

  /**
   * getter 하나 더 — 섭씨 원본을 지금 단위로 바꿔 주는 함수.
   *
   * 교안 191쪽의 환산식 (섭씨 × 9) / 5 + 32 를 여기 한 곳에만 둔다.
   * 목록 · 상세 · 시간별 예보가 전부 같은 식을 써야 하는데,
   * 화면마다 적어 두면 나중에 한 곳만 고치고 나머지를 잊게 된다.
   *
   * computed 가 "함수"를 돌려주므로 화면에서는 toUnit(28) 처럼 쓴다.
   */
  const toUnit = computed(() => (celsius) => {
    if (unit.value === 'celsius') return celsius
    return Math.round((celsius * 9) / 5 + 32)
  })

  // 3. actions: 버튼 클릭 시 'celsius'와 'fahrenheit'를 토글(스위칭)하는 함수
  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
  }

  /** 토글이 아니라 "이 단위로" 콕 집어 정할 때 (℃ · ℉ 두 칸짜리 스위치에서 쓴다) */
  function setUnit(next) {
    if (next === 'celsius' || next === 'fahrenheit') unit.value = next
  }

  return {
    unit,
    unitSymbol,
    toUnit,
    toggleUnit,
    setUnit,
  }
})
