<script setup>
import { computed } from 'vue'

/**
 * 날씨 상태 문자열을 아이콘 하나로 바꿔 주는 작은 컴포넌트.
 * 데이터도 이벤트도 없고, 받은 status를 그리기만 한다.
 *
 * 아이콘은 src/assets/weather-icons/ 의 PNG를 쓴다.
 * import.meta.glob으로 폴더를 통째로 읽으므로,
 * 파일을 추가하면 아래 MATCH에 한 줄만 더하면 된다.
 */
const props = defineProps({
  status: { type: String, required: true },
  size: { type: Number, default: 26 },
})

/** { sunny: '/assets/sunny-a1b2.png', ... } — 빌드 후 경로로 바뀐다 */
const icons = import.meta.glob('../../../assets/weather-icons/*.png', {
  eager: true,
  import: 'default',
})

const iconUrl = Object.fromEntries(
  Object.entries(icons).map(([path, url]) => [path.split('/').pop().replace('.png', ''), url]),
)

/**
 * 상태 글자에 이 단어가 들어 있으면 이 아이콘.
 * 위에 있는 것부터 검사하므로 '소나기'가 '비'보다 먼저 와야 한다.
 */
const MATCH = [
  ['대체로 맑', 'mostly-sunny'],
  ['소나기', 'sun-shower'],
  ['뇌우', 'thunderstorm'],
  ['천둥', 'thunderstorm'],
  ['번개', 'lightning'],
  ['폭설', 'snowman'],
  ['한파', 'snowflake'],
  ['눈보라', 'snow'],
  ['싸락눈', 'snow'],
  ['눈', 'snow'],
  ['호우', 'heavy-rain'],
  ['장마', 'heavy-rain'],
  ['이슬비', 'rain'],
  ['어는 비', 'rain'],
  ['비', 'rain'],
  ['안개', 'fog'],
  ['미세먼지', 'fog'],
  ['태풍', 'cyclone'],
  ['돌풍', 'tornado'],
  ['구름조금', 'partly-cloudy'],
  ['구름 조금', 'partly-cloudy'],
  ['구름많', 'mostly-cloudy'],
  ['흐림', 'cloudy'],
  ['구름', 'cloudy'],
  ['맑음', 'sunny'],
  ['맑', 'sunny'],
]

const name = computed(() => {
  const found = MATCH.find(([word]) => props.status.includes(word))
  // 못 찾으면 기온 아이콘으로 대신한다 (빈칸보다는 낫다)
  return found ? found[1] : 'thermometer'
})

const src = computed(() => iconUrl[name.value] ?? iconUrl.thermometer)
</script>

<template>
  <img
    class="weather-icon"
    :class="name"
    :src="src"
    :width="size"
    :height="size"
    :alt="status"
    :title="status"
    decoding="async"
  />
</template>

<style scoped>
.weather-icon {
  flex: none;
  object-fit: contain;
  vertical-align: -4px;
}

/* 안개(🌫️)는 이모지 자체가 사각형 덩어리라 다른 아이콘보다 커 보인다.
   같은 크기로 두면 혼자 무거워 보여서 살짝 줄인다. */
.weather-icon.fog {
  transform: scale(0.84);
}
</style>
