// OpenWeatherMap(https://openweathermap.org)을 Axios로 호출한다.
// API 키가 필요하다 — .env의 VITE_OPENWEATHER_API_KEY.
//
// 키가 없으면 Open-Meteo(https://open-meteo.com)로 대신 조회한다.
// 공개 배포본에는 키를 넣을 수 없기 때문이다 — VITE_ 로 시작하는 값은 빌드할 때
// 번들 파일에 그대로 새겨져서, 배포하면 누구나 열어 볼 수 있다.
//
// 화면과 다른 composable 은 이 파일만 부르므로, 어느 쪽에서 온 값인지 모른다.
// 아래 함수들의 반환 모양이 두 경로에서 같기 때문이다.
import axios from 'axios'
import { fetchForecast } from '../../openMeteo.js'

const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'
const GEOCODE_URL = 'https://api.openweathermap.org/geo/1.0/direct'
const AIR_POLLUTION_URL = 'https://api.openweathermap.org/data/2.5/air_pollution'

// Open-Meteo — 키도 가입도 필요 없다
const OM_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const OM_GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const OM_AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'

function requireApiKey() {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY
  if (!apiKey) {
    throw new Error('OpenWeatherMap API 키가 설정되지 않았습니다. .env의 VITE_OPENWEATHER_API_KEY를 확인하세요.')
  }
  return apiKey
}

export function hasOpenWeatherApiKey() {
  return Boolean(import.meta.env.VITE_OPENWEATHER_API_KEY)
}

/** WMO 날씨 코드 → 한국어. OpenWeatherMap 의 description 자리를 대신한다. */
const WMO_TEXT = {
  0: '맑음', 1: '대체로 맑음', 2: '구름 조금', 3: '흐림',
  45: '안개', 48: '짙은 안개',
  51: '가벼운 이슬비', 53: '이슬비', 55: '강한 이슬비',
  56: '어는 이슬비', 57: '강한 어는 이슬비',
  61: '약한 비', 63: '비', 65: '강한 비',
  66: '어는 비', 67: '강한 어는 비',
  71: '약한 눈', 73: '눈', 75: '강한 눈', 77: '싸락눈',
  80: '소나기', 81: '강한 소나기', 82: '매우 강한 소나기',
  85: '약한 눈보라', 86: '강한 눈보라',
  95: '뇌우', 96: '우박 동반 뇌우', 99: '강한 우박 동반 뇌우',
}

// 위/경도로 현재 날씨를 조회한다 (기본 도시 목록 + 도시 추가 후 날씨 조회에 사용).
export async function fetchOpenWeatherByCoords(lat, lon) {
  if (!hasOpenWeatherApiKey()) return fetchFromOpenMeteo(lat, lon)

  const apiKey = requireApiKey()

  const { data } = await axios.get(WEATHER_URL, {
    params: { lat, lon, appid: apiKey, units: 'metric', lang: 'kr' },
  })

  return {
    status: data.weather?.[0]?.description ?? '알 수 없음',
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: Math.round(data.main.humidity),
    windSpeed: Math.round(data.wind.speed * 10) / 10,
  }
}

/** 키가 없을 때의 현재 날씨 — 위와 같은 모양으로 돌려준다 */
async function fetchFromOpenMeteo(lat, lon) {
  // 팀 공용 창구를 거친다 — 표지의 미리보기 여섯 개가 같은 값을 나눠 쓰고,
  // Open-Meteo 가 하루 한도로 막히면 met.no 가 대신 답한다.
  const data = await fetchForecast({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
    timezone: 'auto',
  })

  const now = data.current ?? {}
  return {
    status: WMO_TEXT[now.weather_code] ?? '알 수 없음',
    temp: Math.round(now.temperature_2m ?? 0),
    feelsLike: Math.round(now.apparent_temperature ?? now.temperature_2m ?? 0),
    humidity: Math.round(now.relative_humidity_2m ?? 0),
    // Open-Meteo 는 km/h 로 준다. OpenWeatherMap 과 맞추려면 m/s 로 바꿔야 한다.
    windSpeed: Math.round(((now.wind_speed_10m ?? 0) / 3.6) * 10) / 10,
  }
}

// 도시 이름으로 위/경도 후보를 검색한다 (OpenWeatherMap Geocoding API).
export async function searchOpenWeatherCities(query) {
  const q = query.trim()
  if (!q) return []

  if (!hasOpenWeatherApiKey()) return searchWithOpenMeteo(q)

  const apiKey = requireApiKey()
  const { data } = await axios.get(GEOCODE_URL, {
    params: { q, limit: 6, appid: apiKey },
  })

  return (data ?? []).map((r) => ({
    id: `ow_${r.lat}_${r.lon}`,
    name: [r.local_names?.ko ?? r.name, r.state, r.country].filter(Boolean).join(', '),
    lat: r.lat,
    lon: r.lon,
  }))
}

/** 키가 없을 때의 도시 검색 */
async function searchWithOpenMeteo(q) {
  const { data } = await axios.get(OM_GEOCODE_URL, {
    params: { name: q, count: 6, language: 'ko', format: 'json' },
  })

  return (data.results ?? []).map((r) => ({
    id: `om_${r.latitude}_${r.longitude}`,
    name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    lat: r.latitude,
    lon: r.longitude,
  }))
}

// 위/경도의 대기질(미세먼지 포함)을 조회한다 (OpenWeatherMap Air Pollution API).
export async function fetchAirQuality(lat, lon) {
  if (!hasOpenWeatherApiKey()) return fetchAirWithOpenMeteo(lat, lon)

  const apiKey = requireApiKey()
  const { data } = await axios.get(AIR_POLLUTION_URL, {
    params: { lat, lon, appid: apiKey },
  })

  const entry = data.list?.[0]
  const components = entry?.components ?? {}
  return {
    aqi: entry?.main?.aqi ?? null,
    pm10: components.pm10 != null ? Math.round(components.pm10) : null,
    pm2_5: components.pm2_5 != null ? Math.round(components.pm2_5) : null,
  }
}

/**
 * 키가 없을 때의 대기질.
 *
 * OpenWeatherMap 의 aqi(1~5)에 해당하는 값이 Open-Meteo 에는 없다.
 * 억지로 만들어 내지 않고 null 로 둔다 — 화면은 pm10 등급으로 말한다.
 */
async function fetchAirWithOpenMeteo(lat, lon) {
  const { data } = await axios.get(OM_AIR_URL, {
    params: { latitude: lat, longitude: lon, current: 'pm10,pm2_5', timezone: 'auto' },
  })

  const now = data.current ?? {}
  return {
    aqi: null,
    pm10: now.pm10 != null ? Math.round(now.pm10) : null,
    pm2_5: now.pm2_5 != null ? Math.round(now.pm2_5) : null,
  }
}

// 한국 환경부 미세먼지(PM10) 등급 기준 — 좋음/보통/나쁨/매우나쁨
export function gradePm10(pm10) {
  if (pm10 === null || pm10 === undefined) return null
  if (pm10 <= 30) return '좋음'
  if (pm10 <= 80) return '보통'
  if (pm10 <= 150) return '나쁨'
  return '매우나쁨'
}
