import axios from 'axios'

export { MissingWeatherApiKeyError } from './weatherErrors.js'

const API_URL = 'https://api.openweathermap.org/data/2.5/weather'
const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast'
const REVERSE_GEOCODING_API_URL = 'https://api.openweathermap.org/geo/1.0/reverse'
const OPEN_METEO_API_URL = 'https://api.open-meteo.com/v1/forecast'

const finiteNumberOrNull = (value) => (Number.isFinite(value) ? value : null)
const nonEmptyStringOrNull = (value) => {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}
const getCountryName = (countryCode) => {
  if (!countryCode) return null

  try {
    return new Intl.DisplayNames(['ko'], { type: 'region' }).of(countryCode) ?? countryCode
  } catch {
    return countryCode
  }
}
const stripRomanizedKoreanSuffix = (value) => value.replace(/(?:[-\s](?:si|gun|gu|do))$/i, '').trim()
const resolveCurrentLocationName = (payload, locationPayload, countryCode) => {
  const englishName = nonEmptyStringOrNull(locationPayload?.local_names?.en) || nonEmptyStringOrNull(locationPayload?.name) || nonEmptyStringOrNull(payload?.name)
  if (!englishName) return null
  return countryCode === 'KR' ? stripRomanizedKoreanSuffix(englishName) : englishName
}
const FORECAST_ITEM_LIMIT = 8
const DAILY_FORECAST_LIMIT = 5
const SECONDS_PER_DAY = 24 * 60 * 60
const LOCAL_NOON_SECONDS = 12 * 60 * 60
const OPEN_METEO_HOURLY_STEP = 3
export const WEATHER_LIST_CONCURRENCY = 6

const OPEN_METEO_CURRENT_FIELDS = ['temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'surface_pressure', 'pressure_msl', 'wind_speed_10m', 'weather_code', 'is_day'].join(',')
const OPEN_METEO_HOURLY_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation_probability',
  'rain',
  'snowfall',
  'wind_speed_10m',
  'weather_code',
  'is_day',
  'visibility',
].join(',')
const OPEN_METEO_DAILY_FIELDS = ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max', 'sunrise', 'sunset'].join(',')

const WMO_CONDITIONS = Object.freeze({
  0: Object.freeze({ id: 800, main: 'Clear', description: '맑음', icon: '01' }),
  1: Object.freeze({ id: 801, main: 'Clouds', description: '대체로 맑음', icon: '02' }),
  2: Object.freeze({ id: 802, main: 'Clouds', description: '부분적으로 흐림', icon: '03' }),
  3: Object.freeze({ id: 804, main: 'Clouds', description: '흐림', icon: '04' }),
  45: Object.freeze({ id: 741, main: 'Fog', description: '안개', icon: '50' }),
  48: Object.freeze({ id: 741, main: 'Fog', description: '서리 안개', icon: '50' }),
  51: Object.freeze({ id: 300, main: 'Drizzle', description: '약한 이슬비', icon: '09' }),
  53: Object.freeze({ id: 301, main: 'Drizzle', description: '이슬비', icon: '09' }),
  55: Object.freeze({ id: 302, main: 'Drizzle', description: '강한 이슬비', icon: '09' }),
  56: Object.freeze({ id: 311, main: 'Drizzle', description: '약한 어는 이슬비', icon: '09' }),
  57: Object.freeze({ id: 312, main: 'Drizzle', description: '강한 어는 이슬비', icon: '09' }),
  61: Object.freeze({ id: 500, main: 'Rain', description: '약한 비', icon: '10' }),
  63: Object.freeze({ id: 501, main: 'Rain', description: '비', icon: '10' }),
  65: Object.freeze({ id: 502, main: 'Rain', description: '강한 비', icon: '10' }),
  66: Object.freeze({ id: 511, main: 'Rain', description: '약한 어는 비', icon: '13' }),
  67: Object.freeze({ id: 511, main: 'Rain', description: '강한 어는 비', icon: '13' }),
  71: Object.freeze({ id: 600, main: 'Snow', description: '약한 눈', icon: '13' }),
  73: Object.freeze({ id: 601, main: 'Snow', description: '눈', icon: '13' }),
  75: Object.freeze({ id: 602, main: 'Snow', description: '강한 눈', icon: '13' }),
  77: Object.freeze({ id: 611, main: 'Snow', description: '싸락눈', icon: '13' }),
  80: Object.freeze({ id: 520, main: 'Rain', description: '약한 소나기', icon: '09' }),
  81: Object.freeze({ id: 521, main: 'Rain', description: '소나기', icon: '09' }),
  82: Object.freeze({ id: 522, main: 'Rain', description: '강한 소나기', icon: '09' }),
  85: Object.freeze({ id: 620, main: 'Snow', description: '약한 눈 소나기', icon: '13' }),
  86: Object.freeze({ id: 622, main: 'Snow', description: '강한 눈 소나기', icon: '13' }),
  95: Object.freeze({ id: 200, main: 'Thunderstorm', description: '뇌우', icon: '11' }),
  96: Object.freeze({ id: 201, main: 'Thunderstorm', description: '약한 우박을 동반한 뇌우', icon: '11' }),
  99: Object.freeze({ id: 202, main: 'Thunderstorm', description: '강한 우박을 동반한 뇌우', icon: '11' }),
})

const openMeteoRequests = new Map()

const formatLocalDate = (timestamp, timezoneOffset) => {
  if (!Number.isFinite(timestamp) || !Number.isFinite(timezoneOffset)) return null

  const localDate = new Date((timestamp + timezoneOffset) * 1000)
  if (Number.isNaN(localDate.getTime())) return null

  const year = localDate.getUTCFullYear()
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(localDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toPrecipitationPercentage = (value) => {
  if (!Number.isFinite(value)) return null
  return Math.round(Math.min(Math.max(value, 0), 1) * 100)
}

const mapForecastItem = (item, timezoneOffset) => {
  const currentCondition = item?.weather?.[0]
  const timestamp = finiteNumberOrNull(item?.dt)

  return {
    timestamp,
    localDate: formatLocalDate(timestamp, timezoneOffset),
    temperature: finiteNumberOrNull(item?.main?.temp),
    feelsLike: finiteNumberOrNull(item?.main?.feels_like),
    humidity: finiteNumberOrNull(item?.main?.humidity),
    weatherId: finiteNumberOrNull(currentCondition?.id),
    weatherMain: nonEmptyStringOrNull(currentCondition?.main),
    weatherDescription: nonEmptyStringOrNull(currentCondition?.description),
    icon: nonEmptyStringOrNull(currentCondition?.icon),
    precipitationProbability: toPrecipitationPercentage(item?.pop),
    rainVolume: finiteNumberOrNull(item?.rain?.['3h']),
    snowVolume: finiteNumberOrNull(item?.snow?.['3h']),
    windSpeed: finiteNumberOrNull(item?.wind?.speed),
  }
}

const secondsFromLocalNoon = (timestamp, timezoneOffset) => {
  const localSeconds = (((timestamp + timezoneOffset) % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY
  return Math.abs(localSeconds - LOCAL_NOON_SECONDS)
}

const finiteValues = (items, selectValue) => items.map(selectValue).filter(Number.isFinite)

const mapDailyForecast = (entries, timezoneOffset) => {
  const mappedEntries = entries.map((item) => ({ source: item, mapped: mapForecastItem(item, timezoneOffset) }))
  const entriesByLocalDate = new Map()

  for (const entry of mappedEntries) {
    if (!entry.mapped.localDate || entry.mapped.timestamp === null) continue

    const dateEntries = entriesByLocalDate.get(entry.mapped.localDate) ?? []
    dateEntries.push(entry)
    entriesByLocalDate.set(entry.mapped.localDate, dateEntries)
  }

  return [...entriesByLocalDate.entries()].slice(0, DAILY_FORECAST_LIMIT).map(([date, dateEntries]) => {
    const representative = dateEntries.reduce((closest, candidate) => {
      const closestDistance = secondsFromLocalNoon(closest.mapped.timestamp, timezoneOffset)
      const candidateDistance = secondsFromLocalNoon(candidate.mapped.timestamp, timezoneOffset)
      return candidateDistance < closestDistance ? candidate : closest
    })
    const forecastTemperatures = finiteValues(dateEntries, ({ mapped }) => mapped.temperature)
    const precipitationProbabilities = finiteValues(dateEntries, ({ mapped }) => mapped.precipitationProbability)

    return {
      date,
      timestamp: representative.mapped.timestamp,
      minTemperature: forecastTemperatures.length ? Math.min(...forecastTemperatures) : null,
      maxTemperature: forecastTemperatures.length ? Math.max(...forecastTemperatures) : null,
      precipitationProbability: precipitationProbabilities.length ? Math.max(...precipitationProbabilities) : null,
      weatherId: representative.mapped.weatherId,
      weatherMain: representative.mapped.weatherMain,
      weatherDescription: representative.mapped.weatherDescription,
      icon: representative.mapped.icon,
    }
  })
}

const getWeatherApiKey = () => import.meta.env?.VITE_OPENWEATHER_API_KEY
const normalizeApiKey = (apiKey) => (typeof apiKey === 'string' ? apiKey.trim() : '')
const isUsableWeatherApiKey = (apiKey) => {
  const normalizedApiKey = normalizeApiKey(apiKey)
  return Boolean(normalizedApiKey && normalizedApiKey !== 'replace_with_your_key')
}
const getArrayValue = (values, index) => (Array.isArray(values) ? values[index] : undefined)
const firstFiniteNumber = (...values) => values.find(Number.isFinite) ?? null

const parseOpenMeteoTimestamp = (value, timezoneOffset) => {
  if (Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const normalized = value.trim()
  if (!normalized) return null

  const hasExplicitOffset = /(?:z|[+-]\d{2}:?\d{2})$/i.test(normalized)
  const milliseconds = Date.parse(hasExplicitOffset ? normalized : `${normalized}Z`)
  if (!Number.isFinite(milliseconds)) return null
  if (hasExplicitOffset) return milliseconds / 1000
  if (!Number.isFinite(timezoneOffset)) return null
  return milliseconds / 1000 - timezoneOffset
}

const clampPercentage = (value) => {
  if (!Number.isFinite(value)) return null
  return Math.round(Math.min(Math.max(value, 0), 100))
}

const mapWmoCondition = (weatherCode, isDay = 1) => {
  const condition = Number.isFinite(weatherCode) ? WMO_CONDITIONS[weatherCode] : null

  return {
    weatherId: condition?.id ?? null,
    weatherMain: condition?.main ?? null,
    weatherDescription: condition?.description ?? null,
    icon: condition ? `${condition.icon}${isDay === 0 ? 'n' : 'd'}` : null,
  }
}

const getClosestTimeIndex = (times, targetTimestamp, timezoneOffset) => {
  if (!Array.isArray(times) || !times.length || !Number.isFinite(targetTimestamp)) return -1

  return times.reduce((closestIndex, time, index) => {
    const timestamp = parseOpenMeteoTimestamp(time, timezoneOffset)
    if (!Number.isFinite(timestamp)) return closestIndex
    if (closestIndex < 0) return index

    const closestTimestamp = parseOpenMeteoTimestamp(times[closestIndex], timezoneOffset)
    return Math.abs(timestamp - targetTimestamp) < Math.abs(closestTimestamp - targetTimestamp) ? index : closestIndex
  }, -1)
}

const getOpenMeteoLocalDate = (value, timezoneOffset) => formatLocalDate(parseOpenMeteoTimestamp(value, timezoneOffset), timezoneOffset)

export const hasWeatherApiKey = () => isUsableWeatherApiKey(getWeatherApiKey())

// Open-Meteo에는 공개 클라이언트용 API 키가 필요하지 않으므로 날씨 요청은 항상 시도할 수 있습니다.
export const isWeatherServiceReady = () => true

export const mapWeatherResponse = (city, payload = {}, locationPayload = {}) => {
  const currentCondition = payload?.weather?.[0]
  const resolvedCountryCode = city?.isCurrentLocation ? nonEmptyStringOrNull(locationPayload?.country) || nonEmptyStringOrNull(payload?.sys?.country) : null
  const resolvedLocationName = city?.isCurrentLocation ? resolveCurrentLocationName(payload, locationPayload, resolvedCountryCode) : null
  const resolvedCountryName = getCountryName(resolvedCountryCode)

  return {
    ...city,
    ...(resolvedLocationName
      ? {
          name: resolvedLocationName,
          displayName: resolvedLocationName.toLocaleUpperCase('en-US'),
          fullName: `내 위치 · ${resolvedLocationName}`,
        }
      : {}),
    ...(resolvedCountryCode ? { countryCode: resolvedCountryCode, countryName: resolvedCountryName } : {}),
    temp: finiteNumberOrNull(payload?.main?.temp),
    feelsLike: finiteNumberOrNull(payload?.main?.feels_like),
    humidity: finiteNumberOrNull(payload?.main?.humidity),
    pressure: finiteNumberOrNull(payload?.main?.pressure),
    visibility: finiteNumberOrNull(payload?.visibility),
    wind: finiteNumberOrNull(payload?.wind?.speed),
    observedAt: finiteNumberOrNull(payload?.dt),
    sunrise: finiteNumberOrNull(payload?.sys?.sunrise),
    sunset: finiteNumberOrNull(payload?.sys?.sunset),
    timezoneOffset: finiteNumberOrNull(payload?.timezone),
    condition: nonEmptyStringOrNull(currentCondition?.main),
    conditionId: finiteNumberOrNull(currentCondition?.id),
    iconCode: nonEmptyStringOrNull(currentCondition?.icon),
    status: nonEmptyStringOrNull(currentCondition?.description),
  }
}

export const mapForecastResponse = (payload = {}) => {
  const timezoneOffset = finiteNumberOrNull(payload?.city?.timezone)
  const forecastEntries = Array.isArray(payload?.list) ? payload.list : []

  if (!forecastEntries.length) {
    return { timezoneOffset, hourly: [], daily: [] }
  }

  return {
    timezoneOffset,
    hourly: forecastEntries.slice(0, FORECAST_ITEM_LIMIT).map((item) => mapForecastItem(item, timezoneOffset)),
    daily: timezoneOffset === null ? [] : mapDailyForecast(forecastEntries, timezoneOffset),
  }
}

export const mapOpenMeteoWeatherResponse = (city, payload = {}) => {
  const timezoneOffset = finiteNumberOrNull(payload?.utc_offset_seconds)
  const current = payload?.current ?? {}
  const observedAt = parseOpenMeteoTimestamp(current?.time, timezoneOffset)
  const condition = mapWmoCondition(current?.weather_code, current?.is_day)
  const currentLocalDate = formatLocalDate(observedAt, timezoneOffset)
  const dailyTimes = Array.isArray(payload?.daily?.time) ? payload.daily.time : []
  const dailyIndex = Math.max(
    0,
    dailyTimes.findIndex((time) => getOpenMeteoLocalDate(time, timezoneOffset) === currentLocalDate),
  )
  const visibilityIndex = getClosestTimeIndex(payload?.hourly?.time, observedAt, timezoneOffset)

  return {
    ...city,
    temp: finiteNumberOrNull(current?.temperature_2m),
    feelsLike: finiteNumberOrNull(current?.apparent_temperature),
    humidity: finiteNumberOrNull(current?.relative_humidity_2m),
    pressure: firstFiniteNumber(current?.surface_pressure, current?.pressure_msl),
    visibility: finiteNumberOrNull(getArrayValue(payload?.hourly?.visibility, visibilityIndex)),
    wind: finiteNumberOrNull(current?.wind_speed_10m),
    observedAt,
    sunrise: parseOpenMeteoTimestamp(getArrayValue(payload?.daily?.sunrise, dailyIndex), timezoneOffset),
    sunset: parseOpenMeteoTimestamp(getArrayValue(payload?.daily?.sunset, dailyIndex), timezoneOffset),
    timezoneOffset,
    condition: condition.weatherMain,
    conditionId: condition.weatherId,
    iconCode: condition.icon,
    status: condition.weatherDescription,
  }
}

export const mapOpenMeteoForecastResponse = (payload = {}) => {
  const timezoneOffset = finiteNumberOrNull(payload?.utc_offset_seconds)
  const referenceTimestamp = parseOpenMeteoTimestamp(payload?.current?.time, timezoneOffset)
  const hourlyTimes = Array.isArray(payload?.hourly?.time) ? payload.hourly.time : []
  const mappedHourly = hourlyTimes.map((time, index) => {
    const timestamp = parseOpenMeteoTimestamp(time, timezoneOffset)
    const condition = mapWmoCondition(getArrayValue(payload?.hourly?.weather_code, index), getArrayValue(payload?.hourly?.is_day, index))

    return {
      timestamp,
      localDate: formatLocalDate(timestamp, timezoneOffset),
      temperature: finiteNumberOrNull(getArrayValue(payload?.hourly?.temperature_2m, index)),
      feelsLike: finiteNumberOrNull(getArrayValue(payload?.hourly?.apparent_temperature, index)),
      humidity: finiteNumberOrNull(getArrayValue(payload?.hourly?.relative_humidity_2m, index)),
      weatherId: condition.weatherId,
      weatherMain: condition.weatherMain,
      weatherDescription: condition.weatherDescription,
      icon: condition.icon,
      precipitationProbability: clampPercentage(getArrayValue(payload?.hourly?.precipitation_probability, index)),
      rainVolume: finiteNumberOrNull(getArrayValue(payload?.hourly?.rain, index)),
      snowVolume: finiteNumberOrNull(getArrayValue(payload?.hourly?.snowfall, index)),
      windSpeed: finiteNumberOrNull(getArrayValue(payload?.hourly?.wind_speed_10m, index)),
    }
  })
  const futureHourly = Number.isFinite(referenceTimestamp) ? mappedHourly.filter(({ timestamp }) => Number.isFinite(timestamp) && timestamp >= referenceTimestamp) : mappedHourly
  const hourly = []

  for (let index = 0; index < futureHourly.length && hourly.length < FORECAST_ITEM_LIMIT; index += OPEN_METEO_HOURLY_STEP) {
    hourly.push(futureHourly[index])
  }

  const dailyTimes = Array.isArray(payload?.daily?.time) ? payload.daily.time.slice(0, DAILY_FORECAST_LIMIT) : []
  const daily = dailyTimes.map((time, index) => {
    const condition = mapWmoCondition(getArrayValue(payload?.daily?.weather_code, index))
    const dayStartTimestamp = parseOpenMeteoTimestamp(time, timezoneOffset)

    return {
      date: formatLocalDate(dayStartTimestamp, timezoneOffset),
      timestamp: Number.isFinite(dayStartTimestamp) ? dayStartTimestamp + LOCAL_NOON_SECONDS : null,
      minTemperature: finiteNumberOrNull(getArrayValue(payload?.daily?.temperature_2m_min, index)),
      maxTemperature: finiteNumberOrNull(getArrayValue(payload?.daily?.temperature_2m_max, index)),
      precipitationProbability: clampPercentage(getArrayValue(payload?.daily?.precipitation_probability_max, index)),
      weatherId: condition.weatherId,
      weatherMain: condition.weatherMain,
      weatherDescription: condition.weatherDescription,
      icon: condition.icon,
    }
  })

  return { timezoneOffset, hourly, daily }
}

const fetchOpenMeteoPayload = (city) => {
  const requestKey = `${city.latitude},${city.longitude}`
  const activeRequest = openMeteoRequests.get(requestKey)
  if (activeRequest) return activeRequest

  const request = axios
    .get(OPEN_METEO_API_URL, {
      params: {
        latitude: city.latitude,
        longitude: city.longitude,
        current: OPEN_METEO_CURRENT_FIELDS,
        hourly: OPEN_METEO_HOURLY_FIELDS,
        daily: OPEN_METEO_DAILY_FIELDS,
        timezone: 'auto',
        timeformat: 'unixtime',
        forecast_days: DAILY_FORECAST_LIMIT,
        forecast_hours: 24,
        wind_speed_unit: 'ms',
      },
      timeout: 8000,
    })
    .then((response) => response.data)
    .finally(() => {
      if (openMeteoRequests.get(requestKey) === request) openMeteoRequests.delete(requestKey)
    })

  openMeteoRequests.set(requestKey, request)
  return request
}

const fetchOpenWeatherCurrent = async (city, apiKey) => {
  const requestOptions = {
    params: {
      lat: city.latitude,
      lon: city.longitude,
      appid: apiKey,
      units: 'metric',
      lang: 'kr',
    },
    timeout: 8000,
  }
  const weatherRequest = axios.get(API_URL, requestOptions)
  const locationRequest = city?.isCurrentLocation
    ? axios
        .get(REVERSE_GEOCODING_API_URL, {
          params: {
            lat: city.latitude,
            lon: city.longitude,
            limit: 1,
            appid: apiKey,
          },
          timeout: 8000,
        })
        .catch(() => null)
    : Promise.resolve(null)

  const [response, locationResponse] = await Promise.all([weatherRequest, locationRequest])

  return mapWeatherResponse(city, response.data, locationResponse?.data?.[0])
}

const fetchOpenWeatherForecast = async (city, apiKey) => {
  const response = await axios.get(FORECAST_API_URL, {
    params: {
      lat: city.latitude,
      lon: city.longitude,
      appid: apiKey,
      units: 'metric',
      lang: 'kr',
    },
    timeout: 8000,
  })

  return mapForecastResponse(response.data)
}

export const fetchCityWeather = async (city, apiKey = getWeatherApiKey()) => {
  const normalizedApiKey = normalizeApiKey(apiKey)

  if (isUsableWeatherApiKey(normalizedApiKey)) {
    try {
      return await fetchOpenWeatherCurrent(city, normalizedApiKey)
    } catch {
      // OpenWeather 장애나 키 오류가 있어도 공개 배포본과 같은 Open-Meteo 경로로 복구합니다.
    }
  }

  const payload = await fetchOpenMeteoPayload(city)
  return mapOpenMeteoWeatherResponse(city, payload)
}

export const fetchCityForecast = async (city, apiKey = getWeatherApiKey()) => {
  const normalizedApiKey = normalizeApiKey(apiKey)

  if (isUsableWeatherApiKey(normalizedApiKey)) {
    try {
      return await fetchOpenWeatherForecast(city, normalizedApiKey)
    } catch {
      // 예보도 현재 날씨와 같은 provider fallback 규칙을 적용합니다.
    }
  }

  const payload = await fetchOpenMeteoPayload(city)
  return mapOpenMeteoForecastResponse(payload)
}

export const fetchWeatherList = async (cities, fetchWeather = fetchCityWeather, onComplete) => {
  const results = Array.from({ length: cities.length })
  let nextCityIndex = 0

  const runWorker = async () => {
    while (nextCityIndex < cities.length) {
      const cityIndex = nextCityIndex
      nextCityIndex += 1

      try {
        results[cityIndex] = { status: 'fulfilled', value: await fetchWeather(cities[cityIndex]) }
      } catch (reason) {
        results[cityIndex] = { status: 'rejected', reason }
      }
    }
  }

  const workerCount = Math.min(WEATHER_LIST_CONCURRENCY, cities.length)
  await Promise.all(Array.from({ length: workerCount }, runWorker))
  const successfulCities = results.filter((result) => result.status === 'fulfilled').map((result) => result.value)
  const failedCount = results.length - successfulCities.length

  onComplete?.({ failedCount, totalCount: results.length })

  if (successfulCities.length || results.length === 0) return successfulCities

  throw results[0].reason
}
