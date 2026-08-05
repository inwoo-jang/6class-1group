export function getWeatherTheme(status, temp) {
  const s = status || ''
  if (s.includes('비')) return { gradient: 'linear-gradient(135deg, #4b6cb7, #182848)', icon: '🌧️' }
  if (s.includes('눈')) return { gradient: 'linear-gradient(135deg, #83a4d4, #b6fbff)', icon: '❄️' }
  if (s.includes('구름') || s.includes('흐림')) return { gradient: 'linear-gradient(135deg, #757f9a, #d7dde8)', icon: '☁️' }
  if (temp >= 28) return { gradient: 'linear-gradient(135deg, #ff9a56, #ff6a88)', icon: '☀️' }
  return { gradient: 'linear-gradient(135deg, #56ccf2, #2f80ed)', icon: '🌤️' }
}