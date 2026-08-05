const TOUR_BASE = 'https://apis.data.go.kr/B551011/KorService2/searchFestival2'

const parseDate = (yyyymmdd) => {
  if (!yyyymmdd || yyyymmdd.length !== 8) return null
  return new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`)
}

const toStatus = (startDate, endDate) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (!start || !end) return { key: 'ended', label: '종료', color: '#c7c2de' }

  if (today >= start && today <= end) {
    return { key: 'ongoing', label: '🎉 진행 중', color: '#43a047' }
  }
  if (today < start) {
    const dday = Math.ceil((start - today) / (1000 * 60 * 60 * 24))
    if (dday <= 7) return { key: 'soon', label: `🔜 D-${dday}`, color: '#fb8c00', dday }
    return { key: 'upcoming', label: '예정', color: '#9ca3af', dday }
  }
  return { key: 'ended', label: '종료', color: '#c7c2de' }
}

export async function fetchFestivalsByArea(areaCode) {
  const params = new URLSearchParams({
    serviceKey: import.meta.env.VITE_TOUR_KEY,
    MobileOS: 'ETC',
    MobileApp: 'WeatherDiary',
    _type: 'json',
    arrange: 'A',
    numOfRows: '100',
    pageNo: '1',
    areaCode,
    eventStartDate: '20200101',
  })

  const res = await fetch(`${TOUR_BASE}?${params.toString()}`)
  if (!res.ok) throw new Error('축제 정보 요청 실패')
  const data = await res.json()
  const raw = data?.response?.body?.items?.item ?? []
  const items = Array.isArray(raw) ? raw : [raw]

  return items
    .filter((it) => it.title)
    .map((it) => ({
      id: it.contentid,
      title: it.title,
      image: it.firstimage || '',
      address: it.addr1 || '',
      startDate: it.eventstartdate,
      endDate: it.eventenddate,
      status: toStatus(it.eventstartdate, it.eventenddate),
    }))
    .filter((f) => f.status.key !== 'ended')
}

// 진행 중 → 시작일 가까운 순
export function sortFestivals(list) {
  return [...list].sort((a, b) => {
    const rank = (f) => (f.status.key === 'ongoing' ? 0 : 1)
    const r = rank(a) - rank(b)
    return r !== 0 ? r : (a.startDate || '').localeCompare(b.startDate || '')
  })
}
