// OpenWeatherMap condition id -> 한글 상태 / Font Awesome 아이콘 매핑
// https://openweathermap.org/weather-conditions
function classify(id) {
  if (id >= 200 && id < 300) return { status: '뇌우', icon: 'fa-solid fa-cloud-bolt' }
  if (id >= 300 && id < 400) return { status: '이슬비', icon: 'fa-solid fa-cloud-rain' }
  if (id === 500 || id === 501) return { status: '비', icon: 'fa-solid fa-cloud-showers-heavy' }
  if ((id >= 502 && id <= 504) || id === 511)
    return { status: '강한 비', icon: 'fa-solid fa-cloud-showers-heavy' }
  if (id === 520 || id === 521 || id === 531)
    return { status: '소나기', icon: 'fa-solid fa-cloud-showers-heavy' }
  if (id === 522) return { status: '강한 소나기', icon: 'fa-solid fa-cloud-showers-heavy' }
  if (id === 600 || id === 601) return { status: '눈', icon: 'fa-solid fa-snowflake' }
  if (id === 602) return { status: '강한 눈', icon: 'fa-solid fa-snowflake' }
  if (id >= 611 && id <= 622) return { status: '눈', icon: 'fa-solid fa-snowflake' }
  if (id >= 701 && id <= 781) return { status: '안개', icon: 'fa-solid fa-smog' }
  if (id === 800) return { status: '맑음', icon: 'fa-solid fa-sun' }
  if (id === 801 || id === 802) return { status: '구름조금', icon: 'fa-solid fa-cloud-sun' }
  if (id === 803 || id === 804) return { status: '흐림', icon: 'fa-solid fa-cloud' }
  return null
}

const UNKNOWN = { status: '알 수 없음', icon: 'fa-solid fa-cloud-question' }

export function getWeatherInfo(conditionId) {
  return classify(conditionId) ?? UNKNOWN
}

// 카드 목록에서 실제로 쓰이는 대표 상태만 중복 없이 추린 범례용 목록
export const WEATHER_LEGEND = [
  { status: '맑음', icon: 'fa-solid fa-sun' },
  { status: '구름조금', icon: 'fa-solid fa-cloud-sun' },
  { status: '흐림', icon: 'fa-solid fa-cloud' },
  { status: '안개', icon: 'fa-solid fa-smog' },
  { status: '이슬비', icon: 'fa-solid fa-cloud-rain' },
  { status: '비', icon: 'fa-solid fa-cloud-showers-heavy' },
  { status: '눈', icon: 'fa-solid fa-snowflake' },
  { status: '뇌우', icon: 'fa-solid fa-cloud-bolt' },
]
