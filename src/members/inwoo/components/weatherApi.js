import axios from 'axios'

/**
 * 날씨 API — 과제 6 (교안 7장 Axios)
 * ------------------------------------------------------------------
 * 화면(컴포넌트)과 데이터 가져오는 일을 파일부터 분리한다.
 * 컴포넌트는 "무엇을 보여줄지"만, 이 파일은 "어디서 가져올지"만 안다.
 *
 * ── 제공자를 세 줄로 세운 이유 ──
 *   ① OpenWeather   교안이 지정한 제공자. API Key 가 있을 때만 쓴다.
 *   ② Open-Meteo    키가 없거나 ①이 실패했을 때. 좌표를 묶어 한 번에 받는다.
 *   ③ MET Norway    ①②가 모두 막혔을 때의 마지막 줄.
 *
 * 키가 없어도 화면이 죽지 않아야 해서 이렇게 나눴다. 시간별 예보는
 * 과거 90일까지 거슬러 볼 수 있어야 하므로 Open-Meteo 로 따로 부른다
 * (OpenWeather 무료 플랜은 미래 5일·3시간 간격만 준다).
 *
 * ── 인스턴스를 만들어 쓰는 이유 ──
 * axios.get(...) 을 그냥 쓰면 주소와 공통 옵션이 부르는 곳마다 흩어진다.
 * create() 로 한 번 찍어 두면 baseURL·타임아웃·공통 파라미터가 한곳에 모이고,
 * 인터셉터로 "모든 요청/응답"을 한 번에 가로챌 수 있다.
 */
const openMeteo = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: 8000,
  // 모든 요청에 함께 나가는 파라미터. 부르는 쪽에서 매번 적지 않아도 된다.
  params: { timezone: 'Asia/Seoul' },
})

/**
 * 요청 인터셉터 — 나가는 요청을 전부 한 자리에서 들여다본다.
 * 실무에서는 여기서 토큰(Authorization 헤더)을 붙인다.
 * 이 API는 키가 필요 없어 개발 중 확인용 로그만 남긴다.
 */
const logRequest = (config) => {
  if (import.meta.env.DEV) console.debug('[weather] →', config.baseURL + config.url)
  return config
}

/**
 * 응답 인터셉터 (성공) — response.data 만 돌려준다.
 * 이렇게 해 두면 부르는 쪽이 매번 .data 를 적지 않아도 된다.
 */
const unwrap = (response) => response.data

/**
 * 응답 인터셉터 (실패) — axios 오류를 화면에 그대로 띄울 수 있는 문장으로 바꾼다.
 * 오류 처리를 여기 한 곳에 모아 두면 화면마다 status 를 따지지 않아도 된다.
 * 재시도 판단에 쓰려고 status 는 남겨 둔다.
 */
const toReadableError = (error) => {
  const status = error.response?.status
  const readable = new Error(
    status === 429
      ? '날씨 서버 요청이 잠시 몰렸습니다.'
      : status
        ? `날씨 서버가 ${status} 응답을 보냈습니다.`
        : '날씨 서버에 연결하지 못했습니다.',
  )
  readable.status = status
  return Promise.reject(readable)
}

/** 두 제공자에 같은 규칙을 건다 */
const withInterceptors = (client) => {
  client.interceptors.request.use(logRequest)
  client.interceptors.response.use(unwrap, toReadableError)
  return client
}

withInterceptors(openMeteo)

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

/** 유닉스 초 → '05:32' (OpenWeather 의 일출·일몰이 이 형태로 온다) */
const toClock = (seconds) =>
  new Date(seconds * 1000).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

/* ------------------------------------------------------------------
 * 1차 제공자 — OpenWeather (교안 지정)
 * ------------------------------------------------------------------
 * https://openweathermap.org/current
 *   GET /data/2.5/weather?lat={lat}&lon={lon}&appid={KEY}&units=metric&lang=kr
 *
 * 키는 소스에 적지 않는다. .env.local 에 VITE_OPENWEATHER_API_KEY 로 두고
 * (.gitignore 의 *.local 에 걸려 Git 에 올라가지 않는다) 여기서 읽어 쓴다.
 * 키가 없으면 이 제공자를 건너뛰고 Open-Meteo 로 간다.
 */
const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY ?? ''

/** 화면에서 "지금 어느 제공자를 쓰는지" 알려 줄 때 쓴다 */
export const hasOpenWeatherKey = Boolean(OPENWEATHER_KEY)

const openWeather = OPENWEATHER_KEY
  ? withInterceptors(
      axios.create({
        baseURL: 'https://api.openweathermap.org/data/2.5',
        timeout: 8000,
        // 키·단위·언어는 모든 요청에 똑같이 나가므로 인스턴스에 붙인다
        params: { appid: OPENWEATHER_KEY, units: 'metric', lang: 'kr' },
      }),
    )
  : null

/**
 * OpenWeather 상태 코드 → 한글 상태.
 * 응답의 description 도 한글이지만(lang=kr), WeatherIcon 이 알아듣는 낱말과
 * 다르다. 아이콘이 붙어야 하므로 코드 기준으로 우리 어휘에 맞춰 옮긴다.
 * https://openweathermap.org/weather-conditions
 */
const describeOpenWeather = (id = 0) => {
  if (id >= 200 && id < 300) return '뇌우'
  if (id >= 300 && id < 400) return '이슬비'
  if (id === 511) return '어는 비'
  if (id >= 520 && id < 600) return '소나기'
  if (id >= 502 && id < 511) return '호우'
  if (id >= 500 && id < 502) return '비'
  if (id === 602) return '폭설'
  if (id >= 620 && id < 623) return '눈보라'
  if (id >= 611 && id < 617) return '싸락눈'
  if (id >= 600 && id < 700) return '눈'
  if (id >= 700 && id < 800) return '안개'
  if (id === 800) return '맑음'
  if (id === 801) return '대체로 맑음'
  if (id === 802) return '구름조금'
  if (id >= 803 && id < 900) return '흐림'
  return '알 수 없음'
}

/**
 * 키가 거절당하면 한동안 이 제공자를 건너뛴다.
 *
 * 401/403 은 다시 보낸다고 통과되지 않는다. 그런데 도시 하나당 요청 하나라,
 * 기억해 두지 않으면 새로고침할 때마다 수십 번을 헛되이 던지고 그만큼 기다린다.
 */
const AUTH_COOLDOWN = 30 * 60 * 1000
let openWeatherBlockedUntil = 0

const isOpenWeatherUsable = () => Boolean(openWeather) && Date.now() >= openWeatherBlockedUntil

const blockOpenWeather = (error) => {
  if (error?.status !== 401 && error?.status !== 403) return
  openWeatherBlockedUntil = Date.now() + AUTH_COOLDOWN
  console.warn('[weather] OpenWeather 키가 거절돼 30분간 건너뜁니다. 키 활성화 여부를 확인하세요.')
}

const fetchOneFromOpenWeather = async (city) => {
  const data = await openWeather.get('/weather', {
    params: { lat: city.lat, lon: city.lon },
  })
  return {
    id: city.id,
    name: city.name,
    region: city.region,
    group: groupOf(city.region),
    temp: Math.round(data.main?.temp ?? 0),
    humidity: Math.round(data.main?.humidity ?? 0),
    status: describeOpenWeather(data.weather?.[0]?.id),
    wind: data.wind?.speed != null ? Math.round(data.wind.speed * 10) / 10 : null,
    pressure: data.main?.pressure ?? null,
    // OpenWeather 는 미터로 준다. 표에는 km 로 적는다.
    visibility: data.visibility != null ? Math.round(data.visibility / 100) / 10 : null,
    sunrise: data.sys?.sunrise ? toClock(data.sys.sunrise) : '',
    sunset: data.sys?.sunset ? toClock(data.sys.sunset) : '',
    observedAt: data.dt ? new Date(data.dt * 1000).toISOString() : '',
  }
}

/**
 * 도시 하나당 요청 하나. 무료 플랜에는 좌표를 묶어 보내는 창구가 없다.
 *
 * 먼저 한 곳만 찔러 본다. 키가 문제라면 여기서 끝나므로 나머지 44번을 아낀다.
 * 통과하면 분당 한도를 생각해 몇 개씩 끊어 보낸다(inBatches).
 */
const fetchFromOpenWeather = async (cities) => {
  if (!cities.length) return []

  const [first] = cities
  const head = await fetchOneFromOpenWeather(first).catch((error) => {
    blockOpenWeather(error)
    throw error
  })

  const rest = await inBatches(cities.slice(1), 8, fetchOneFromOpenWeather)
  return [head, ...rest]
}

/* ------------------------------------------------------------------
 * 백업 제공자 — 노르웨이 기상청(MET Norway)
 * ------------------------------------------------------------------
 * Open-Meteo가 429(요청 한도 초과)를 돌려줄 때를 대비한 두 번째 줄.
 * 키가 필요 없고 CORS도 열려 있다. 대신 좌표 하나당 한 번씩 불러야 해서
 * 평소에는 쓰지 않고 1차가 실패했을 때만 쓴다.
 * https://api.met.no/weatherapi/locationforecast/2.0/documentation
 */
const metNo = withInterceptors(
  axios.create({
    baseURL: 'https://api.met.no/weatherapi/locationforecast/2.0',
    timeout: 8000,
  }),
)

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
    // 인터셉터가 .data 까지 벗겨 주므로 바로 본문이 온다
    const data = await metNo.get('/compact', { params: { lat: city.lat, lon: city.lon } })
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
      wind: details.wind_speed != null ? Math.round(details.wind_speed * 10) / 10 : null,
      pressure:
        details.air_pressure_at_sea_level != null
          ? Math.round(details.air_pressure_at_sea_level)
          : null,
      observedAt: now.time ?? '',
    }
  })

/** 429(요청 한도 초과)는 잠깐 기다리면 풀리는 경우가 많아 한 번만 다시 시도한다 */
const getWithRetry = async (client, url, params) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await client.get(url, { params })
    } catch (error) {
      // status 는 응답 인터셉터가 남겨 둔 값이다
      if (error.status !== 429 || attempt === 1) throw error
      await sleep(1500)
    }
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

/** Open-Meteo 응답 한 덩이를 화면이 쓰는 모양으로 옮긴다 */
const fromOpenMeteo = (cities, data) => {
  // 지역이 하나면 배열이 아니라 객체 하나로 오므로 형태를 맞춰 준다
  const list = Array.isArray(data) ? data : [data]
  return cities.map((city, index) => {
    const current = list[index]?.current ?? {}
    return {
      id: city.id,
      name: city.name,
      region: city.region, // 시·도 — 카드에 그대로 보여 준다
      group: groupOf(city.region), // 권역 — 탭 필터에 쓴다
      temp: Math.round(current.temperature_2m ?? 0),
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      status: describeWeather(current.weather_code),
      // 상세 화면의 관측값 표에 쓴다. 없는 제공자도 있어 undefined 를 허용한다.
      wind: current.wind_speed_10m != null ? Math.round(current.wind_speed_10m * 10) / 10 : null,
      pressure: current.surface_pressure != null ? Math.round(current.surface_pressure) : null,
      observedAt: current.time ?? '',
    }
  })
}

const fetchFromOpenMeteo = async (cities) =>
  fromOpenMeteo(
    cities,
    // timezone 은 인스턴스에 걸어 뒀으므로 여기서 다시 적지 않는다
    await getWithRetry(openMeteo, '/forecast', {
      latitude: cities.map((c) => c.lat).join(','),
      longitude: cities.map((c) => c.lon).join(','),
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure',
    }),
  )

/**
 * 목록을 채울 제공자를 세워 둔 순서대로 시도한다.
 * 앞에서 답이 오면 거기서 멈추고, 다 막히면 저장해 둔 값이라도 보여 준다.
 *
 * ── 왜 Open-Meteo 가 앞인가 ──
 * 목록은 45개 도시가 한꺼번에 필요하다. Open-Meteo 는 좌표를 묶어 보내면
 * 요청 한 번으로 전부 돌려주지만, OpenWeather 무료 플랜에는 그런 창구가 없어
 * 도시당 한 번씩 45번을 불러야 한다. 같은 화면을 그리는 데 45배가 드는 셈이다.
 *
 * 그래서 OpenWeather 는 도시 하나만 보면 되는 상세 화면(fetchCityDetail)에서
 * 1차로 쓰고, 목록에서는 Open-Meteo 가 막혔을 때의 백업으로 둔다.
 */
const PROVIDERS = [
  { name: 'open-meteo', enabled: () => true, load: fetchFromOpenMeteo },
  { name: 'openweather', enabled: isOpenWeatherUsable, load: fetchFromOpenWeather },
  { name: 'met.no', enabled: () => true, load: fetchFromMetNo },
]

const requestFresh = async (cities = CITIES) => {
  let lastError = null

  for (const provider of PROVIDERS) {
    if (!provider.enabled()) continue
    try {
      const rows = await provider.load(cities)
      writeCache(cities.length, rows)
      return { rows, at: Date.now(), stale: false, source: provider.name }
    } catch (error) {
      lastError = error
      console.warn(`[weather] ${provider.name} 실패, 다음 제공자로 넘어갑니다.`, error)
    }
  }

  // 전부 막혔더라도 지난번에 받아 둔 값이 있으면 그걸 보여 준다.
  // 빈 화면에 오류만 띄우는 것보다 낫다.
  const stale = readCache(cities.length, Infinity)
  if (stale) return { rows: stale.rows, at: stale.at, stale: true, source: 'cache' }

  throw lastError ?? new Error('날씨를 불러오지 못했습니다.')
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
  const { hourly } = await openMeteo.get('/forecast', {
    params: {
      latitude: city.lat,
      longitude: city.lon,
      hourly: 'temperature_2m,relative_humidity_2m,weather_code,precipitation_probability',
      start_date: startDate,
      end_date: endDate,
    },
  })

  return hourly.time.map((time, i) => ({
    time,
    hour: Number(time.slice(11, 13)),
    temp: Math.round(hourly.temperature_2m[i]),
    humidity: Math.round(hourly.relative_humidity_2m[i]),
    status: describeWeather(hourly.weather_code[i]),
    rainChance: hourly.precipitation_probability[i] ?? 0,
  }))
}

/* ------------------------------------------------------------------
 * 상세 화면용 추가 관측값
 * ------------------------------------------------------------------
 * 목록에는 기온·습도·날씨만 있으면 된다. 가시거리·일출/일몰·미세먼지까지
 * 45개 도시분을 한꺼번에 받으면 응답이 몇 배로 커지고 대부분 쓰이지 않는다.
 * 그래서 상세 화면에서 그 도시 하나만 따로 받는다.
 *
 * 미세먼지는 날씨와 다른 창구(Air Quality API)라 요청도 따로 나간다.
 * 키가 필요 없고 CORS 도 열려 있다.
 */
const airQuality = withInterceptors(
  axios.create({
    baseURL: 'https://air-quality-api.open-meteo.com/v1',
    timeout: 8000,
    params: { timezone: 'Asia/Seoul' },
  }),
)

/** PM10 농도 → 한국 기준 등급 */
const describeDust = (pm10) => {
  if (pm10 == null) return null
  if (pm10 <= 30) return '좋음'
  if (pm10 <= 80) return '보통'
  if (pm10 <= 150) return '나쁨'
  return '매우나쁨'
}

/** 'HH:MM' 만 남긴다 (Open-Meteo 는 '2026-08-04T05:32' 로 준다) */
const clockOf = (isoLike) => (isoLike ? String(isoLike).slice(11, 16) : '')

/**
 * 도시 한 곳의 추가 관측값을 받아 온다.
 * 실패해도 화면이 죽으면 안 되므로 빈 객체를 돌려준다 — 표에서 그 줄만 빠진다.
 *
 * @param {object} city CITIES 의 항목 (좌표가 있어야 한다)
 * @returns {Promise<object>} visibility · sunrise · sunset · tempMin · tempMax · rainChance · dust …
 */
export const fetchCityDetail = async (city) => {
  if (!city) return {}

  const extras = {}

  /*
   * 세 곳에 나란히 물어본다. 서로를 기다릴 이유가 없으니 걸리는 시간은
   * 셋 중 가장 느린 하나뿐이다.
   *
   *   ① OpenWeather  가시거리·일출·일몰·풍속·기압 (키가 있을 때만)
   *   ② Open-Meteo   오늘 최저/최고·강수 확률, 그리고 ①이 못 준 값
   *   ③ Air Quality  미세먼지 (창구가 아예 다르다)
   */
  const useOpenWeather = isOpenWeatherUsable()

  const [own, meteo, air] = await Promise.allSettled([
    useOpenWeather
      ? openWeather.get('/weather', { params: { lat: city.lat, lon: city.lon } })
      : Promise.reject(new Error('키 없음')),
    openMeteo.get('/forecast', {
      params: {
        latitude: city.lat,
        longitude: city.lon,
        hourly: 'visibility',
        daily: 'sunrise,sunset,temperature_2m_min,temperature_2m_max,precipitation_probability_max',
        forecast_days: 1,
      },
    }),
    airQuality.get('/air-quality', {
      params: { latitude: city.lat, longitude: city.lon, current: 'pm10,pm2_5' },
    }),
  ])

  // ② 먼저 Open-Meteo 로 채운다
  if (meteo.status === 'fulfilled') {
    const data = meteo.value

    // 가시거리는 시간별로 오므로 지금 시각에 가장 가까운 칸을 고른다
    const hours = data.hourly?.time ?? []
    const nowHour = new Date().getHours()
    const index = hours.findIndex((time) => Number(time.slice(11, 13)) === nowHour)
    const meters = data.hourly?.visibility?.[index >= 0 ? index : 0]
    if (meters != null) extras.visibility = Math.round(meters / 100) / 10

    const daily = data.daily ?? {}
    if (daily.temperature_2m_min?.[0] != null) extras.tempMin = Math.round(daily.temperature_2m_min[0])
    if (daily.temperature_2m_max?.[0] != null) extras.tempMax = Math.round(daily.temperature_2m_max[0])
    if (daily.precipitation_probability_max?.[0] != null) {
      extras.rainChance = daily.precipitation_probability_max[0]
    }
    extras.sunrise = clockOf(daily.sunrise?.[0])
    extras.sunset = clockOf(daily.sunset?.[0])
  } else {
    console.warn('[weather] 오늘 예보를 받지 못했습니다.', meteo.reason)
  }

  // ① OpenWeather 가 있으면 그쪽 값을 덮어쓴다 (관측소 값이라 더 가깝다)
  if (own.status === 'fulfilled') {
    const data = own.value
    if (data.visibility != null) extras.visibility = Math.round(data.visibility / 100) / 10
    if (data.sys?.sunrise) extras.sunrise = toClock(data.sys.sunrise)
    if (data.sys?.sunset) extras.sunset = toClock(data.sys.sunset)
    if (data.wind?.speed != null) extras.wind = Math.round(data.wind.speed * 10) / 10
    if (data.main?.pressure != null) extras.pressure = data.main.pressure
  }

  // ③ 미세먼지
  if (air.status === 'fulfilled') {
    const dust = describeDust(air.value.current?.pm10)
    if (dust) extras.dust = dust
  } else {
    console.warn('[weather] 미세먼지를 받지 못했습니다.', air.reason)
  }

  return extras
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
