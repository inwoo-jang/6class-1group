<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: null,
  },
})

const EFFECT_MAP = {
  맑음: 'sunny',
  구름조금: 'partly-cloudy',
  흐림: 'cloudy',
  안개: 'foggy',
  이슬비: 'rain',
  비: 'rain',
  '강한 비': 'rain',
  소나기: 'rain',
  '강한 소나기': 'rain',
  눈: 'snow',
  '강한 눈': 'snow',
  뇌우: 'storm',
}

const effectType = computed(() => EFFECT_MAP[props.status] ?? null)

function randomParticles(count, factory) {
  return Array.from({ length: count }, factory)
}

const raindrops = randomParticles(40, () => ({
  left: Math.random() * 100,
  duration: 0.6 + Math.random() * 0.6,
  delay: Math.random() * 2,
}))

const snowflakes = randomParticles(28, () => ({
  left: Math.random() * 100,
  size: 3 + Math.random() * 4,
  duration: 7 + Math.random() * 6,
  delay: Math.random() * 6,
}))

const clouds = randomParticles(6, () => ({
  top: 5 + Math.random() * 55,
  size: 160 + Math.random() * 140,
  duration: 40 + Math.random() * 30,
  delay: Math.random() * -30,
}))
</script>

<template>
  <div class="weather-effect" :class="effectType">
    <div v-if="effectType" class="sky-wash"></div>

    <div v-if="effectType === 'sunny' || effectType === 'partly-cloudy'" class="sun-glow"></div>

    <template v-if="effectType === 'partly-cloudy' || effectType === 'cloudy'">
      <span
        v-for="(cloud, i) in clouds"
        :key="'cloud-' + i"
        class="cloud-blob"
        :style="{
          top: cloud.top + '%',
          width: cloud.size + 'px',
          height: cloud.size * 0.6 + 'px',
          animationDuration: cloud.duration + 's',
          animationDelay: cloud.delay + 's',
        }"
      ></span>
    </template>

    <div v-if="effectType === 'foggy'" class="fog-layer"></div>

    <template v-if="effectType === 'rain' || effectType === 'storm'">
      <span
        v-for="(drop, i) in raindrops"
        :key="'rain-' + i"
        class="raindrop"
        :style="{
          left: drop.left + '%',
          animationDuration: drop.duration + 's',
          animationDelay: drop.delay + 's',
        }"
      ></span>
    </template>

    <template v-if="effectType === 'snow'">
      <span
        v-for="(flake, i) in snowflakes"
        :key="'snow-' + i"
        class="snowflake"
        :style="{
          left: flake.left + '%',
          width: flake.size + 'px',
          height: flake.size + 'px',
          animationDuration: flake.duration + 's',
          animationDelay: flake.delay + 's',
        }"
      ></span>
    </template>

    <div v-if="effectType === 'storm'" class="lightning-flash"></div>
  </div>
</template>

<style scoped>
.weather-effect {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.sky-wash {
  position: absolute;
  inset: 0;
  opacity: 0;
  animation: wash-in 1s ease forwards;
}

.weather-effect.sunny .sky-wash,
.weather-effect.partly-cloudy .sky-wash {
  background: linear-gradient(
    180deg,
    rgba(251, 191, 36, 0.5) 0%,
    rgba(251, 191, 36, 0.12) 55%,
    transparent 85%
  );
}

.weather-effect.cloudy .sky-wash {
  background: linear-gradient(
    180deg,
    rgba(71, 85, 105, 0.5) 0%,
    rgba(71, 85, 105, 0.14) 55%,
    transparent 85%
  );
}

.weather-effect.foggy .sky-wash {
  background: linear-gradient(
    180deg,
    rgba(203, 213, 225, 0.6) 0%,
    rgba(203, 213, 225, 0.18) 55%,
    transparent 85%
  );
}

.weather-effect.storm .sky-wash {
  background: linear-gradient(
    180deg,
    rgba(30, 41, 59, 0.6) 0%,
    rgba(30, 41, 59, 0.2) 55%,
    transparent 85%
  );
}

.weather-effect.rain .sky-wash,
.weather-effect.snow .sky-wash {
  background: linear-gradient(180deg, rgba(96, 165, 250, 0.18) 0%, transparent 70%);
}

@keyframes wash-in {
  to {
    opacity: 1;
  }
}

.sun-glow {
  position: absolute;
  top: -15%;
  right: -10%;
  width: 60vmax;
  height: 60vmax;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 196, 84, 0.5), transparent 70%);
  animation: sun-pulse 6s ease-in-out infinite;
}

@keyframes sun-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}

.cloud-blob {
  position: absolute;
  left: -25%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(148, 163, 184, 0.45), transparent 70%);
  filter: blur(6px);
  animation-name: drift;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.weather-effect.cloudy .cloud-blob {
  background: radial-gradient(circle, rgba(71, 85, 105, 0.65), transparent 70%);
}

@keyframes drift {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(140vw);
  }
}

.fog-layer {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent, rgba(203, 213, 225, 0.6), transparent);
  background-size: 200% 100%;
  animation: fog-drift 12s ease-in-out infinite;
}

@keyframes fog-drift {
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 0%;
  }
  100% {
    background-position: 0% 0%;
  }
}

.raindrop {
  position: absolute;
  top: -5%;
  width: 2px;
  height: 60px;
  background: linear-gradient(to bottom, transparent, rgba(96, 165, 250, 0.55));
  animation-name: fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes fall {
  from {
    transform: translateY(-10vh);
  }
  to {
    transform: translateY(110vh);
  }
}

.snowflake {
  position: absolute;
  top: -5%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  animation-name: snow-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes snow-fall {
  0% {
    transform: translate(0, -10vh);
  }
  50% {
    transform: translate(20px, 50vh);
  }
  100% {
    transform: translate(-10px, 110vh);
  }
}

.lightning-flash {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  opacity: 0;
  animation: flash 7s steps(1) infinite;
}

@keyframes flash {
  0%,
  96%,
  100% {
    opacity: 0;
  }
  97% {
    opacity: 0.85;
  }
  98% {
    opacity: 0;
  }
  99% {
    opacity: 0.45;
  }
}
</style>
