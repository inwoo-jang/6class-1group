// 섭씨 원본 값을 store의 단위 설정에 맞게 변환한다.
export function convertTemp(celsius, unit) {
  if (unit === 'fahrenheit') return Math.round((celsius * 9) / 5 + 32)
  return celsius
}
