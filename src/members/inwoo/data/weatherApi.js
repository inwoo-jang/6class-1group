/**
 * Open-Meteo 날씨 API
 * ------------------------------------------------------------------
 * 화면(컴포넌트)과 데이터 가져오는 일을 파일부터 분리한다.
 * 컴포넌트는 "무엇을 보여줄지"만, 이 파일은 "어디서 가져올지"만 안다.
 *
 * API 키가 필요 없고 CORS도 열려 있어 브라우저에서 바로 호출할 수 있다.
 * 문서: https://open-meteo.com/en/docs
 */

const BASE_URL = 'https://api.open-meteo.com/v1/forecast'

/**
 * 조회할 지역 목록.
 * 여기에 한 줄 추가하면 화면에도 지역 탭에도 자동으로 반영된다.
 */
export const CITIES = [
  { id: 'seoul', name: '서울', region: '서울', lat: 37.5665, lon: 126.978 },

  { id: 'incheon', name: '인천', region: '인천', lat: 37.4563, lon: 126.7052 },

  { id: 'suwon', name: '수원', region: '경기', lat: 37.2636, lon: 127.0286 },
  { id: 'seongnam', name: '성남', region: '경기', lat: 37.42, lon: 127.1265 },
  { id: 'goyang', name: '고양', region: '경기', lat: 37.6584, lon: 126.832 },
  { id: 'yongin', name: '용인', region: '경기', lat: 37.2411, lon: 127.1776 },
  { id: 'bucheon', name: '부천', region: '경기', lat: 37.5035, lon: 126.766 },
  { id: 'pyeongtaek', name: '평택', region: '경기', lat: 36.9921, lon: 127.1129 },

  { id: 'chuncheon', name: '춘천', region: '강원', lat: 37.8813, lon: 127.73 },
  { id: 'wonju', name: '원주', region: '강원', lat: 37.3422, lon: 127.9202 },
  { id: 'gangneung', name: '강릉', region: '강원', lat: 37.7519, lon: 128.8761 },
  { id: 'sokcho', name: '속초', region: '강원', lat: 38.207, lon: 128.5918 },

  { id: 'cheongju', name: '청주', region: '충북', lat: 36.6424, lon: 127.489 },
  { id: 'chungju', name: '충주', region: '충북', lat: 36.9911, lon: 127.926 },
  { id: 'jecheon', name: '제천', region: '충북', lat: 37.1326, lon: 128.191 },

  { id: 'cheonan', name: '천안', region: '충남', lat: 36.8151, lon: 127.1139 },
  { id: 'asan', name: '아산', region: '충남', lat: 36.7898, lon: 127.0018 },
  { id: 'seosan', name: '서산', region: '충남', lat: 36.7848, lon: 126.4503 },
  { id: 'boryeong', name: '보령', region: '충남', lat: 36.3333, lon: 126.6128 },

  { id: 'daejeon', name: '대전', region: '대전', lat: 36.3504, lon: 127.3845 },

  { id: 'sejong', name: '세종', region: '세종', lat: 36.48, lon: 127.289 },

  { id: 'jeonju', name: '전주', region: '전북', lat: 35.8242, lon: 127.148 },
  { id: 'gunsan', name: '군산', region: '전북', lat: 35.9676, lon: 126.7369 },
  { id: 'iksan', name: '익산', region: '전북', lat: 35.9483, lon: 126.9576 },
  { id: 'namwon', name: '남원', region: '전북', lat: 35.4164, lon: 127.3905 },

  { id: 'mokpo', name: '목포', region: '전남', lat: 34.8118, lon: 126.3922 },
  { id: 'yeosu', name: '여수', region: '전남', lat: 34.7604, lon: 127.6622 },
  { id: 'suncheon', name: '순천', region: '전남', lat: 34.9506, lon: 127.4872 },
  { id: 'gwangyang', name: '광양', region: '전남', lat: 34.9407, lon: 127.696 },

  { id: 'gwangju', name: '광주', region: '광주', lat: 35.1595, lon: 126.8526 },

  { id: 'daegu', name: '대구', region: '대구', lat: 35.8714, lon: 128.6014 },

  { id: 'pohang', name: '포항', region: '경북', lat: 36.019, lon: 129.3435 },
  { id: 'gyeongju', name: '경주', region: '경북', lat: 35.8562, lon: 129.2247 },
  { id: 'andong', name: '안동', region: '경북', lat: 36.5684, lon: 128.7294 },
  { id: 'gumi', name: '구미', region: '경북', lat: 36.1195, lon: 128.3446 },
  { id: 'yeongju', name: '영주', region: '경북', lat: 36.8057, lon: 128.624 },

  { id: 'ulsan', name: '울산', region: '울산', lat: 35.5384, lon: 129.3114 },

  { id: 'changwon', name: '창원', region: '경남', lat: 35.228, lon: 128.6811 },
  { id: 'jinju', name: '진주', region: '경남', lat: 35.1803, lon: 128.1076 },
  { id: 'tongyeong', name: '통영', region: '경남', lat: 34.8544, lon: 128.4331 },
  { id: 'gimhae', name: '김해', region: '경남', lat: 35.2286, lon: 128.8894 },
  { id: 'geoje', name: '거제', region: '경남', lat: 34.8806, lon: 128.6211 },

  { id: 'busan', name: '부산', region: '부산', lat: 35.1796, lon: 129.0756 },

  { id: 'jeju', name: '제주', region: '제주', lat: 33.4996, lon: 126.5312 },
  { id: 'seogwipo', name: '서귀포', region: '제주', lat: 33.2541, lon: 126.56 },
]

/**
 * 시·도 17개를 그대로 탭으로 만들면 칩이 너무 많다.
 * 카드에는 시·도(region)를 그대로 보여 주고, 탭만 권역(group)으로 묶는다.
 */
const REGION_GROUP = {
  서울: '서울',
  인천: '인천/경기',
  경기: '인천/경기',
  강원: '강원',
  대전: '대전/세종/충청',
  세종: '대전/세종/충청',
  충북: '대전/세종/충청',
  충남: '대전/세종/충청',
  광주: '광주/전라',
  전북: '광주/전라',
  전남: '광주/전라',
  대구: '대구/경북',
  경북: '대구/경북',
  부산: '부산/울산/경남',
  울산: '부산/울산/경남',
  경남: '부산/울산/경남',
  제주: '제주',
}

export const groupOf = (sido) => REGION_GROUP[sido] ?? sido

/** 탭에 쓸 권역 목록 (CITIES 등장 순서대로, 중복 제거) */
export const REGIONS = [...new Set(CITIES.map((city) => groupOf(city.region)))]

/**
 * WMO 날씨 코드 → 한글 상태.
 * 여기서 만든 글자를 WeatherIcon이 받아 아이콘을 고르므로,
 * 아이콘 매칭 표에 있는 단어(맑음·비·눈·소나기·뇌우·안개…)를 포함해야 한다.
 */
const WMO = {
  0: '맑음',
  1: '대체로 맑음',
  2: '구름조금',
  3: '흐림',
  45: '안개',
  48: '안개',
  51: '이슬비',
  53: '이슬비',
  55: '이슬비',
  56: '어는 비',
  57: '어는 비',
  61: '비',
  63: '비',
  65: '호우',
  66: '어는 비',
  67: '어는 비',
  71: '눈',
  73: '눈',
  75: '폭설',
  77: '싸락눈',
  80: '소나기',
  81: '소나기',
  82: '소나기',
  85: '눈보라',
  86: '눈보라',
  95: '뇌우',
  96: '뇌우',
  99: '뇌우',
}

export const describeWeather = (code) => WMO[code] ?? '알 수 없음'

/**
 * 여러 지역의 현재 날씨를 한 번의 요청으로 가져온다.
 * 좌표를 콤마로 이어 보내면 보낸 순서 그대로 배열이 돌아온다.
 *
 * 같은 값을 10분 안에 다시 요청하지 않도록 브라우저에 잠깐 저장해 둔다.
 * 무료 API라 요청이 잦으면 429(요청 한도 초과)를 돌려준다.
 *
 * @param {boolean} force 새로고침 버튼처럼 캐시를 무시하고 받아야 할 때
 * @returns {Promise<Array>} [{ id, name, region, temp, humidity, status }, ...]
 * @throws {Error} 네트워크 오류이거나 응답이 200이 아닐 때
 */
const CACHE_KEY = 'inwoo-weather-cache'
const CACHE_TTL = 10 * 60 * 1000

/**
 * 받아 둔 값을 localStorage에 남긴다.
 * 새로고침해도 남아 있어야 서버가 막혔을 때 화면이 비지 않는다.
 */
const readCache = (count, maxAge) => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (saved.count !== count) return null
    return Date.now() - saved.at <= maxAge ? saved : null
  } catch {
    return null
  }
}

const writeCache = (count, rows) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), count, rows }))
  } catch {
    // 저장 공간이 없어도 화면은 그대로 동작해야 한다
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/* ------------------------------------------------------------------
 * 백업 제공자 — 노르웨이 기상청(MET Norway)
 * ------------------------------------------------------------------
 * Open-Meteo가 429(요청 한도 초과)를 돌려줄 때를 대비한 두 번째 줄.
 * 키가 필요 없고 CORS도 열려 있다. 대신 좌표 하나당 한 번씩 불러야 해서
 * 평소에는 쓰지 않고 1차가 실패했을 때만 쓴다.
 * https://api.met.no/weatherapi/locationforecast/2.0/documentation
 */
const METNO_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact'

/** met.no 심볼 코드 → 한글 상태 (아이콘 매칭 표의 낱말을 포함해야 한다) */
const SYMBOL = [
  ['thunder', '뇌우'],
  ['heavysnow', '폭설'],
  ['snow', '눈'],
  ['sleet', '진눈깨비'],
  ['heavyrainshowers', '소나기'],
  ['rainshowers', '소나기'],
  ['lightrainshowers', '소나기'],
  ['heavyrain', '호우'],
  ['lightrain', '이슬비'],
  ['rain', '비'],
  ['fog', '안개'],
  ['cloudy', '흐림'],
  ['partlycloudy', '구름조금'],
  ['fair', '대체로 맑음'],
  ['clearsky', '맑음'],
]

const describeSymbol = (code = '') => {
  const key = code.replace(/_(day|night|polartwilight)$/, '')
  return SYMBOL.find(([word]) => key.includes(word))?.[1] ?? '알 수 없음'
}

/** 한 번에 너무 많이 던지지 않도록 몇 개씩 끊어서 부른다 */
const inBatches = async (items, size, task) => {
  const out = []
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(task))))
  }
  return out
}

const fetchFromMetNo = async (cities) =>
  inBatches(cities, 8, async (city) => {
    const response = await fetch(`${METNO_URL}?lat=${city.lat}&lon=${city.lon}`)
    if (!response.ok) throw new Error(`백업 서버가 ${response.status} 응답을 보냈습니다.`)
    const data = await response.json()
    const now = data.properties.timeseries[0]
    const details = now.data.instant.details
    return {
      id: city.id,
      name: city.name,
      region: city.region,
      group: groupOf(city.region),
      temp: Math.round(details.air_temperature ?? 0),
      humidity: Math.round(details.relative_humidity ?? 0),
      status: describeSymbol(now.data.next_1_hours?.summary?.symbol_code),
      observedAt: now.time ?? '',
    }
  })

/** 429(요청 한도 초과)는 잠깐 기다리면 풀리는 경우가 많아 한 번만 다시 시도한다 */
const request = async (url) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(url)
    if (response.ok) return response
    if (response.status !== 429 || attempt === 1) {
      throw new Error(`날씨 서버가 ${response.status} 응답을 보냈습니다.`)
    }
    await sleep(1500)
  }
}

/**
 * 지금 날아가고 있는 요청. 화면 여러 곳에서 동시에 불러도 요청은 하나만 나간다.
 * 앱이 뜨자마자 미리 던져 두면(primeWeather) 화면이 준비될 즈음 답이 와 있다.
 */
let inflight = null

const loadFresh = (cities) => {
  if (!inflight) {
    inflight = requestFresh(cities).finally(() => {
      inflight = null
    })
  }
  return inflight
}

/**
 * 화면보다 먼저 날씨를 부르기 시작한다.
 * 컴포넌트가 다 그려진 뒤에 요청하면 그만큼 늦어진다.
 * 이미 신선한 값이 있으면 아무 것도 하지 않는다.
 */
export const primeWeather = () => {
  if (readCache(CITIES.length, CACHE_TTL)) return
  loadFresh(CITIES).catch(() => {
    // 실패해도 화면 쪽에서 다시 시도하므로 여기서는 조용히 넘어간다
  })
}

/**
 * 저장된 값이 있으면 **먼저 보여 주고**, 오래됐으면 뒤에서 조용히 새로 받는다
 * (stale-while-revalidate). 화면이 비어 있는 시간을 없애기 위함이다.
 */
export const fetchWeather = async (cities = CITIES, force = false) => {
  if (!force) {
    const cached = readCache(cities.length, Infinity)
    if (cached) {
      const isFresh = Date.now() - cached.at < CACHE_TTL
      if (!isFresh) primeWeather() // 뒤에서 새로 받아 둔다
      return { rows: cached.rows, at: cached.at, stale: !isFresh, source: 'cache' }
    }
  }
  return loadFresh(cities)
}

const requestFresh = async (cities = CITIES) => {
  const params = new URLSearchParams({
    latitude: cities.map((c) => c.lat).join(','),
    longitude: cities.map((c) => c.lon).join(','),
    current: 'temperature_2m,relative_humidity_2m,weather_code',
    timezone: 'Asia/Seoul',
  })

  let data
  try {
    const response = await request(`${BASE_URL}?${params}`)
    data = await response.json()
  } catch (error) {
    console.warn('[weather] 1차 서버 실패, 백업 서버로 넘어갑니다.', error)
    // ② 백업 제공자로 다시 시도한다
    try {
      const rows = await fetchFromMetNo(cities)
      writeCache(cities.length, rows)
      return { rows, at: Date.now(), stale: false, source: 'met.no' }
    } catch (backupError) {
      console.warn('[weather] 백업 서버도 실패했습니다.', backupError)
      // ③ 둘 다 막혔더라도 지난번에 받아 둔 값이 있으면 그걸 보여 준다.
      //    빈 화면에 오류만 띄우는 것보다 낫다.
      const stale = readCache(cities.length, Infinity)
      if (stale) return { rows: stale.rows, at: stale.at, stale: true }
      throw error
    }
  }
  // 지역이 하나면 배열이 아니라 객체 하나로 오므로 형태를 맞춰 준다
  const list = Array.isArray(data) ? data : [data]

  const rows = cities.map((city, index) => {
    const current = list[index]?.current ?? {}
    return {
      id: city.id,
      name: city.name,
      region: city.region, // 시·도 — 카드에 그대로 보여 준다
      group: groupOf(city.region), // 권역 — 탭 필터에 쓴다
      temp: Math.round(current.temperature_2m ?? 0),
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      status: describeWeather(current.weather_code),
      observedAt: current.time ?? '',
    }
  })

  writeCache(cities.length, rows)
  return { rows, at: Date.now(), stale: false, source: 'open-meteo' }
}

/**
 * 두 좌표 사이의 거리(km). 하버사인 공식.
 * 현재 위치에서 가장 가까운 도시를 고를 때만 쓴다.
 */
const distanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** 주어진 좌표에서 가장 가까운 도시를 돌려준다 */
export const nearestCity = (lat, lon) =>
  CITIES.reduce((closest, city) => {
    const d = distanceKm(lat, lon, city.lat, city.lon)
    return !closest || d < closest.distance ? { ...city, distance: d } : closest
  }, null)

/** 'YYYY-MM-DD' 형식으로 바꾼다 (toISOString은 UTC라 하루가 밀릴 수 있어 직접 만든다) */
export const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`

/** 오늘 기준 며칠 전/후 날짜 키 */
export const shiftDate = (dateKey, days) => {
  const d = new Date(`${dateKey}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

/** Open-Meteo가 주는 범위: 과거 92일 ~ 미래 15일 */
export const DATE_RANGE = {
  min: shiftDate(toDateKey(new Date()), -90),
  max: shiftDate(toDateKey(new Date()), 14),
}

/**
 * 한 도시의 하루치 시간별 날씨를 가져온다.
 * 목록에는 현재 날씨만 필요하니 시간별은 상세보기에서만 부른다.
 * 목록 전체를 시간별로 받으면 응답이 수십 배로 커진다.
 *
 * @param {object} city  CITIES의 항목 (좌표가 있어야 한다)
 * @param {string} startDate 'YYYY-MM-DD'. 과거 90일 ~ 미래 14일까지 된다.
 * @param {string} endDate   생략하면 하루치만. 자정을 넘겨 봐야 할 때 다음 날을 준다.
 * @returns {Promise<Array>} [{ time, hour, temp, humidity, status, rainChance }, ...]
 */
export const fetchHourly = async (city, startDate, endDate = startDate) => {
  const params = new URLSearchParams({
    latitude: city.lat,
    longitude: city.lon,
    hourly: 'temperature_2m,relative_humidity_2m,weather_code,precipitation_probability',
    start_date: startDate,
    end_date: endDate,
    timezone: 'Asia/Seoul',
  })

  const response = await fetch(`${BASE_URL}?${params}`)
  if (!response.ok) {
    throw new Error(`시간별 예보를 받지 못했습니다 (${response.status}).`)
  }

  const { hourly } = await response.json()

  return hourly.time.map((time, i) => ({
    time,
    hour: Number(time.slice(11, 13)),
    temp: Math.round(hourly.temperature_2m[i]),
    humidity: Math.round(hourly.relative_humidity_2m[i]),
    status: describeWeather(hourly.weather_code[i]),
    rainChance: hourly.precipitation_probability[i] ?? 0,
  }))
}

/**
 * 배경을 확인해 보기 위한 가짜 데이터.
 * 실제 날씨가 며칠씩 맑기만 하면 비·눈·번개 배경을 볼 방법이 없어서 넣어 두었다.
 * demo 표시가 있으므로 실제 관측값과 섞이지 않는다.
 */
export const DEMO_ROWS = [
  ['맑음', 31, 40],
  ['대체로 맑음', 28, 52],
  ['구름조금', 26, 58],
  ['구름많음', 24, 66],
  ['흐림', 21, 72],
  ['이슬비', 18, 84],
  ['비', 19, 92],
  ['호우', 17, 96],
  ['소나기', 23, 80],
  ['눈', -3, 74],
  ['폭설', -7, 81],
  ['안개', 12, 95],
  ['뇌우', 24, 85],
].map(([status, temp, humidity]) => ({
  id: 'demo-' + status.replace(/\s/g, ''),
  name: status,
  region: '데모',
  group: '데모',
  temp,
  humidity,
  status,
  demo: true,
}))

/** id로 도시 정보(좌표 포함)를 찾는다 */
export const findCity = (id) => CITIES.find((city) => city.id === id) ?? null
