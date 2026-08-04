<script setup>
/**
 * 카드 포스터 — 그 사람의 사이트를 그대로 축소해 띄운다.
 * ------------------------------------------------------------------
 * 캡처 이미지를 붙이지 않는다. 결과물을 고치면 표지도 같이 바뀌어야 하는데,
 * 이미지로 두면 반드시 어긋난다. 그래서 진짜 화면을 넣는다.
 *
 * 넓은 화면(1280×960)으로 한 번 그린 뒤 카드 크기에 맞춰 통째로 줄인다.
 * 카드 폭에 맞춰 그리면 좁은 화면용 배치가 나와서 "작아진 사이트"가 아니라
 * "모바일 화면"이 되어 버린다.
 *
 * 비용을 아끼려고 두 가지를 지킨다.
 *   ① 화면에 들어왔을 때 비로소 불러온다 (IntersectionObserver)
 *   ② 결과물이 없는 사람은 아예 만들지 않는다 — 색판으로 대신한다
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  slug: { type: String, required: true },
  name: { type: String, required: true },
  accent: { type: String, default: '#888888' },
  /** 결과물이 들어와 있는지 */
  ready: { type: Boolean, default: false },
  /** 크기를 부모가 정하는 경우 — 스스로 비율을 고집하지 않는다 */
  free: { type: Boolean, default: false },
})

/**
 * 미리보기를 그릴 가상 화면 크기.
 * 다들 데스크톱 화면을 만들 테니 노트북 비율(16:10)로 그린다.
 * 여기가 세로로 길면 결과물이 좁은 화면용 배치로 바뀌어 버린다.
 */
const FRAME = { w: 1440, h: 900 }

const box = ref(null)
const width = ref(0)
const height = ref(0)
const seen = ref(false)

/** 갤러리 껍데기(머리띠·바닥글) 없이 결과물만 나오게 하는 표시 */
const src = computed(() => `${import.meta.env.BASE_URL}m/${props.slug}?preview=1`)

/**
 * 가로·세로 중 더 많이 필요한 쪽에 맞춘다 (object-fit: cover 와 같은 계산).
 * 폭에만 맞추면 칸이 세로로 길 때 아래가 비어 다른 색 띠가 생긴다.
 */
const scale = computed(() =>
  width.value && height.value ? Math.max(width.value / FRAME.w, height.value / FRAME.h) : 0,
)

/**
 * 줄이는 비율은 CSS 변수로 넘긴다.
 * transform 을 인라인으로 박아 두면 바깥에서 hover 로 조금 더 당겨 볼 수 없다.
 */
const frameStyle = computed(() => ({
  width: `${FRAME.w}px`,
  height: `${FRAME.h}px`,
  '--s': scale.value,
}))

let io = null
let ro = null

onMounted(() => {
  if (!props.ready || !box.value) return

  // 화면에 들어오기 조금 전부터 미리 받아 둔다
  io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      seen.value = true
      io.disconnect()
    },
    { rootMargin: '200px' },
  )
  io.observe(box.value)

  ro = new ResizeObserver(([entry]) => {
    width.value = entry.contentRect.width
    height.value = entry.contentRect.height
  })
  ro.observe(box.value)
})

onBeforeUnmount(() => {
  io?.disconnect()
  ro?.disconnect()
})
</script>

<template>
  <div ref="box" class="poster" :class="{ live: ready }" :style="{ '--accent': accent }">
    <!-- 진짜 화면 -->
    <iframe
      v-if="ready && seen && scale"
      class="frame"
      :src="src"
      :style="frameStyle"
      :title="`${name}의 결과물 미리보기`"
      tabindex="-1"
      aria-hidden="true"
      scrolling="no"
      loading="lazy"
    />

    <!--
      아직 안 낸 사람의 칸은 비워 둔다.
      큰 이름을 박아 넣으면 그것도 하나의 그림이 되어, 낸 사람 것과 같은 무게로 읽힌다.
      빈 칸은 비어 있어야 옆의 진짜 화면이 산다.
    -->
    <span v-if="ready && !seen" class="loading" aria-hidden="true" />
  </div>
</template>

<style scoped>
.poster {
  position: relative;
  display: grid;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: color-mix(in srgb, var(--fg) 5%, var(--card));
  place-items: center;
}

/* 결과물이 있는 자리에만 색을 쓴다 — 불러오는 동안의 바탕 */
.poster.live {
  background:
    radial-gradient(
      120% 100% at 18% 8%,
      color-mix(in srgb, var(--accent) 55%, transparent),
      transparent 68%
    ),
    color-mix(in srgb, var(--accent) 8%, var(--card));
}

/*
 * 왼쪽 위를 기준으로 줄여야 남는 여백 없이 꼭 맞는다.
 * 클릭은 카드 전체가 받아야 하므로 프레임은 이벤트를 먹지 않는다.
 */
/*
 * 칸 한가운데를 기준으로 줄인다.
 * 왼쪽 위를 기준으로 잡으면 칸보다 넓은 쪽이 오른쪽으로만 밀려 나가
 * 화면의 왼쪽 반만 보인다. 가운데를 맞춰야 양쪽이 고르게 잘린다.
 */
.frame {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 0;
  pointer-events: none;
  /* 줄인 뒤에도 포스터를 빈틈없이 덮도록 제 배경을 갖는다 */
  background: var(--page);
  /* --zoom 은 바깥(카드)에서 hover 때만 건드린다 */
  transform: translate(-50%, -50%) scale(calc(var(--s) * var(--zoom, 1)));
  transition: transform 0.7s var(--ease);
  /* 화면이 들어오는 순간 툭 튀지 않게 */
  animation: settle 0.6s var(--ease) both;
}

@keyframes settle {
  from {
    opacity: 0;
  }
}

/* 불러오는 동안 — 빛이 한 번 훑고 지나간다 */
.loading {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 30%,
    color-mix(in srgb, var(--page) 40%, transparent) 50%,
    transparent 70%
  );
  background-size: 300% 100%;
  animation: sweep 1.6s ease-in-out infinite;
}

@keyframes sweep {
  from {
    background-position: 120% 0;
  }

  to {
    background-position: -60% 0;
  }
}
</style>
