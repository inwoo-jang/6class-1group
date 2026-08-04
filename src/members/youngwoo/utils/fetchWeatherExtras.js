import { weatherApi } from './axiosClient'
import { getWeatherInfo as getOpenWeatherStatus } from './openWeatherCode'
import { getWeatherInfo as getOpenMeteoStatus } from './openMeteoCode'
import { fetchWithTimeout } from './fetchWithTimeout'

// 상세 페이지 전용 확장 데이터(미세먼지, 5일 예보). 도시 목록 화면에는 안 붙이고
// 상세 페이지에서 도시 1개 단위로만 호출해서 호출량 급증을 피한다.
// (notes/weather-api-roadmap.md 참고)

function classifyOpenWeatherAqi(aqi) {
  if (aqi <= 1) return '좋음'
  if (aqi === 2) return '보통'
  if (aqi === 3) return '나쁨'
  return '매우 나쁨'
}

function classifyUsAqi(usAqi) {
  if (usAqi <= 50) return '좋음'
  if (usAqi <= 100) return '보통'
  if (usAqi <= 200) return '나쁨'
  return '매우 나쁨'
}

async function fetchAirQualityFromOpenWeather({ lat, lon }) {
  const response = await weatherApi.get('/air_pollution', { params: { lat, lon } })
  const entry = response.data.list?.[0]
  return {
    level: classifyOpenWeatherAqi(entry?.main?.aqi ?? 0),
    pm10: Math.round(entry?.components?.pm10 ?? 0),
    pm2_5: Math.round(entry?.components?.pm2_5 ?? 0),
  }
}

async function fetchAirQualityFromOpenMeteo({ lat, lon }) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,us_aqi`
  const response = await fetchWithTimeout(url)
  if (!response.ok) throw new Error('미세먼지 정보를 불러오지 못했습니다.')
  const data = await response.json()
  return {
    level: classifyUsAqi(data.current?.us_aqi ?? 0),
    pm10: Math.round(data.current?.pm10 ?? 0),
    pm2_5: Math.round(data.current?.pm2_5 ?? 0),
  }
}

export async function fetchAirQuality(city) {
  const hasApiKey = Boolean(import.meta.env.VITE_OPENWEATHER_API_KEY)

  if (hasApiKey) {
    try {
      return await fetchAirQualityFromOpenWeather(city)
    } catch {
      // 아래 Open-Meteo 폴백으로 이어진다.
    }
  }

  return fetchAirQualityFromOpenMeteo(city)
}

// 3시간 간격 40개 항목을 날짜별로 묶어 일별 최고/최저·대표 날씨로 정리한다.
function groupOwmForecastByDay(list) {
  const byDate = new Map()

  list.forEach((entry) => {
    const date = entry.dt_txt.slice(0, 10)
    if (!byDate.has(date)) byDate.set(date, [])
    byDate.get(date).push(entry)
  })

  return Array.from(byDate.entries())
    .slice(0, 5)
    .map(([date, entries]) => {
      const temps = entries.map((e) => e.main.temp)
      // 정오에 가장 가까운 항목을 그 날의 대표 날씨로 쓴다.
      const noonEntry = entries.reduce((closest, e) => {
        const hour = Number(e.dt_txt.slice(11, 13))
        const closestHour = Number(closest.dt_txt.slice(11, 13))
        return Math.abs(hour - 12) < Math.abs(closestHour - 12) ? e : closest
      })
      const { status, icon } = getOpenWeatherStatus(noonEntry.weather?.[0]?.id)
      return {
        date,
        tempMax: Math.round(Math.max(...temps)),
        tempMin: Math.round(Math.min(...temps)),
        status,
        icon,
      }
    })
}

async function fetchForecastFromOpenWeather({ lat, lon }) {
  const response = await weatherApi.get('/forecast', { params: { lat, lon } })
  return groupOwmForecastByDay(response.data.list ?? [])
}

async function fetchForecastFromOpenMeteo({ lat, lon }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FSeoul&forecast_days=5`
  const response = await fetchWithTimeout(url)
  if (!response.ok) throw new Error('예보 정보를 불러오지 못했습니다.')
  const data = await response.json()
  const {
    time = [],
    weathercode = [],
    temperature_2m_max = [],
    temperature_2m_min = [],
  } = data.daily ?? {}

  return time.map((date, index) => {
    const { status, icon } = getOpenMeteoStatus(weathercode[index])
    return {
      date,
      tempMax: Math.round(temperature_2m_max[index] ?? 0),
      tempMin: Math.round(temperature_2m_min[index] ?? 0),
      status,
      icon,
    }
  })
}

export async function fetchForecast(city) {
  const hasApiKey = Boolean(import.meta.env.VITE_OPENWEATHER_API_KEY)

  if (hasApiKey) {
    try {
      return await fetchForecastFromOpenWeather(city)
    } catch {
      // 아래 Open-Meteo 폴백으로 이어진다.
    }
  }

  return fetchForecastFromOpenMeteo(city)
}

// 좌표 -> 지명. BigDataCloud는 키가 필요 없어서 OWM 키 유무와 상관없이 이거 하나로 통일한다.
// (현재 위치 버튼처럼 임의 좌표를 다루는 곳에서만 씀 — 미리 정해둔 도시 목록에는 필요 없음)
export async function reverseGeocode({ lat, lon }) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`
  const response = await fetchWithTimeout(url)
  if (!response.ok) throw new Error('위치 이름을 불러오지 못했습니다.')
  const data = await response.json()
  return data.locality || data.city || data.principalSubdivision || '알 수 없는 위치'
}
