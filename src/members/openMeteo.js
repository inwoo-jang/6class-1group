/**
 * 팀 공용 날씨 창구 (Open-Meteo).
 * ------------------------------------------------------------------
 * 왜 공용인가 —
 * 표지에는 여섯 사람의 화면이 미리보기로 한꺼번에 떠 있다. 각자 자기 앱을
 * 통째로 돌리므로, 아무 장치 없이 두면 표지를 한 번 여는 동안 같은 도시의
 * 날씨를 여섯 번 물어본다. 새로고침할 때마다 또 여섯 번이다.
 * Open-Meteo 무료 이용은 IP 하나당 하루 요청 수로 끊기므로, 이렇게 쓰면
 * 반드시 한도에 닿는다. 닿는 순간 여섯 화면이 동시에 빈다.
 *
 * 그래서 세 가지를 한다.
 *
 *   ① 받아 둔 값을 나눠 쓴다
 *      localStorage 는 출처가 같으면 미리보기 iframe 끼리도 함께 본다.
 *      한 사람이 받아 온 서울 날씨를 나머지 다섯 사람이 그대로 쓴다.
 *
 *   ② 같은 질문이 겹치면 한 번만 보낸다
 *      여섯 화면이 동시에 뜨므로 겹치는 것은 우연이 아니라 기본이다.
 *
 *   ③ 막히면 다른 곳에 묻고, 그마저 막히면 마지막으로 받아 둔 값을 준다
 *      Open-Meteo 가 한도로 막히면 met.no 에 묻는다 (둘 다 키가 필요 없다).
 *      둘 다 막히면 지난번에 받아 둔 값을 그대로 보여 준다.
 *      빈 화면에 오류만 띄우는 것보다, 조금 지난 날씨가 낫다.
 *
 * 부르는 쪽은 Open-Meteo 를 직접 부를 때와 똑같은 모양을 받는다.
 * 그래서 각자의 변환 코드는 한 줄도 고칠 필요가 없다.
 */
import axios from 'axios'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const METNO_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact'

const CACHE_KEY = 'skala-weather-cache-v1'

/** 이만큼 지나지 않았으면 새로 묻지 않는다 */
const FRESH_MS = 10 * 60 * 1000

/** 저장소가 끝없이 불어나지 않게 — 오래된 것부터 버린다 */
const MAX_ENTRIES = 40

const REQUEST_TIMEOUT_MS = 8000

/* ── 받아 둔 값 ──────────────────────────────────────────────────── */

const readStore = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeStore = (store) => {
  try {
    const entries = Object.entries(store)
    if (entries.length > MAX_ENTRIES) {
      entries.sort((a, b) => b[1].at - a[1].at)
      store = Object.fromEntries(entries.slice(0, MAX_ENTRIES))
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(store))
  } catch {
    // 저장 공간이 막혀 있어도 화면은 계속 돌아가야 한다
  }
}

/** 같은 질문인지 가리는 이름표. 키 순서가 달라도 같은 질문은 같은 이름을 갖는다 */
const cacheKeyOf = (params) =>
  JSON.stringify(
    Object.keys(params)
      .sort()
      .map((key) => [key, String(params[key])]),
  )

const readEntry = (key) => {
  const entry = readStore()[key]
  return entry && entry.data ? entry : null
}

const writeEntry = (key, data) => {
  const store = readStore()
  store[key] = { at: Date.now(), data }
  writeStore(store)
}

/* ── 겹치는 질문은 한 번만 ──────────────────────────────────────── */

const inFlight = new Map()

/* ── met.no 로 대신 묻기 ────────────────────────────────────────── */

/**
 * met.no 의 날씨 이름을 Open-Meteo 의 WMO 코드로 옮긴다.
 * 각자의 화면이 이미 WMO 코드를 읽을 줄 알기 때문에, 코드로 맞춰 주면
 * 그림도 설명도 그대로 나온다.
 */
const WMO_BY_SYMBOL = {
  clearsky: 0,
  fair: 1,
  partlycloudy: 2,
  cloudy: 3,
  fog: 45,
  lightrain: 61,
  lightrainshowers: 80,
  rain: 63,
  rainshowers: 80,
  heavyrain: 65,
  heavyrainshowers: 82,
  lightsleet: 66,
  sleet: 66,
  heavysleet: 67,
  lightsnow: 71,
  lightsnowshowers: 85,
  snow: 73,
  snowshowers: 85,
  heavysnow: 75,
  heavysnowshowers: 86,
  rainandthunder: 95,
  rainshowersandthunder: 95,
  heavyrainandthunder: 99,
  snowandthunder: 95,
}

/** 'partlycloudy_day' · 'lightrain' → WMO 코드 */
const wmoFromSymbol = (symbol) => {
  const base = String(symbol ?? '').replace(/_(day|night|polartwilight)$/, '')
  return WMO_BY_SYMBOL[base] ?? null
}

/*
 * axios 로 부른다. fetch 가 아니라 axios 인 이유는 —
 * 팀원들의 테스트가 axios.get 을 가로채서 가짜 응답을 돌려주기 때문이다.
 * 여기서 fetch 를 쓰면 그 그물을 빠져나가 진짜 네트워크로 나가 버린다.
 */
const fetchJson = async (url, params, headers) => {
  try {
    const response = await axios.get(url, {
      params,
      ...(headers ? { headers } : {}),
      timeout: REQUEST_TIMEOUT_MS,
    })
    return response.data
  } catch (error) {
    if (error.response?.status) error.status = error.response.status
    throw error
  }
}

/** 좌표 하나의 현재 날씨를 met.no 에서 받아 Open-Meteo 의 current 모양으로 옮긴다 */
const currentFromMetNo = async (lat, lon, fields) => {
  const data = await fetchJson(
    METNO_URL,
    { lat: Number(lat).toFixed(4), lon: Number(lon).toFixed(4) },
    /*
     * met.no 는 누가 부르는지 밝히기를 요구한다.
     * 브라우저에서는 User-Agent 를 바꿀 수 없어 이 줄이 조용히 버려지고
     * 브라우저 제 이름이 대신 나간다. Node(테스트·도구)에서만 실제로 붙는다.
     */
    { 'User-Agent': 'skala-6class-1group (https://github.com/inwoo-jang/6class-1group)' },
  )

  const slot = data?.properties?.timeseries?.[0]
  const now = slot?.data?.instant?.details ?? {}
  const symbol =
    slot?.data?.next_1_hours?.summary?.symbol_code ??
    slot?.data?.next_6_hours?.summary?.symbol_code

  const code = wmoFromSymbol(symbol)
  const temperature = now.air_temperature ?? null

  /*
   * met.no 는 체감온도를 주지 않는다. 지어내지 않고 기온을 그대로 둔다 —
   * 없는 값을 그럴듯하게 만들면, 틀렸을 때 아무도 알아채지 못한다.
   * 풍속은 이미 m/s 인데 Open-Meteo 는 km/h 로 주므로 맞춰서 올린다.
   */
  const all = {
    time: slot?.time ?? new Date().toISOString(),
    interval: 900,
    temperature_2m: temperature,
    apparent_temperature: temperature,
    relative_humidity_2m: now.relative_humidity ?? null,
    wind_speed_10m: now.wind_speed != null ? Math.round(now.wind_speed * 3.6 * 10) / 10 : null,
    weather_code: code,
    weathercode: code,
    is_day: 1,
  }

  // 물어본 항목만 돌려준다 — Open-Meteo 도 그렇게 한다
  const current = { time: all.time, interval: all.interval }
  for (const field of fields) {
    if (field in all) current[field] = all[field]
  }
  return current
}

/**
 * Open-Meteo 가 막혔을 때 met.no 로 같은 대답을 만든다.
 * current 만 만들 수 있다 — hourly · daily 까지 흉내 내지는 않는다.
 */
const forecastFromMetNo = async (params) => {
  if (!params.current || params.hourly || params.daily) {
    throw new Error('met.no 로는 이 질문에 답할 수 없습니다.')
  }

  const lats = String(params.latitude).split(',')
  const lons = String(params.longitude).split(',')
  const fields = String(params.current).split(',').map((field) => field.trim())

  /*
   * Open-Meteo 는 좌표 스무 개를 한 번에 받지만 met.no 는 한 번에 하나씩이다.
   * 그래서 여기서 여러 번 묻게 되는데, 두 가지를 지켜야 한다.
   *
   *   · 한꺼번에 쏟지 않는다 — 스무 개를 동시에 던지면 그쪽이 막는다
   *   · 하나가 실패해도 나머지를 버리지 않는다 — 도시 한 곳 때문에
   *     지도 전체가 비는 것이 가장 나쁘다. 실패한 자리만 비워 둔다
   */
  const CONCURRENCY = 6
  const answers = new Array(lats.length)
  let cursor = 0
  let answered = 0

  const worker = async () => {
    while (cursor < lats.length) {
      const index = cursor++
      try {
        answers[index] = {
          latitude: Number(lats[index]),
          longitude: Number(lons[index]),
          current: await currentFromMetNo(lats[index], lons[index], fields),
        }
        answered += 1
      } catch {
        // 이 좌표만 빈손으로 둔다. 화면은 값이 없는 칸을 이미 다룰 줄 안다.
        answers[index] = {
          latitude: Number(lats[index]),
          longitude: Number(lons[index]),
          current: { time: new Date().toISOString(), interval: 900 },
        }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, lats.length) }, worker))

  // 한 곳도 답하지 못했다면 met.no 도 막힌 것이다 — 마지막으로 받아 둔 값으로 넘긴다
  if (answered === 0) throw new Error('met.no 도 답하지 못했습니다.')

  // 좌표가 하나면 배열이 아니라 객체 하나 — Open-Meteo 와 같은 규칙
  return answers.length === 1 ? answers[0] : answers
}

/* ── 바깥에서 쓰는 것 ───────────────────────────────────────────── */

/**
 * Open-Meteo 의 /v1/forecast 를 대신 부른다.
 * 돌려주는 모양은 직접 부를 때와 같다.
 *
 * @param {object} params  latitude · longitude · current 등, Open-Meteo 의 질문 그대로
 * @returns {Promise<object|Array>}
 */
export const fetchForecast = async (params) => {
  const key = cacheKeyOf(params)

  const cached = readEntry(key)
  if (cached && Date.now() - cached.at < FRESH_MS) return cached.data

  if (inFlight.has(key)) return inFlight.get(key)

  const attempt = (async () => {
    try {
      const data = await fetchJson(FORECAST_URL, params)
      writeEntry(key, data)
      return data
    } catch (openMeteoError) {
      try {
        const data = await forecastFromMetNo(params)
        writeEntry(key, data)
        return data
      } catch {
        // 둘 다 막혔다 — 지난번에 받아 둔 값이 있으면 그것을 보여 준다
        if (cached) return cached.data
        throw openMeteoError
      }
    }
  })().finally(() => inFlight.delete(key))

  inFlight.set(key, attempt)
  return attempt
}

/**
 * 그 질문에 마지막으로 답이 온 시각. 없으면 null.
 * "○시 기준" 처럼 화면에 적어 주고 싶을 때 쓴다.
 */
export const lastAnsweredAt = (params) => readEntry(cacheKeyOf(params))?.at ?? null
