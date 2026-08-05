<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  status: { type: String, default: '' },
  temp: { type: Number, default: 20 },
})

const mascotList = [
  { emoji: '🐸', message: '비 오는 날엔 저처럼 신나게!', type: 'rain' },
  { emoji: '☔', message: '우산 챙기는 거 잊지 마세요!', type: 'rain' },
  { emoji: '⛄', message: '눈사람이 되고 싶어요!', type: 'snow' },
  { emoji: '🐧', message: '펭귄은 눈 오는 날이 제일 좋아요', type: 'snow' },
  { emoji: '🐑', message: '구름처럼 몽실몽실~', type: 'cloud' },
  { emoji: '☁️', message: '흐린 날도 나름 매력있어요', type: 'cloud' },
  { emoji: '🦥', message: '더워서 늘어져요...', type: 'hot' },
  { emoji: '🍉', message: '더운 날엔 수박이 최고!', type: 'hot' },
  { emoji: '🐧', message: '펭귄은 이 정도는 거뜬해요', type: 'cold' },
  { emoji: '🧤', message: '따뜻하게 챙겨입어요!', type: 'cold' },
  { emoji: '🐥', message: '오늘도 좋은 하루 보내세요!', type: 'default' },
  { emoji: '🐰', message: '상쾌한 하루예요!', type: 'default' },
  { emoji: '🐶', message: '산책하기 좋은 날씨네요!', type: 'default' },
  { emoji: '🐱', message: '나른한 하루, 잘 보내요~', type: 'default' },
]

const weatherType = computed(() => {
  if (props.status.includes('비')) return 'rain'
  if (props.status.includes('눈')) return 'snow'
  if (props.status.includes('구름') || props.status.includes('흐림')) return 'cloud'
  if (props.temp >= 28) return 'hot'
  if (props.temp <= 5) return 'cold'
  return 'default'
})

const getDefaultIndex = () => mascotList.findIndex((m) => m.type === weatherType.value)

const currentIndex = ref(getDefaultIndex())
const isToggled = ref(false) // 버튼을 눌러서 랜덤 상태로 전환됐는지 여부

watch(weatherType, () => {
  currentIndex.value = getDefaultIndex()
  isToggled.value = false
})

const current = computed(() => mascotList[currentIndex.value] || mascotList[mascotList.length - 1])

const nextMascot = () => {
  currentIndex.value = (currentIndex.value + 1) % mascotList.length
  isToggled.value = true
}
</script>

<template>
  <div class="mascot-box">
    <button class="toggle-btn" @click="nextMascot">🔄</button>
    <div class="mascot-emoji">{{ current.emoji }}</div>
    <p class="mascot-message">{{ current.message }}</p>
    <p class="mascot-guide">
      <span v-if="!isToggled">✨ 날씨와 어울리는 오늘의 카드!</span>
      <span v-else>🎲 날씨와 관련없는 랜덤 카드가 선택됩니다</span>
    </p>
  </div>
</template>

<style scoped>
.mascot-box {
  position: relative;
  background: white;
  border-radius: 24px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 14px rgba(108, 74, 182, 0.08);
}
.toggle-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: #ede4fb;
  cursor: pointer;
  font-size: 13px;
}
.toggle-btn:hover {
  background: #ddc9f7;
}
.mascot-emoji {
  font-size: 64px;
  animation: bounce 2s ease-in-out infinite;
}
.mascot-message {
  margin-top: 8px;
  color: #6c4ab6;
  font-weight: 600;
  font-size: 14px;
}
.mascot-guide {
  margin-top: 6px;
  font-size: 11px;
  color: #b7a4e0;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>