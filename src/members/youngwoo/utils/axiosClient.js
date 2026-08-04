import axios from 'axios'

export const weatherApi = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  timeout: 10000, // 응답이 안 와도 무한 로딩에 빠지지 않게 10초에서 끊는다.
  params: {
    appid: import.meta.env.VITE_OPENWEATHER_API_KEY,
    units: 'metric',
    lang: 'kr',
  },
})
