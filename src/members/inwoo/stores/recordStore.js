import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createRecord, fetchRecords, removeRecord } from '../data/fortuneApi'


/**
 * 운세 기록 Store — 목록 · 등록 · 메모 수정 · 삭제
 * ------------------------------------------------------------------
 * 타로 화면(기록을 만든다)과 기록 화면(그 목록을 본다)은 형제라 서로에게
 * props 를 내려 줄 수 없다. 그래서 목록은 여기 한 곳에 둔다.
 *
 * 화면이 신경 쓸 것은 셋뿐이다 — records · isLoading · errorMessage.
 * 서버와 이야기하는 방식은 fortuneApi.js 가, 그 결과를 담는 일은 여기가 맡는다.
 */
/**
 * 기록의 큰 갈래. 목록 위 필터는 이 둘로만 나눈다.
 *
 * '오늘의 운세'·'솔로연애운' 같은 세부 이름으로 필터를 만들면 칩이 계속 늘어나고,
 * 테스트가 추가될 때마다 또 늘어난다. 세부 이름은 각 기록 카드 안에서 보여 주고,
 * 위에서는 운세인지 테스트인지만 고르게 한다.
 */
export const RECORD_KINDS = [
  { key: 'tarot', label: '운세', emoji: '🔮' },
  { key: 'test', label: '테스트', emoji: '🧪' },
  { key: 'game', label: '게임', emoji: '🎲' },
]

export const useRecordStore = defineStore('fortuneRecord', () => {
  // ── state ──
  const records = ref([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref('')

  /** 목록 위 필터 — 빈 문자열이면 전체 */
  const filterKind = ref('')

  // ── getters ──
  const count = computed(() => records.value.length)

  /**
   * 종류별 개수는 필터를 걸어도 흔들리면 안 된다.
   * 그런데 서버가 걸러서 준 목록으로 세면 "연애운 3건"만 남은 채 전체가 3건처럼 보인다.
   * 그래서 개수는 필터 없이 받아 둔 전체(allRecords)로 센다.
   */
  const allRecords = ref([])

  const kindCounts = computed(() =>
    RECORD_KINDS.reduce(
      (acc, { key }) => ({
        ...acc,
        [key]: allRecords.value.filter((record) => (record.kind ?? 'tarot') === key).length,
      }),
      {},
    ),
  )

  // ── actions ──

  /** 목록 받아오기. 필터가 걸려 있으면 서버가 걸러서 준다 */
  const load = async () => {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const [filtered, all] = await Promise.all([
        fetchRecords(filterKind.value),
        filterKind.value ? fetchRecords('') : Promise.resolve(null),
      ])
      records.value = filtered
      // 필터가 없으면 방금 받은 목록이 곧 전체다 — 같은 걸 두 번 받지 않는다
      allRecords.value = all ?? filtered
    } catch (error) {
      errorMessage.value = error.message
      records.value = []
      allRecords.value = []
    } finally {
      isLoading.value = false
    }
  }

  /** 필터를 바꾸면 곧바로 다시 받아 온다 */
  const setFilter = async (kind) => {
    filterKind.value = kind
    await load()
  }

  /**
   * 기록 남기기.
   * 성공하면 목록 맨 앞에 끼워 넣는다 — 서버가 최신순으로 주기 때문에
   * 굳이 전체를 다시 받지 않아도 화면이 서버와 같은 순서가 된다.
   */
  const add = async (payload) => {
    isSaving.value = true
    errorMessage.value = ''
    try {
      const saved = await createRecord(payload)
      allRecords.value = [saved, ...allRecords.value]
      if (!filterKind.value || filterKind.value === (saved.kind ?? 'tarot')) {
        records.value = [saved, ...records.value]
      }
      return saved
    } catch (error) {
      errorMessage.value = error.message
      return null
    } finally {
      isSaving.value = false
    }
  }

  /** 지우기 */
  const remove = async (id) => {
    errorMessage.value = ''
    try {
      await removeRecord(id)
      const drop = (list) => list.filter((record) => record.id !== id)
      records.value = drop(records.value)
      allRecords.value = drop(allRecords.value)
      return true
    } catch (error) {
      errorMessage.value = error.message
      return false
    }
  }

  /** 로그아웃하면 남의 화면에 내 기록이 남지 않도록 비운다 */
  const clear = () => {
    records.value = []
    allRecords.value = []
    filterKind.value = ''
    errorMessage.value = ''
  }

  return {
    records,
    allRecords,
    isLoading,
    isSaving,
    errorMessage,
    filterKind,
    count,
    kindCounts,
    load,
    setFilter,
    add,
    remove,
    clear,
  }
})
