// Open-Meteo WMO weathercode -> 한글 상태 / Font Awesome 아이콘 매핑 (OpenWeatherMap 폴백 전용)
// https://open-meteo.com/en/docs (WMO Weather interpretation codes)
const WEATHER_CODE_MAP = {
  0: { status: '맑음', icon: 'fa-solid fa-sun' },
  1: { status: '맑음', icon: 'fa-solid fa-sun' },
  2: { status: '구름조금', icon: 'fa-solid fa-cloud-sun' },
  3: { status: '흐림', icon: 'fa-solid fa-cloud' },
  45: { status: '안개', icon: 'fa-solid fa-smog' },
  48: { status: '안개', icon: 'fa-solid fa-smog' },
  51: { status: '이슬비', icon: 'fa-solid fa-cloud-rain' },
  53: { status: '이슬비', icon: 'fa-solid fa-cloud-rain' },
  55: { status: '이슬비', icon: 'fa-solid fa-cloud-rain' },
  61: { status: '비', icon: 'fa-solid fa-cloud-showers-heavy' },
  63: { status: '비', icon: 'fa-solid fa-cloud-showers-heavy' },
  65: { status: '강한 비', icon: 'fa-solid fa-cloud-showers-heavy' },
  71: { status: '눈', icon: 'fa-solid fa-snowflake' },
  73: { status: '눈', icon: 'fa-solid fa-snowflake' },
  75: { status: '강한 눈', icon: 'fa-solid fa-snowflake' },
  80: { status: '소나기', icon: 'fa-solid fa-cloud-showers-heavy' },
  81: { status: '소나기', icon: 'fa-solid fa-cloud-showers-heavy' },
  82: { status: '강한 소나기', icon: 'fa-solid fa-cloud-showers-heavy' },
  95: { status: '뇌우', icon: 'fa-solid fa-cloud-bolt' },
  96: { status: '뇌우', icon: 'fa-solid fa-cloud-bolt' },
  99: { status: '뇌우', icon: 'fa-solid fa-cloud-bolt' },
}

const UNKNOWN = { status: '알 수 없음', icon: 'fa-solid fa-cloud-question' }

export function getWeatherInfo(weatherCode) {
  return WEATHER_CODE_MAP[weatherCode] ?? UNKNOWN
}
