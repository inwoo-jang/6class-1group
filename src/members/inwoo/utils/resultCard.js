/**
 * 테스트 결과 → 저장할 그림 한 장
 * ------------------------------------------------------------------
 * 화면을 그대로 찍지 않고, 공유용 카드를 캔버스에 새로 그린다.
 *
 * 화면을 찍으면 버튼·메뉴처럼 그림에 있으면 안 되는 것들이 같이 찍히고,
 * 무엇보다 브라우저마다 다르게 나온다. 여기서 그리면 어디서 눌러도
 * 똑같은 그림이 나오고, 크기도 마음대로 키울 수 있다.
 *
 * 좌표는 전부 '기준 크기(BASE)'로 적고 마지막에 2배로 그린다.
 * 그래야 숫자를 읽기 쉽고, 결과물은 선명하다.
 */

const W = 720
const SCALE = 2
/** 좌우 여백 */
const PAD = 60

/** 카드 색 — 테스트마다 다른 강조색에서 뽑아 쓴다 */
const withAlpha = (hex, alpha) => {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const SANS = "'Pretendard Variable', Pretendard, -apple-system, sans-serif"

/** 글자를 상자 너비에 맞춰 줄바꿈한다. 캔버스는 알아서 접어 주지 않는다 */
const wrap = (ctx, text, maxWidth) => {
  const lines = []
  let line = ''
  for (const char of String(text ?? '')) {
    if (char === '\n') {
      lines.push(line)
      line = ''
      continue
    }
    const next = line + char
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = char
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** 알약 딱지들을 가운데 정렬로 한 줄에 늘어놓는다 */
const drawChips = (ctx, words, centerX, y, { fill, color, height = 36 }) => {
  const widths = words.map((word) => ctx.measureText(word).width + 36)
  const total = widths.reduce((sum, w) => sum + w, 0) + 9 * (words.length - 1)
  let x = centerX - total / 2

  words.forEach((word, i) => {
    ctx.fillStyle = fill
    roundRect(ctx, x, y, widths[i], height, height / 2)
    ctx.fill()

    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(word, x + widths[i] / 2, y + height / 2 + 1)
    x += widths[i] + 9
  })

  ctx.textBaseline = 'alphabetic'
  return y + height
}

const loadImage = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve(null)
      return
    }
    const image = new Image()
    // 번들에 들어 있는 그림이라 같은 출처다. 그래도 밝혀 두면 캔버스가 막히지 않는다
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null) // 그림이 없어도 카드는 나와야 한다
    image.src = src
  })

const R = 128 // 그림 반지름
const IMAGE_TOP = 130 // 그림 위 여백 (머리말 아래)

/**
 * 줄을 미리 접어 보고 카드 높이를 잰다.
 *
 * 높이를 넉넉히 잡아 두고 남는 곳을 잘라내면 배경 무늬가 같이 잘린다.
 * 그래서 그리기 전에 한 번 재고, 딱 맞는 크기로 만든 다음 그린다.
 */
const measure = (result) => {
  const ctx = document.createElement('canvas').getContext('2d')

  ctx.font = `500 17px ${SANS}`
  const description = wrap(ctx, result.description, W - PAD * 2 - 10).slice(0, 4)

  ctx.font = `700 19px ${SANS}`
  const share = result.shareText ? wrap(ctx, result.shareText, W - PAD * 2 - 30) : []

  let height = IMAGE_TOP + R * 2 + 92 // 그림 + 이름
  height += 34 // 한 줄 설명
  if (result.keywords?.length) height += 26 + 36
  height += 24 + description.length * 29
  if (result.strengths?.length) height += 16 + 36
  if (share.length) height += 26 + 34 + share.length * 28
  height += 78 // 꼬리말

  return { description, share, height: Math.round(height) }
}

/**
 * 결과 카드를 그려 PNG Blob 으로 돌려준다.
 *
 * @param {object} options
 * @param {object} options.test    테스트 (title · short · accent)
 * @param {object} options.result  결과 (title · subtitle · image · keywords …)
 */
export const drawResultCard = async ({ test, result }) => {
  const tone = result.tone || test.accent || '#5e8a72'

  // 글꼴이 아직 안 왔으면 기본 글꼴로 그려진다. 다 올 때까지 기다린다
  await document.fonts?.ready

  const { description, share, height: H } = measure(result)

  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  const center = W / 2

  /* ── 바탕 ── */
  ctx.fillStyle = '#fbfaf7'
  ctx.fillRect(0, 0, W, H)

  // 위쪽에만 옅게 색을 깐다. 전체에 그라데이션을 주면 탁해 보인다
  const band = ctx.createLinearGradient(0, 0, 0, H * 0.55)
  band.addColorStop(0, withAlpha(tone, 0.22))
  band.addColorStop(1, withAlpha(tone, 0))
  ctx.fillStyle = band
  ctx.fillRect(0, 0, W, H * 0.55)

  // 큰 동그라미 둘 — 아주 옅게. 진하면 얼룩처럼 보인다
  ctx.fillStyle = withAlpha(tone, 0.06)
  ctx.beginPath()
  ctx.arc(-30, 150, 170, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(W + 50, H - 120, 190, 0, Math.PI * 2)
  ctx.fill()

  /* ── 머리말 ── */
  ctx.textAlign = 'center'
  ctx.fillStyle = withAlpha(tone, 0.95)
  ctx.font = `700 20px ${SANS}`
  ctx.fillText(test.short ?? test.title, center, 66)

  ctx.fillStyle = 'rgba(90, 96, 106, 0.7)'
  ctx.font = `500 15px ${SANS}`
  ctx.fillText('내 결과는', center, 94)

  /* ── 그림 ── */
  const image = await loadImage(result.image)
  const cy = IMAGE_TOP + R

  ctx.save()
  ctx.shadowColor = withAlpha(tone, 0.4)
  ctx.shadowBlur = 32
  ctx.shadowOffsetY = 12
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(center, cy, R + 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(center, cy, R, 0, Math.PI * 2)
  ctx.clip()
  if (image) {
    // 정사각형이 아니어도 가운데를 잘라 원에 꽉 채운다
    const side = Math.min(image.width, image.height)
    ctx.drawImage(
      image,
      (image.width - side) / 2,
      (image.height - side) / 2,
      side,
      side,
      center - R,
      cy - R,
      R * 2,
      R * 2,
    )
  } else {
    ctx.fillStyle = withAlpha(tone, 0.2)
    ctx.fillRect(center - R, cy - R, R * 2, R * 2)
    ctx.fillStyle = '#fff'
    ctx.font = `700 92px ${SANS}`
    ctx.fillText(result.emoji ?? '✨', center, cy + 32)
  }
  ctx.restore()

  /* ── 이름 ── */
  let y = cy + R + 76
  ctx.fillStyle = '#23272e'
  ctx.font = `800 46px ${SANS}`
  ctx.fillText(result.title, center, y)

  y += 34
  ctx.fillStyle = withAlpha(tone, 0.95)
  ctx.font = `600 19px ${SANS}`
  ctx.fillText(result.subtitle, center, y)

  /* ── 키워드 ── */
  if (result.keywords?.length) {
    ctx.font = `700 15px ${SANS}`
    y = drawChips(
      ctx,
      result.keywords.map((word) => `#${word}`),
      center,
      y + 26,
      { fill: '#ffffff', color: withAlpha(tone, 0.95) },
    )
  }

  /* ── 설명 ── */
  y += 24
  ctx.fillStyle = 'rgba(74, 80, 90, 0.95)'
  ctx.font = `500 17px ${SANS}`
  for (const line of description) {
    y += 29
    ctx.fillText(line, center, y)
  }

  /* ── 강점 ── */
  if (result.strengths?.length) {
    ctx.font = `700 15px ${SANS}`
    y = drawChips(ctx, result.strengths.slice(0, 3), center, y + 16, {
      fill: withAlpha(tone, 0.15),
      color: '#3c424b',
    })
  }

  /* ── 한마디 ── */
  if (share.length) {
    y += 26
    const boxH = 34 + share.length * 28
    ctx.fillStyle = withAlpha(tone, 0.92)
    roundRect(ctx, PAD, y, W - PAD * 2, boxH, 20)
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.font = `700 19px ${SANS}`
    let ty = y + 38
    for (const line of share) {
      ctx.fillText(line, center, ty)
      ty += 28
    }
    y += boxH
  }

  /* ── 꼬리말 ── */
  ctx.fillStyle = 'rgba(108, 114, 124, 0.9)'
  ctx.font = `600 14px ${SANS}`
  ctx.fillText(test.title, center, y + 40)

  ctx.fillStyle = 'rgba(150, 155, 164, 0.9)'
  ctx.font = `500 13px ${SANS}`
  ctx.fillText(
    new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
    center,
    y + 62,
  )

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

/**
 * 포춘쿠키 한 줄을 카드로 그린다.
 *
 * 결과 카드와 같은 규칙(잰 뒤에 그린다 · 좌표는 기준 크기)으로 만들되,
 * 여기는 담을 것이 한 줄뿐이라 글자를 크게 놓고 여백을 넉넉히 둔다.
 *
 * @param {object} options
 * @param {string} options.message 오늘의 한 줄
 * @param {string} options.image   열린 쿠키 사진 주소
 */
export const drawFortuneCard = async ({ message, image }) => {
  await document.fonts?.ready

  /*
   * 휴대폰 배경화면으로 두기 좋게 세로로 그린다.
   * 9:19.5 는 요즘 폰 화면 비율이다. 글자는 화면 한가운데쯤 오게 두어
   * 잠금화면의 시계나 위젯과 겹치지 않게 했다.
   */
  const W2 = 1080
  const H2 = 2340
  const tone = '#5e8a72'
  const center = W2 / 2

  const canvas = document.createElement('canvas')
  canvas.width = W2
  canvas.height = H2
  const ctx = canvas.getContext('2d')

  /* 바탕 — 위는 하늘, 아래는 종이 */
  const sky = ctx.createLinearGradient(0, 0, 0, H2)
  sky.addColorStop(0, '#cfe0f2')
  sky.addColorStop(0.42, '#eef2f4')
  sky.addColorStop(1, '#f7f3ea')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W2, H2)

  ctx.fillStyle = withAlpha(tone, 0.08)
  ctx.beginPath()
  ctx.arc(-120, 420, 480, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(W2 + 160, H2 - 420, 520, 0, Math.PI * 2)
  ctx.fill()

  /* 머리말 */
  ctx.textAlign = 'center'
  ctx.fillStyle = withAlpha(tone, 0.9)
  ctx.font = `700 34px ${SANS}`
  ctx.fillText("TODAY'S FORTUNE", center, 560)

  /* 쿠키 */
  const cookie = await loadImage(image)
  if (cookie) {
    const w = 560
    const h = (cookie.height / cookie.width) * w
    ctx.save()
    ctx.shadowColor = 'rgba(90, 78, 60, 0.28)'
    ctx.shadowBlur = 60
    ctx.shadowOffsetY = 26
    ctx.drawImage(cookie, center - w / 2, 660, w, h)
    ctx.restore()
  }

  /* 한 줄 — 화면 한가운데 */
  ctx.font = `700 62px ${SANS}`
  const lines = wrap(ctx, message, W2 - 220)
  let y = 1420
  ctx.fillStyle = '#2b2f36'
  for (const line of lines) {
    ctx.fillText(line, center, y)
    y += 88
  }

  /* 꼬리말 — 날짜는 적지 않는다. 배경화면으로 두면 날짜가 금세 어제가 된다 */
  ctx.fillStyle = 'rgba(120, 126, 136, 0.8)'
  ctx.font = `600 28px ${SANS}`
  ctx.fillText('Daily Hub', center, H2 - 150)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

/** 로또 공 색 — 화면과 같은 구간을 쓴다 */
const lottoTone = (n) => {
  if (n <= 10) return '#f5bf35'
  if (n <= 20) return '#3d8fdd'
  if (n <= 30) return '#e8564c'
  if (n <= 40) return '#4b525c'
  return '#3fa870'
}

/**
 * 뽑은 로또 번호를 카드로 그린다.
 *
 * @param {object} options
 * @param {Array<{letter: string, numbers: number[], bonus: number}>} options.sets
 */
export const drawLottoCard = async ({ sets }) => {
  await document.fonts?.ready

  const rowH = 74
  const H = Math.round(120 + sets.length * rowH + 96)

  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)
  const center = W / 2

  /* 바탕 */
  ctx.fillStyle = '#fbfaf7'
  ctx.fillRect(0, 0, W, H)
  const band = ctx.createLinearGradient(0, 0, 0, H * 0.5)
  band.addColorStop(0, 'rgba(61, 143, 221, 0.16)')
  band.addColorStop(1, 'rgba(61, 143, 221, 0)')
  ctx.fillStyle = band
  ctx.fillRect(0, 0, W, H * 0.5)

  /* 머리말 */
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(61, 110, 160, 0.95)'
  ctx.font = `700 20px ${SANS}`
  ctx.fillText('오늘의 로또 번호', center, 62)

  /* 세트 */
  const R = 23
  const gap = 12
  let y = 118

  for (const set of sets) {
    const balls = [...set.numbers, set.bonus]
    const totalW = balls.length * (R * 2) + (balls.length - 1) * gap + 40
    let x = center - totalW / 2 + 40

    // 세트 이름
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(110, 118, 128, 0.9)'
    ctx.font = `700 16px ${SANS}`
    ctx.fillText(set.letter, center - totalW / 2, y + 6)

    balls.forEach((n, i) => {
      const isBonus = i === balls.length - 1
      if (isBonus) {
        // 보너스 앞에는 + 를 하나 둔다
        ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(150, 156, 166, 0.9)'
        ctx.font = `700 16px ${SANS}`
        ctx.fillText('+', x - gap / 2 - 1, y + 6)
      }

      const r = isBonus ? R - 4 : R
      ctx.beginPath()
      ctx.arc(x + R, y, r, 0, Math.PI * 2)
      ctx.fillStyle = lottoTone(n)
      ctx.fill()

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      ctx.font = `800 ${isBonus ? 15 : 17}px ${SANS}`
      ctx.fillText(String(n), x + R, y + 1)
      ctx.textBaseline = 'alphabetic'

      x += R * 2 + gap
    })

    y += rowH
  }

  /* 꼬리말 */
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(120, 126, 136, 0.9)'
  ctx.font = `600 14px ${SANS}`
  ctx.fillText('Daily Hub', center, H - 52)
  ctx.fillStyle = 'rgba(150, 155, 164, 0.9)'
  ctx.font = `500 13px ${SANS}`
  ctx.fillText(
    new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
    center,
    H - 28,
  )

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

/**
 * 오늘의 운세를 카드로 그린다 — 뽑은 세 장의 그림까지.
 *
 * @param {object} options
 * @param {string} options.type   오늘의 운세 · 솔로연애운 · 커플연애운
 * @param {Array<{label: string, name: string, reversed: boolean, image: string}>} options.picks
 * @param {string[]} options.paragraphs  자리별 해석 (짧게 줄여서 넘긴다)
 * @param {string} options.closing       맺음말
 */
export const drawTarotCard = async ({ type, picks, paragraphs = [], closing = '' }) => {
  await document.fonts?.ready

  const tone = '#6a5c8a'
  const measure = document.createElement('canvas').getContext('2d')

  /* 먼저 글줄을 접어 높이를 잰다 */
  measure.font = `500 17px ${SANS}`
  const blocks = paragraphs.map((text, i) => ({
    title: picks[i]?.label ?? '',
    card: picks[i] ? `${picks[i].name}${picks[i].reversed ? ' (역방향)' : ''}` : '',
    lines: wrap(measure, text, W - PAD * 2),
  }))
  measure.font = `600 16px ${SANS}`
  const closingLines = closing ? wrap(measure, closing, W - PAD * 2 - 30) : []

  const CARD_W = 176
  const CARD_H = Math.round((CARD_W * 1919) / 1144) // 카드 그림 비율
  let H = 92 + 30 + CARD_H + 34
  for (const b of blocks) H += 26 + 24 + b.lines.length * 28
  if (closingLines.length) H += 22 + 26 + closingLines.length * 28
  H += 84

  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)
  const center = W / 2

  /* 바탕 — 밤에 가까운 보랏빛 */
  ctx.fillStyle = '#fbfaf8'
  ctx.fillRect(0, 0, W, H)
  const band = ctx.createLinearGradient(0, 0, W, 320)
  band.addColorStop(0, withAlpha('#7a86ab', 0.2))
  band.addColorStop(1, withAlpha('#c9a68a', 0.16))
  ctx.fillStyle = band
  ctx.fillRect(0, 0, W, 320)

  /* 머리말 */
  ctx.textAlign = 'center'
  ctx.fillStyle = withAlpha(tone, 0.95)
  ctx.font = `700 20px ${SANS}`
  ctx.fillText('DAILY TAROT', center, 52)
  ctx.fillStyle = '#23272e'
  ctx.font = `800 30px ${SANS}`
  ctx.fillText(type, center, 92)

  /* 카드 세 장 */
  const gap = 18
  const totalW = picks.length * CARD_W + (picks.length - 1) * gap
  let x = center - totalW / 2
  const cardY = 122

  for (const pick of picks) {
    const image = await loadImage(pick.image)
    ctx.save()
    ctx.shadowColor = 'rgba(40, 34, 60, 0.28)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetY = 8
    roundRect(ctx, x, cardY, CARD_W, CARD_H, 12)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.restore()

    ctx.save()
    roundRect(ctx, x, cardY, CARD_W, CARD_H, 12)
    ctx.clip()
    if (image) {
      // 역방향은 화면과 똑같이 뒤집어 그린다
      if (pick.reversed) {
        ctx.translate(x + CARD_W / 2, cardY + CARD_H / 2)
        ctx.rotate(Math.PI)
        ctx.drawImage(image, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H)
      } else {
        ctx.drawImage(image, x, cardY, CARD_W, CARD_H)
      }
    } else {
      ctx.fillStyle = withAlpha(tone, 0.2)
      ctx.fillRect(x, cardY, CARD_W, CARD_H)
    }
    ctx.restore()

    x += CARD_W + gap
  }

  /* 자리별 해석 */
  let y = cardY + CARD_H + 34
  ctx.textAlign = 'left'
  for (const block of blocks) {
    ctx.fillStyle = withAlpha(tone, 0.95)
    ctx.font = `700 13px ${SANS}`
    ctx.fillText(block.title, PAD, y)

    ctx.fillStyle = '#23272e'
    ctx.font = `700 17px ${SANS}`
    ctx.fillText(block.card, PAD + measure.measureText(block.title).width + 46, y)

    y += 24
    ctx.fillStyle = 'rgba(74, 80, 90, 0.95)'
    ctx.font = `500 17px ${SANS}`
    for (const line of block.lines) {
      ctx.fillText(line, PAD, y)
      y += 28
    }
    y += 26
  }

  /* 맺음말 */
  if (closingLines.length) {
    const boxH = 26 + closingLines.length * 28
    ctx.fillStyle = withAlpha(tone, 0.12)
    roundRect(ctx, PAD - 14, y - 22, W - (PAD - 14) * 2, boxH, 16)
    ctx.fill()

    ctx.fillStyle = withAlpha(tone, 0.95)
    ctx.font = `600 16px ${SANS}`
    let ty = y
    for (const line of closingLines) {
      ctx.fillText(line, PAD, ty)
      ty += 28
    }
  }

  /* 꼬리말 */
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(150, 155, 164, 0.9)'
  ctx.font = `500 13px ${SANS}`
  ctx.fillText(
    new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) +
      ' · Daily Hub',
    center,
    H - 30,
  )

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

/** 만든 그림을 내려받게 한다 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  // 브라우저가 내려받기를 시작할 틈을 준 뒤에 지운다
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
