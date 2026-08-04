// OpenWeatherMap(https://openweathermap.org)을 Axios로 호출한다.
// API 키가 필요하다 — .env의 VITE_OPENWEATHER_API_KEY.
import axios from 'axios'

const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'
const GEOCODE_URL = 'https://api.openweathermap.org/geo/1.0/direct'
const AIR_POLLUTION_URL = 'https://api.openweathermap.org/data/2.5/air_pollution'

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

// 위/경도로 현재 날씨를 조회한다 (기본 도시 목록 + 도시 추가 후 날씨 조회에 사용).
export async function fetchOpenWeatherByCoords(lat, lon) {
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

// 도시 이름으로 위/경도 후보를 검색한다 (OpenWeatherMap Geocoding API).
export async function searchOpenWeatherCities(query) {
  const q = query.trim()
  if (!q) return []

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

// 위/경도의 대기질(미세먼지 포함)을 조회한다 (OpenWeatherMap Air Pollution API).
export async function fetchAirQuality(lat, lon) {
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

// 한국 환경부 미세먼지(PM10) 등급 기준 — 좋음/보통/나쁨/매우나쁨
export function gradePm10(pm10) {
  if (pm10 === null || pm10 === undefined) return null
  if (pm10 <= 30) return '좋음'
  if (pm10 <= 80) return '보통'
  if (pm10 <= 150) return '나쁨'
  return '매우나쁨'
}
