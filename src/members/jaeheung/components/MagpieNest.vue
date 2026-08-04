<script setup>
import { computed } from 'vue'

const props = defineProps({
  city: { type: Object, default: null },
  size: { type: String, default: 'normal' },
  floating: { type: Boolean, default: false },
  dustGrade: { type: String, default: null },
})

const weatherState = computed(() => {
  const city = props.city
  if (!city || city.temp === null || city.temp === undefined) return 'empty'

  const status = city.status ?? ''
  if (status.includes('눈')) return 'snow'
  if (status.includes('비') || status.includes('천둥')) return 'rain'
  if (city.temp >= 28) return 'hot'
  if (city.temp < 5) return 'cold'
  if (status.includes('구름')) return 'cloudy'
  return 'sunny'
})

const STATE_INFO = {
  empty: { emoji: '🪹', label: '둥지가 비어있어요' },
  sunny: { emoji: '🌞', label: '맑은 날씨에 신난 까치' },
  cloudy: { emoji: '☁️', label: '구름 아래 꾸벅꾸벅 조는 까치' },
  rain: { emoji: '🌧️', label: '비를 피해 웅크린 까치' },
  snow: { emoji: '❄️', label: '눈송이 맞으며 포근한 까치' },
  hot: { emoji: '🥵', label: '더위에 헥헥거리는 까치' },
  cold: { emoji: '🥶', label: '추위에 잔뜩 웅크린 까치' },
}

const stateInfo = computed(() => STATE_INFO[weatherState.value])

const dustBad = computed(() => props.dustGrade === '나쁨' || props.dustGrade === '매우나쁨')
const dustVeryBad = computed(() => props.dustGrade === '매우나쁨')

const DUST_INFO = {
  좋음: { emoji: '🟢', key: 'good' },
  보통: { emoji: '🟡', key: 'moderate' },
  나쁨: { emoji: '🟠', key: 'bad' },
  매우나쁨: { emoji: '🔴', key: 'very-bad' },
}
const dustInfo = computed(() => (props.dustGrade ? DUST_INFO[props.dustGrade] : null))
</script>

<template>
  <div
    class="magpie-nest"
    :class="[`size-${size}`, { floating, 'dust-bad': dustBad, 'dust-very-bad': dustVeryBad }]"
    :data-state="weatherState"
  >
    <p v-if="size === 'large'" class="nest-title">🪺 까치 둥지</p>

    <svg viewBox="0 0 160 170" class="scene" aria-hidden="true">
      <g v-if="dustBad" class="dust-haze">
        <ellipse cx="80" cy="110" rx="70" ry="60" fill="#b9a06a" opacity="0.16" />
        <circle
          v-for="n in 5"
          :key="n"
          class="dust-mote"
          :style="{ animationDelay: `${n * 0.6}s`, left: `${n * 24}px` }"
          r="2"
          fill="#b9a06a"
        />
      </g>

      <g v-if="weatherState === 'sunny'" class="sun-rays">
        <circle cx="128" cy="30" r="14" class="sun" />
        <g class="rays" stroke="#f4b942" stroke-width="3" stroke-linecap="round">
          <line x1="128" y1="4" x2="128" y2="12" />
          <line x1="128" y1="48" x2="128" y2="56" />
          <line x1="102" y1="30" x2="110" y2="30" />
          <line x1="146" y1="30" x2="154" y2="30" />
          <line x1="110" y1="12" x2="115" y2="17" />
          <line x1="146" y1="12" x2="141" y2="17" />
        </g>
      </g>

      <g v-if="weatherState === 'rain'" class="rain">
        <line
          v-for="n in 6"
          :key="n"
          class="raindrop"
          :style="{ animationDelay: `${n * 0.15}s`, left: `${n * 22}px` }"
          x1="0"
          y1="0"
          x2="-6"
          y2="16"
          stroke="#5aa9e6"
          stroke-width="3"
          stroke-linecap="round"
        />
      </g>

      <g v-if="weatherState === 'snow'" class="snow">
        <circle
          v-for="n in 7"
          :key="n"
          class="snowflake"
          :style="{ animationDelay: `${n * 0.35}s`, left: `${n * 20}px` }"
          r="2.5"
          fill="#fafafa"
        />
      </g>

      <g class="nest">
        <ellipse cx="80" cy="148" rx="54" ry="16" fill="#8b5e3c" />
        <path
          d="M28 146 Q42 130 58 142 M52 150 Q66 132 84 144 M78 150 Q94 130 110 144 M104 148 Q118 132 132 146"
          stroke="#6b4423"
          stroke-width="4"
          fill="none"
          stroke-linecap="round"
        />
        <ellipse cx="80" cy="142" rx="46" ry="10" fill="#a9724a" />
      </g>

      <g class="magpie-body-group">
        <g class="cough-wrap">
          <path
            class="tail"
            d="M100 96 L134 118 L120 122 L128 136 L112 128 L104 112 Z"
            fill="url(#magpieTailGrad)"
          />
          <ellipse cx="80" cy="112" rx="32" ry="26" fill="var(--magpie-black)" />
          <ellipse cx="72" cy="120" rx="16" ry="13" fill="var(--magpie-white)" />
          <circle cx="54" cy="90" r="19" fill="var(--magpie-black)" />
          <polygon class="beak" points="38,90 28,88 38,96" fill="#f4b942" />
          <circle cx="52" cy="86" r="3" fill="var(--magpie-white)" />
          <g class="wing">
            <path d="M84 100 Q100 106 92 124 Q80 118 76 106 Z" fill="var(--magpie-black)" />
          </g>
          <g class="sweat" v-if="weatherState === 'hot'">
            <path d="M100 78 q4 6 0 10 a5 5 0 1 1 0 -10 Z" fill="#5aa9e6" />
          </g>
          <g v-if="dustBad" class="mask">
            <path
              d="M25 81 Q47 74 51 90 Q47 106 25 99 Q18 90 25 81 Z"
              fill="#eef3f6"
              stroke="#aebac2"
              stroke-width="1.5"
            />
            <path
              d="M27 85 Q38 83 47 87 M27 94 Q38 97 47 93"
              stroke="#aebac2"
              stroke-width="1"
              fill="none"
            />
            <line x1="47" y1="83" x2="60" y2="78" stroke="#c7d0d6" stroke-width="1.5" />
            <line x1="47" y1="97" x2="60" y2="102" stroke="#c7d0d6" stroke-width="1.5" />
          </g>
        </g>
      </g>

      <g v-if="weatherState === 'cloudy'" class="zzz">
        <text x="96" y="70" class="z z1">Z</text>
        <text x="106" y="58" class="z z2">Z</text>
        <text x="116" y="46" class="z z3">Z</text>
      </g>

      <defs>
        <linearGradient id="magpieTailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="var(--magpie-teal)" />
          <stop offset="55%" stop-color="var(--magpie-blue)" />
          <stop offset="100%" stop-color="var(--magpie-violet)" />
        </linearGradient>
      </defs>
    </svg>

    <p class="nest-label">{{ stateInfo.emoji }} {{ stateInfo.label }}</p>
    <p v-if="dustInfo" class="dust-label" :class="`dust-${dustInfo.key}`">
      {{ dustInfo.emoji }} 미세먼지 {{ dustGrade }}
    </p>
    <p v-if="city" class="nest-city">{{ city.name }} 날씨 기준</p>
  </div>
</template>

<style scoped>
.magpie-nest {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 8px 4px 0;
  box-sizing: border-box;
}
.scene {
  width: 100%;
  max-width: 150px;
  height: auto;
  overflow: visible;
}
.nest-label {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-heading);
  text-align: center;
  line-height: 1.4;
}
.dust-label {
  margin: 4px 0 0;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}
.dust-label.dust-good {
  color: #2f8f52;
}
.dust-label.dust-moderate {
  color: #b8860b;
}
.dust-label.dust-bad {
  color: #d2691e;
}
.dust-label.dust-very-bad {
  color: #c0392b;
}
.nest-city {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--color-text);
  opacity: 0.65;
  text-align: center;
}

.magpie-nest.size-large {
  position: relative;
  overflow: hidden;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 22px 16px 26px;
}
.magpie-nest.size-large::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--magpie-gradient);
}
.nest-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-heading);
}
.magpie-nest.size-large .scene {
  max-width: 240px;
}
.magpie-nest.size-large .nest-label {
  margin-top: 12px;
  font-size: 15px;
}
.magpie-nest.size-large .dust-label {
  font-size: 13px;
}
.magpie-nest.size-large .nest-city {
  font-size: 13px;
  margin-top: 4px;
}

.magpie-nest.floating {
  position: fixed;
  top: 210px;
  right: 32px;
  width: 260px;
  z-index: 20;
}
@media (max-width: 1000px) {
  .magpie-nest.floating {
    position: static;
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
  }
}

.magpie-body-group {
  transform-origin: 80px 130px;
  animation: breathe 2.6s ease-in-out infinite;
}
@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.015);
  }
}

[data-state='sunny'] .magpie-body-group {
  animation: bounce 1.1s ease-in-out infinite;
}
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
.sun {
  fill: #f4b942;
  animation: sun-glow 1.8s ease-in-out infinite;
}
@keyframes sun-glow {
  0%,
  100% {
    opacity: 0.85;
  }
  50% {
    opacity: 1;
  }
}

[data-state='cloudy'] .magpie-body-group {
  animation: sway 3.2s ease-in-out infinite;
}
@keyframes sway {
  0%,
  100% {
    transform: rotate(-2deg);
  }
  50% {
    transform: rotate(2deg);
  }
}
.z {
  font-size: 12px;
  font-weight: 700;
  fill: var(--color-text);
  opacity: 0;
}
.z1 {
  animation: float-z 2.4s ease-in infinite;
}
.z2 {
  animation: float-z 2.4s ease-in infinite 0.5s;
}
.z3 {
  animation: float-z 2.4s ease-in infinite 1s;
}
@keyframes float-z {
  0% {
    opacity: 0;
    transform: translateY(0);
  }
  20% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translateY(-14px);
  }
}

[data-state='hot'] .wing {
  transform-origin: 84px 106px;
  animation: flap 0.35s ease-in-out infinite alternate;
}
@keyframes flap {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(-18deg);
  }
}
.sweat {
  animation: drip 1s ease-in infinite;
}
@keyframes drip {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  90% {
    opacity: 0.2;
    transform: translateY(10px);
  }
  100% {
    opacity: 0;
    transform: translateY(12px);
  }
}

[data-state='cold'] .magpie-body-group {
  animation: shiver 0.22s ease-in-out infinite;
}
@keyframes shiver {
  0%,
  100% {
    transform: translateX(0) rotate(0deg);
  }
  25% {
    transform: translateX(-1.5px) rotate(-1.5deg);
  }
  75% {
    transform: translateX(1.5px) rotate(1.5deg);
  }
}

[data-state='rain'] .magpie-body-group {
  animation: none;
  transform: rotate(4deg);
}
.raindrop {
  position: relative;
  animation: fall 0.9s linear infinite;
}
@keyframes fall {
  0% {
    transform: translateY(-10px);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translateY(30px);
    opacity: 0;
  }
}

[data-state='snow'] .magpie-body-group {
  animation: sway 4s ease-in-out infinite;
}
.snowflake {
  animation: snowfall 3s linear infinite;
}
@keyframes snowfall {
  0% {
    transform: translate(0, -10px);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  100% {
    transform: translate(6px, 60px);
    opacity: 0;
  }
}

[data-state='empty'] .magpie-body-group,
[data-state='empty'] .nest {
  opacity: 0.4;
  animation: none;
}

.dust-mote {
  animation: dust-drift 4s ease-in-out infinite;
}
@keyframes dust-drift {
  0% {
    transform: translate(0, 0);
    opacity: 0;
  }
  20% {
    opacity: 0.7;
  }
  50% {
    transform: translate(-10px, -14px);
  }
  100% {
    transform: translate(6px, -30px);
    opacity: 0;
  }
}
.dust-haze ellipse {
  animation: haze-pulse 3.5s ease-in-out infinite;
}
@keyframes haze-pulse {
  0%,
  100% {
    opacity: 0.12;
  }
  50% {
    opacity: 0.22;
  }
}

.dust-very-bad .cough-wrap {
  animation: cough 2.2s ease-in-out infinite;
}
@keyframes cough {
  0%,
  80%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  85% {
    transform: translateY(3px) rotate(3deg);
  }
  90% {
    transform: translateY(0) rotate(-2deg);
  }
  95% {
    transform: translateY(2px) rotate(2deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .magpie-nest .magpie-body-group,
  .magpie-nest .wing,
  .magpie-nest .sweat,
  .magpie-nest .raindrop,
  .magpie-nest .snowflake,
  .magpie-nest .z,
  .magpie-nest .sun,
  .magpie-nest .dust-mote,
  .magpie-nest .dust-haze ellipse,
  .magpie-nest .cough-wrap {
    animation: none !important;
  }
}
</style>
