// 마지막 글자의 받침 유무에 따라 "이"/"가" 주격 조사를 붙인다.
// 도시 이름이 고정 목록뿐 아니라 역지오코딩으로 임의 지명("도쿄", "런던" 등)도 들어와서
// 조사를 하드코딩하면 틀리는 경우가 생긴다.
export function withSubjectParticle(word) {
  if (!word) return word

  const lastChar = word.trim().slice(-1)
  const code = lastChar.charCodeAt(0)
  const isHangulSyllable = code >= 0xac00 && code <= 0xd7a3

  if (!isHangulSyllable) return `${word}가`

  const hasBatchim = (code - 0xac00) % 28 !== 0
  return `${word}${hasBatchim ? '이' : '가'}`
}
