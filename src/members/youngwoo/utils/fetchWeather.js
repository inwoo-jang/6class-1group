import axios from 'axios'
import { weatherApi } from './axiosClient'
import { getWeatherInfo as getOpenWeatherStatus } from './openWeatherCode'
import { getWeatherInfo as getOpenMeteoStatus } from './openMeteoCode'
import { fetchForecast as fetchSharedForecast } from '../../openMeteo.js'

// OpenWeatherMap Current Weather API는 Open-Meteo와 달리 좌표를 한 번에 묶어 조회할 수 없어서
// 도시마다 개별 요청을 axios.all로 병렬 실행한다.
async function fetchFromOpenWeather(cities) {
  const requests = cities.map((city) =>
    weatherApi.get('/weather', { params: { lat: city.lat, lon: city.lon } }),
  )
  const responses = await axios.all(requests)

  return responses.map((response, index) => {
    const city = cities[index]
    const data = response.data
    const { status, icon } = getOpenWeatherStatus(data.weather?.[0]?.id)
    return {
      id: city.id,
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      temp: Math.round(data.main?.temp ?? 0),
      feelsLike: Math.round(data.main?.feels_like ?? 0),
      humidity: Math.round(data.main?.humidity ?? 0),
      windSpeed: Math.round((data.wind?.speed ?? 0) * 10) / 10,
      status,
      icon,
    }
  })
}

// OpenWeatherMap API 키가 없는 환경(예: 아직 키를 못 넘겨준 배포 빌드)을 위한 폴백.
// 키가 필요 없는 Open-Meteo를 그대로 사용한다.
async function fetchFromOpenMeteo(cities) {
  const latitude = cities.map((city) => city.lat).join(',')
  const longitude = cities.map((city) => city.lon).join(',')
  const fields =
    'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weathercode'

  // 팀 공용 창구를 거친다 — 표지의 미리보기 여섯 개가 같은 값을 나눠 쓰고,
  // Open-Meteo 가 하루 한도로 막히면 met.no 가 대신 답한다.
  const data = await fetchSharedForecast({
    latitude,
    longitude,
    current: fields,
    timezone: 'Asia/Seoul',
  })
  // Open-Meteo는 좌표가 1개일 때는 단일 객체를, 2개 이상일 때는 배열을 반환한다.
  const results = Array.isArray(data) ? data : [data]

  return cities.map((city, index) => {
    const current = results[index]?.current
    const { status, icon } = getOpenMeteoStatus(current?.weathercode)
    return {
      id: city.id,
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      temp: Math.round(current?.temperature_2m ?? 0),
      feelsLike: Math.round(current?.apparent_temperature ?? 0),
      humidity: Math.round(current?.relative_humidity_2m ?? 0),
      // Open-Meteo 기본 풍속 단위는 km/h. OpenWeatherMap 경로(m/s)와 값을 맞추기 위해 변환한다.
      windSpeed: Math.round(((current?.wind_speed_10m ?? 0) / 3.6) * 10) / 10,
      status,
      icon,
    }
  })
}

// cities: [{ id, name, lat, lon }] -> 현재 날씨를 도시별로 조회해 매핑.
// OpenWeatherMap API 키가 있으면 우선 사용하고, 키가 없거나 호출이 실패하면
// 키가 필요 없는 Open-Meteo로 자동 폴백한다.
export async function fetchWeatherForCities(cities) {
  const hasApiKey = Boolean(import.meta.env.VITE_OPENWEATHER_API_KEY)

  if (hasApiKey) {
    try {
      return await fetchFromOpenWeather(cities)
    } catch {
      // 아래 Open-Meteo 폴백으로 이어진다.
    }
  }

  return fetchFromOpenMeteo(cities)
}

// fetchWeatherForCities가 던진 에러를 화면에 보여줄 문구로 변환한다.
export function getWeatherErrorMessage(error) {
  if (error?.status === 429) {
    return '요청이 너무 많습니다 (429 Too Many Requests). 잠시 후 다시 시도해 주세요.'
  }
  return '날씨 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
}
