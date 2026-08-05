import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchAllRecords, removeAnyRecord, resetAllRecords } from '../data/fortuneApi'

/**
 * 관리자 Store — 전체 기록 조회 · 삭제 · 초기화
 * ------------------------------------------------------------------
 * 내 기록을 담는 recordStore 와 일부러 나눠 두었다.
 *   · 담는 것이 다르다 (내 것 / 모두의 것)
 *   · 지우는 길이 다르다 (/fortune-records/:id / /admin/records/:id)
 *   · 하나로 합치면 "지금 이 목록이 누구 것인지"를 화면마다 따져야 한다
 *
 * 권한은 여기서 확인하지 않는다. 서버가 403 으로 막고, 그 메시지를 그대로 보인다.
 */
export const useAdminStore = defineStore('admin', () => {
  const records = ref([])
  const isLoading = ref(false)
  const isWorking = ref(false)
  const errorMessage = ref('')

  /** 사람별로 몇 건인지 — 화면 위 요약에 쓴다 */
  const byOwner = computed(() => {
    const map = new Map()
    for (const record of records.value) {
      const name = record.owner?.name ?? '알 수 없음'
      map.set(name, (map.get(name) ?? 0) + 1)
    }
    return [...map].map(([name, count]) => ({ name, count }))
  })

  /** 종류별로 몇 건인지 */
  const byKind = computed(() => {
    const map = { tarot: 0, test: 0, game: 0 }
    for (const record of records.value) map[record.kind ?? 'tarot'] += 1
    return map
  })

  const load = async () => {
    isLoading.value = true
    errorMessage.value = ''
    try {
      records.value = await fetchAllRecords()
    } catch (error) {
      records.value = []
      errorMessage.value = error.message
    } finally {
      isLoading.value = false
    }
  }

  /** 한 건 지우기 — 성공하면 목록에서도 바로 뺀다 */
  const remove = async (id) => {
    isWorking.value = true
    errorMessage.value = ''
    try {
      await removeAnyRecord(id)
      records.value = records.value.filter((record) => record.id !== id)
      return true
    } catch (error) {
      errorMessage.value = error.message
      return false
    } finally {
      isWorking.value = false
    }
  }

  /** 전부 비우기 */
  const resetAll = async () => {
    isWorking.value = true
    errorMessage.value = ''
    try {
      await resetAllRecords()
      records.value = []
      return true
    } catch (error) {
      errorMessage.value = error.message
      return false
    } finally {
      isWorking.value = false
    }
  }

  return { records, isLoading, isWorking, errorMessage, byOwner, byKind, load, remove, resetAll }
})
