export const users = [
  { id: 1, email: 'student@skala.com', password: '1234', name: 'SKALA 수강생', role: 'STUDENT' },
  { id: 2, email: 'admin@skala.com', password: 'admin1234', name: 'SKALA 관리자', role: 'ADMIN' },
]

export let records = []
let nextRecordId = 1

export const createRecord = (input, userId) => {
  const record = {
    id: nextRecordId++,
    userId,
    // 종류를 안 적어 보낸 예전 기록은 타로로 본다
    kind: input.kind ?? 'tarot',
    type: input.type,
    cards: input.cards ?? [],
    reading: input.reading,
    // 심리테스트 결과 정보 (테스트 기록에만 있다)
    meta: input.meta ?? null,
    memo: input.memo ?? '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  records.push(record)
  return record
}

export const resetRecords = () => {
  records = []
  nextRecordId = 1
}
