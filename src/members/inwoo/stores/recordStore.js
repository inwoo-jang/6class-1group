import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createRecord,
  fetchRecords,
  removeRecord,
  updateMemo,
} from '../data/fortuneApi'
import { READING_TYPES } from '../data/tarotReading'

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
 * 기록 종류 — 타로 화면의 탭과 같은 목록이어야 한다.
 * 원본은 tarotReading.js 가 들고 있고, 여기서는 그것을 그대로 가져다 쓴다.
 * 두 곳에 따로 적어 두면 탭을 늘렸을 때 한쪽만 고치고 잊게 된다.
 *
 * (export … from 으로 곧장 넘기면 이 파일 안에서는 이름을 쓸 수 없다.
 *  아래 typeCounts 가 이 목록을 세야 하므로 한 번 받아서 다시 내보낸다.)
 */
export const RECORD_TYPES = READING_TYPES

export const useRecordStore = defineStore('fortuneRecord', () => {
  // ── state ──
  const records = ref([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref('')

  /** 목록 위 필터 — 빈 문자열이면 전체 */
  const filterType = ref('')

  // ── getters ──
  const count = computed(() => records.value.length)

  /**
   * 종류별 개수는 필터를 걸어도 흔들리면 안 된다.
   * 그런데 서버가 걸러서 준 목록으로 세면 "연애운 3건"만 남은 채 전체가 3건처럼 보인다.
   * 그래서 개수는 필터 없이 받아 둔 전체(allRecords)로 센다.
   */
  const allRecords = ref([])

  const typeCounts = computed(() =>
    RECORD_TYPES.reduce(
      (acc, type) => ({
        ...acc,
        [type]: allRecords.value.filter((record) => record.type === type).length,
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
        fetchRecords(filterType.value),
        filterType.value ? fetchRecords('') : Promise.resolve(null),
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
  const setFilter = async (type) => {
    filterType.value = type
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
      if (!filterType.value || filterType.value === saved.type) {
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

  /** 메모만 고친다 */
  const editMemo = async (id, memo) => {
    errorMessage.value = ''
    try {
      const updated = await updateMemo(id, memo)
      const replace = (list) =>
        list.map((record) => (record.id === updated.id ? updated : record))
      records.value = replace(records.value)
      allRecords.value = replace(allRecords.value)
      return true
    } catch (error) {
      errorMessage.value = error.message
      return false
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
    filterType.value = ''
    errorMessage.value = ''
  }

  return {
    records,
    allRecords,
    isLoading,
    isSaving,
    errorMessage,
    filterType,
    count,
    typeCounts,
    load,
    setFilter,
    add,
    editMemo,
    remove,
    clear,
  }
})
