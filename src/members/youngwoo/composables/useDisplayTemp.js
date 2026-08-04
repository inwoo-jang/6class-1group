import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useConfigStore } from '../stores/configStore'
import { convertTemp } from '../utils/temperature'

// 섭씨 원본 값을 store의 단위 설정에 맞춰 반응형으로 변환한다.
// source: 원본(섭씨) 값을 반환하는 getter 함수. 생략하면 unit/unitSymbol만 사용한다.
export function useDisplayTemp(source) {
  const configStore = useConfigStore()
  const { unit, unitSymbol } = storeToRefs(configStore)

  const displayTemp = computed(() => {
    if (!source) return null
    const celsius = source()
    return celsius == null ? null : convertTemp(celsius, unit.value)
  })

  return { unit, unitSymbol, displayTemp }
}
