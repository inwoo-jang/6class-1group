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
    type: input.type,
    cards: input.cards,
    reading: input.reading,
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
