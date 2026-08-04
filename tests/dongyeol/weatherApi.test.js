import assert from 'node:assert/strict'
import test from 'node:test'
import axios from 'axios'

import {
  fetchCityForecast,
  fetchCityWeather,
  fetchWeatherList,
  isWeatherServiceReady,
  mapForecastResponse,
  mapOpenMeteoForecastResponse,
  mapOpenMeteoWeatherResponse,
  mapWeatherResponse,
  WEATHER_LIST_CONCURRENCY,
} from '../../src/members/dongyeol/services/weatherApi.js'

const cities = [
  { id: 'city_01', name: '서울' },
  { id: 'city_02', name: '수원' },
  { id: 'city_03', name: '부산' },
]

const createForecastEntry = (timestamp, index = 0) => ({
  dt: timestamp,
  main: {
    temp: 10 + index,
    feels_like: 9 + index,
    temp_min: 8 + index,
    temp_max: 12 + index,
    humidity: 60 + index,
  },
  weather: [
    {
      id: index === 4 ? 500 : 800,
      main: index === 4 ? 'Rain' : 'Clear',
      description: index === 4 ? '약한 비' : '맑음',
      icon: index === 4 ? '10d' : '01d',
    },
  ],
  pop: index / 10,
  rain: { '3h': index / 10 },
  snow: { '3h': index / 20 },
  wind: { speed: 2 + index / 10 },
})

const createOpenMeteoPayload = () => {
  const currentTimestamp = Date.parse('2024-01-01T03:00:00Z') / 1000
  const firstDayTimestamp = Date.parse('2023-12-31T15:00:00Z') / 1000
  const hourlyTime = Array.from({ length: 24 }, (_, index) => currentTimestamp + index * 60 * 60)
  const weatherCode = Array.from({ length: 24 }, () => 0)
  weatherCode[3] = 61

  return {
    utc_offset_seconds: 32_400,
    current: {
      time: currentTimestamp,
      temperature_2m: 7.4,
      apparent_temperature: 5.1,
      relative_humidity_2m: 67,
      surface_pressure: 1006.2,
      wind_speed_10m: 2.8,
      weather_code: 2,
      is_day: 1,
    },
    hourly: {
      time: hourlyTime,
      temperature_2m: hourlyTime.map((_, index) => 10 + index),
      apparent_temperature: hourlyTime.map((_, index) => 9 + index),
      relative_humidity_2m: hourlyTime.map((_, index) => 60 + index),
      precipitation_probability: hourlyTime.map((_, index) => index * 3),
      rain: hourlyTime.map((_, index) => index / 10),
      snowfall: hourlyTime.map((_, index) => index / 20),
      wind_speed_10m: hourlyTime.map((_, index) => 2 + index / 10),
      weather_code: weatherCode,
      is_day: hourlyTime.map((timestamp) => {
        const hour = new Date((timestamp + 32_400) * 1000).getUTCHours()
        return hour >= 6 && hour < 18 ? 1 : 0
      }),
      visibility: hourlyTime.map((_, index) => 10_000 - index * 100),
    },
    daily: {
      time: Array.from({ length: 5 }, (_, index) => firstDayTimestamp + index * 24 * 60 * 60),
      weather_code: [0, 61, 71, 95, 3],
      temperature_2m_min: [-2, -1, 0, 1, 2],
      temperature_2m_max: [8, 9, 10, 11, 12],
      precipitation_probability_max: [10, 60, 70, 80, 20],
      sunrise: Array.from({ length: 5 }, (_, index) => firstDayTimestamp + index * 24 * 60 * 60 + 7 * 60 * 60),
      sunset: Array.from({ length: 5 }, (_, index) => firstDayTimestamp + index * 24 * 60 * 60 + (17 * 60 + 30 + index) * 60),
    },
  }
}

test('OpenWeather Current Weather 응답을 실제 관측 필드로 매핑한다', () => {
  const result = mapWeatherResponse(cities[0], {
    weather: [{ id: 501, main: 'Rain', description: '보통 비', icon: '10d' }],
    main: { temp: 21.4, feels_like: 22.1, humidity: 81, pressure: 1008 },
    visibility: 7500,
    wind: { speed: 3.6 },
    dt: 1_704_067_200,
    sys: { sunrise: 1_704_040_000, sunset: 1_704_080_000 },
    timezone: 32_400,
  })

  assert.deepEqual(result, {
    ...cities[0],
    temp: 21.4,
    feelsLike: 22.1,
    humidity: 81,
    pressure: 1008,
    visibility: 7500,
    wind: 3.6,
    observedAt: 1_704_067_200,
    sunrise: 1_704_040_000,
    sunset: 1_704_080_000,
    timezoneOffset: 32_400,
    condition: 'Rain',
    conditionId: 501,
    iconCode: '10d',
    status: '보통 비',
  })
})

test('누락되거나 잘못된 OpenWeather 필드는 임의 값 없이 null로 매핑한다', () => {
  assert.deepEqual(mapWeatherResponse(cities[0], { main: { temp: '21', humidity: Number.NaN }, weather: [{}] }), {
    ...cities[0],
    temp: null,
    feelsLike: null,
    humidity: null,
    pressure: null,
    visibility: null,
    wind: null,
    observedAt: null,
    sunrise: null,
    sunset: null,
    timezoneOffset: null,
    condition: null,
    conditionId: null,
    iconCode: null,
    status: null,
  })
})

test('국내 현재 위치 응답은 행정구역 접미사를 제거한 영어 도시명으로 보강한다', () => {
  const result = mapWeatherResponse(
    {
      id: 'current-location',
      name: '현재 위치',
      fullName: '내 위치',
      countryName: '현재 위치',
      isCurrentLocation: true,
    },
    {
      name: 'Seongnam-si',
      sys: { country: 'KR' },
      weather: [{ description: '구름조금' }],
    },
  )

  assert.equal(result.name, 'Seongnam')
  assert.equal(result.displayName, 'SEONGNAM')
  assert.equal(result.countryCode, 'KR')
  assert.equal(result.countryName, '대한민국')
  assert.equal(result.fullName, '내 위치 · Seongnam')
})

test('해외 현재 위치 응답은 역지오코딩의 영어 도시명을 사용한다', () => {
  const result = mapWeatherResponse(
    {
      id: 'current-location',
      name: '현재 위치',
      isCurrentLocation: true,
    },
    {
      name: 'München',
      sys: { country: 'DE' },
    },
    {
      country: 'DE',
      name: 'Munich',
      local_names: { en: 'Munich', ko: '뮌헨' },
    },
  )

  assert.equal(result.name, 'Munich')
  assert.equal(result.displayName, 'MUNICH')
  assert.equal(result.countryCode, 'DE')
  assert.equal(result.countryName, '독일')
})

test('OpenWeather 3시간 예보를 첫 8개 시간대와 현지 날짜별 일간 예보로 매핑한다', () => {
  const startTimestamp = Date.parse('2024-01-01T00:00:00Z') / 1000
  const list = Array.from({ length: 10 }, (_, index) => createForecastEntry(startTimestamp + index * 3 * 60 * 60, index))
  const result = mapForecastResponse({ city: { timezone: 0 }, list })

  assert.equal(result.timezoneOffset, 0)
  assert.equal(result.hourly.length, 8)
  assert.deepEqual(result.hourly[4], {
    timestamp: startTimestamp + 12 * 60 * 60,
    localDate: '2024-01-01',
    temperature: 14,
    feelsLike: 13,
    humidity: 64,
    weatherId: 500,
    weatherMain: 'Rain',
    weatherDescription: '약한 비',
    icon: '10d',
    precipitationProbability: 40,
    rainVolume: 0.4,
    snowVolume: 0.2,
    windSpeed: 2.4,
  })
  assert.deepEqual(
    result.hourly.map(({ timestamp }) => timestamp),
    list.slice(0, 8).map(({ dt }) => dt),
  )
  assert.deepEqual(result.daily, [
    {
      date: '2024-01-01',
      timestamp: startTimestamp + 12 * 60 * 60,
      minTemperature: 10,
      maxTemperature: 17,
      precipitationProbability: 70,
      weatherId: 500,
      weatherMain: 'Rain',
      weatherDescription: '약한 비',
      icon: '10d',
    },
    {
      date: '2024-01-02',
      timestamp: startTimestamp + 27 * 60 * 60,
      minTemperature: 18,
      maxTemperature: 19,
      precipitationProbability: 90,
      weatherId: 800,
      weatherMain: 'Clear',
      weatherDescription: '맑음',
      icon: '01d',
    },
  ])

  const sixDayList = Array.from({ length: 6 }, (_, index) => createForecastEntry(startTimestamp + index * 24 * 60 * 60 + 12 * 60 * 60, index))
  assert.deepEqual(
    mapForecastResponse({ city: { timezone: 0 }, list: sixDayList }).daily.map(({ date }) => date),
    ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
  )
})

test('city.timezone을 적용한 현지 날짜 경계와 현지 정오에 가장 가까운 대표 항목을 사용한다', () => {
  const firstTimestamp = Date.parse('2024-01-01T14:00:00Z') / 1000
  const list = [
    createForecastEntry(firstTimestamp, 0),
    createForecastEntry(firstTimestamp + 3 * 60 * 60, 1),
    createForecastEntry(firstTimestamp + 12 * 60 * 60, 2),
    createForecastEntry(firstTimestamp + 15 * 60 * 60, 3),
  ]
  const result = mapForecastResponse({ city: { timezone: 9 * 60 * 60 }, list })

  assert.deepEqual(
    result.hourly.map(({ localDate }) => localDate),
    ['2024-01-01', '2024-01-02', '2024-01-02', '2024-01-02'],
  )
  assert.deepEqual(
    result.daily.map(({ date, timestamp }) => ({ date, timestamp })),
    [
      { date: '2024-01-01', timestamp: firstTimestamp },
      { date: '2024-01-02', timestamp: firstTimestamp + 12 * 60 * 60 },
    ],
  )
})

test('예보 필드 결측과 잘못된 list를 임의 값 없이 안전하게 처리한다', () => {
  assert.deepEqual(mapForecastResponse({ city: { timezone: 32_400 }, list: null }), {
    timezoneOffset: 32_400,
    hourly: [],
    daily: [],
  })

  const result = mapForecastResponse({
    city: { timezone: 0 },
    list: [{ dt: 'invalid', main: { temp: '21', humidity: Number.NaN }, weather: [{}], pop: Number.POSITIVE_INFINITY, rain: { '3h': '1' } }],
  })

  assert.deepEqual(result, {
    timezoneOffset: 0,
    hourly: [
      {
        timestamp: null,
        localDate: null,
        temperature: null,
        feelsLike: null,
        humidity: null,
        weatherId: null,
        weatherMain: null,
        weatherDescription: null,
        icon: null,
        precipitationProbability: null,
        rainVolume: null,
        snowVolume: null,
        windSpeed: null,
      },
    ],
    daily: [],
  })
})

test('Open-Meteo current 응답을 기존 현재 날씨 화면 계약으로 매핑한다', () => {
  const payload = createOpenMeteoPayload()

  assert.deepEqual(mapOpenMeteoWeatherResponse(cities[0], payload), {
    ...cities[0],
    temp: 7.4,
    feelsLike: 5.1,
    humidity: 67,
    pressure: 1006.2,
    visibility: 10_000,
    wind: 2.8,
    observedAt: Date.parse('2024-01-01T03:00:00Z') / 1000,
    sunrise: Date.parse('2023-12-31T22:00:00Z') / 1000,
    sunset: Date.parse('2024-01-01T08:30:00Z') / 1000,
    timezoneOffset: 32_400,
    condition: 'Clouds',
    conditionId: 802,
    iconCode: '03d',
    status: '부분적으로 흐림',
  })
})

test('Open-Meteo hourly와 daily 응답을 3시간 간격 8개 및 현지 날짜 5일 계약으로 매핑한다', () => {
  const payload = createOpenMeteoPayload()
  const result = mapOpenMeteoForecastResponse(payload)

  assert.equal(result.timezoneOffset, 32_400)
  assert.deepEqual(
    result.hourly.map(({ timestamp }) => timestamp),
    payload.hourly.time.filter((_, index) => index % 3 === 0).slice(0, 8),
  )
  assert.deepEqual(result.hourly[1], {
    timestamp: payload.hourly.time[3],
    localDate: '2024-01-01',
    temperature: 13,
    feelsLike: 12,
    humidity: 63,
    weatherId: 500,
    weatherMain: 'Rain',
    weatherDescription: '약한 비',
    icon: '10d',
    precipitationProbability: 9,
    rainVolume: 0.3,
    snowVolume: 0.15,
    windSpeed: 2.3,
  })
  assert.deepEqual(
    result.daily.map(({ date, timestamp, minTemperature, maxTemperature, precipitationProbability, weatherMain }) => ({
      date,
      timestamp,
      minTemperature,
      maxTemperature,
      precipitationProbability,
      weatherMain,
    })),
    [
      { date: '2024-01-01', timestamp: Date.parse('2024-01-01T03:00:00Z') / 1000, minTemperature: -2, maxTemperature: 8, precipitationProbability: 10, weatherMain: 'Clear' },
      { date: '2024-01-02', timestamp: Date.parse('2024-01-02T03:00:00Z') / 1000, minTemperature: -1, maxTemperature: 9, precipitationProbability: 60, weatherMain: 'Rain' },
      { date: '2024-01-03', timestamp: Date.parse('2024-01-03T03:00:00Z') / 1000, minTemperature: 0, maxTemperature: 10, precipitationProbability: 70, weatherMain: 'Snow' },
      { date: '2024-01-04', timestamp: Date.parse('2024-01-04T03:00:00Z') / 1000, minTemperature: 1, maxTemperature: 11, precipitationProbability: 80, weatherMain: 'Thunderstorm' },
      { date: '2024-01-05', timestamp: Date.parse('2024-01-05T03:00:00Z') / 1000, minTemperature: 2, maxTemperature: 12, precipitationProbability: 20, weatherMain: 'Clouds' },
    ],
  )
})

test('날씨 서비스는 OpenWeather 키 없이도 Open-Meteo를 사용할 수 있다', async () => {
  const originalGet = axios.get
  let capturedRequest

  axios.get = async (url, config) => {
    capturedRequest = { url, config }
    return { data: createOpenMeteoPayload() }
  }

  try {
    const result = await fetchCityWeather({ ...cities[0], latitude: 37.5665, longitude: 126.978 }, '')
    assert.equal(result.temp, 7.4)
    assert.equal(result.status, '부분적으로 흐림')
  } finally {
    axios.get = originalGet
  }

  assert.equal(isWeatherServiceReady(), true)
  assert.equal(capturedRequest.url, 'https://api.open-meteo.com/v1/forecast')
  assert.equal(capturedRequest.config.params.latitude, 37.5665)
  assert.equal(capturedRequest.config.params.longitude, 126.978)
  assert.equal(capturedRequest.config.params.timezone, 'auto')
  assert.equal(capturedRequest.config.params.timeformat, 'unixtime')
  assert.equal(capturedRequest.config.params.forecast_hours, 24)
  assert.equal(capturedRequest.config.params.wind_speed_unit, 'ms')
  assert.match(capturedRequest.config.params.current, /temperature_2m/)
  assert.match(capturedRequest.config.params.hourly, /visibility/)
  assert.match(capturedRequest.config.params.daily, /sunrise/)
})

test('도시 좌표와 API 키로 OpenWeather forecast 요청을 보내고 응답을 매핑한다', async () => {
  const originalGet = axios.get
  let capturedRequest

  axios.get = async (url, config) => {
    capturedRequest = { url, config }
    return { data: { city: { timezone: 0 }, list: [] } }
  }

  try {
    assert.deepEqual(await fetchCityForecast({ latitude: 37.5665, longitude: 126.978 }, 'forecast-api-key'), {
      timezoneOffset: 0,
      hourly: [],
      daily: [],
    })
  } finally {
    axios.get = originalGet
  }

  assert.deepEqual(capturedRequest, {
    url: 'https://api.openweathermap.org/data/2.5/forecast',
    config: {
      params: {
        lat: 37.5665,
        lon: 126.978,
        appid: 'forecast-api-key',
        units: 'metric',
        lang: 'kr',
      },
      timeout: 8000,
    },
  })
})

test('OpenWeather forecast 요청이 실패하면 Open-Meteo 예보로 자동 전환한다', async () => {
  const originalGet = axios.get
  const requestedUrls = []

  axios.get = async (url) => {
    requestedUrls.push(url)
    if (url.includes('openweathermap.org')) throw new Error('OpenWeather provider failure')
    return { data: createOpenMeteoPayload() }
  }

  try {
    const result = await fetchCityForecast({ latitude: 37.5665, longitude: 126.978 }, 'forecast-api-key')
    assert.equal(result.hourly.length, 8)
    assert.equal(result.daily.length, 5)
  } finally {
    axios.get = originalGet
  }

  assert.deepEqual(requestedUrls, ['https://api.openweathermap.org/data/2.5/forecast', 'https://api.open-meteo.com/v1/forecast'])
})

test('도시 목록 요청은 일부 실패가 있어도 성공한 도시를 입력 순서대로 반환한다', async () => {
  const fetchWeather = async (city) => {
    if (city.id === 'city_02') throw new Error('수원 요청 실패')
    return { ...city, temp: city.id === 'city_01' ? 20 : 25 }
  }

  let requestSummary
  const result = await fetchWeatherList(cities, fetchWeather, (summary) => {
    requestSummary = summary
  })

  assert.deepEqual(
    result.map((city) => city.id),
    ['city_01', 'city_03'],
  )
  assert.deepEqual(requestSummary, { failedCount: 1, totalCount: 3 })
})

test('도시 목록 요청은 최대 동시 요청 수를 제한하면서 입력 순서를 유지한다', async () => {
  assert.equal(WEATHER_LIST_CONCURRENCY, 6)

  const expandedCities = Array.from({ length: WEATHER_LIST_CONCURRENCY * 2 + 1 }, (_, index) => ({ id: `city_${String(index + 1).padStart(2, '0')}` }))
  let releaseRequests
  const requestGate = new Promise((resolve) => {
    releaseRequests = resolve
  })
  const startedCityIds = []
  let activeRequestCount = 0
  let maxActiveRequestCount = 0

  const resultPromise = fetchWeatherList(expandedCities, async (city) => {
    startedCityIds.push(city.id)
    activeRequestCount += 1
    maxActiveRequestCount = Math.max(maxActiveRequestCount, activeRequestCount)
    await requestGate
    activeRequestCount -= 1
    return city
  })

  assert.equal(startedCityIds.length, WEATHER_LIST_CONCURRENCY)
  releaseRequests()

  const result = await resultPromise
  assert.equal(maxActiveRequestCount, WEATHER_LIST_CONCURRENCY)
  assert.ok(maxActiveRequestCount <= 6)
  assert.deepEqual(
    result.map((city) => city.id),
    expandedCities.map((city) => city.id),
  )
})

test('모든 도시 요청이 실패하면 첫 번째 요청 오류를 전달하고 빈 입력은 빈 배열을 반환한다', async () => {
  const fetchWeather = async (city) => {
    throw new Error(`${city.id} 요청 실패`)
  }

  await assert.rejects(fetchWeatherList(cities, fetchWeather), /city_01 요청 실패/)
  assert.deepEqual(await fetchWeatherList([], fetchWeather), [])
})
