<script setup>
/**
 * 게임 미리보기 그림
 *
 * 목록에 이모지를 놓으면 어느 게임이든 비슷해 보인다.
 * 그래서 게임 안에서 실제로 보게 될 물건(룰렛판 · 추첨기)을 작게 그려 둔다.
 * 그림 파일을 쓰지 않고 CSS 로만 그린다 — 어느 크기에서도 안 뭉개진다.
 */
defineProps({
  /** 'roulette' | 'lotto' */
  kind: { type: String, required: true },
})

/** 룰렛판 색 — 실제 원판과 같은 색을 쓴다 */
const wheelTones = ['#ff8f5e', '#ffc247', '#4fc2a3', '#4fa8e8', '#9b7ff0', '#ff7fa8']
const slice = 360 / wheelTones.length
const wheel = `conic-gradient(from 0deg, ${wheelTones
  .map((tone, i) => `${tone} ${i * slice}deg ${(i + 1) * slice}deg`)
  .join(', ')})`

/** 추첨기 안 공 — 각도와 거리를 손으로 잡아 둔다 */
const drumBalls = [
  { tone: '#f5bf35', x: 30, y: 34 },
  { tone: '#3d8fdd', x: 62, y: 30 },
  { tone: '#e8564c', x: 44, y: 55 },
  { tone: '#4b525c', x: 70, y: 60 },
  { tone: '#3fa870', x: 24, y: 62 },
]
</script>

<template>
  <span class="preview" aria-hidden="true">
    <!-- 룰렛 -->
    <template v-if="kind === 'roulette'">
      <span class="rim">
        <span class="wheel" :style="{ background: wheel, '--slice': `${slice}deg` }">
          <span class="spokes" />
          <span class="gloss" />
          <span class="hub" />
        </span>
      </span>
      <span class="pin" />
    </template>

    <!-- 로또 추첨기 -->
    <template v-else>
      <span class="rim drum-rim">
        <span class="drum">
          <span
            v-for="(ball, i) in drumBalls"
            :key="i"
            class="ball"
            :style="{ background: ball.tone, left: `${ball.x}%`, top: `${ball.y}%` }"
          />
          <span class="gloss" />
        </span>
      </span>
      <span class="chute" />
      <span class="base" />
    </template>
  </span>
</template>

<style scoped>
.preview {
  position: relative;
  display: block;
  flex: none;
  width: 64px;
  height: 64px;
}

/*
 * 테두리는 검정 한 겹이 아니라 '금속 테' 로 만든다.
 * 바깥 테를 감싸는 상자에 밝은→어두운 그라데이션을 깔고, 그 안에 알맹이를
 * 넣으면 빛을 받은 쇠테처럼 보인다. 납작한 검정 테와 여기서 차이가 난다.
 */
.rim {
  position: absolute;
  inset: 4px 1px 1px;
  display: block;
  padding: 3px;
  border-radius: 50%;
  background: linear-gradient(150deg, #ffffff, #c9d2dc 45%, #8e99a6);
  box-shadow:
    0 1px 1px rgb(255 255 255 / 0.9),
    0 5px 12px rgb(40 46 56 / 0.22),
    0 1px 2px rgb(40 46 56 / 0.18);
}

/* ── 룰렛 ── */
.wheel {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.55);
}

.spokes {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    rgb(255 255 255 / 0.92) 0deg 1.1deg,
    transparent 1.1deg var(--slice)
  );
}

/* 위에서 들어온 빛 — 이거 한 겹으로 평면이 입체가 된다 */
.gloss {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(70% 45% at 32% 14%, rgb(255 255 255 / 0.55), transparent 68%),
    radial-gradient(80% 55% at 70% 96%, rgb(20 26 34 / 0.16), transparent 62%);
}

.hub {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: linear-gradient(150deg, #4a525d, #23282f);
  transform: translate(-50%, -50%);
  box-shadow:
    0 0 0 2.5px #fff,
    0 1px 3px rgb(0 0 0 / 0.35);
}

.pin {
  position: absolute;
  top: 0;
  left: 50%;
  width: 0;
  height: 0;
  border-top: 10px solid #2b3038;
  border-right: 5.5px solid transparent;
  border-left: 5.5px solid transparent;
  transform: translateX(-50%);
  filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.3));
}

/* ── 추첨기 ── */
/* 통은 동그래야 한다 — 위아래만 줄이면 달걀처럼 보인다. 사방을 같은 값으로 */
.drum-rim {
  inset: 0 7px 14px;
}

.drum {
  position: relative;
  display: block;
  overflow: hidden;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 26%, #ffffff, #e6ecf2 58%, #c2cdd8);
  box-shadow:
    inset 0 -6px 10px rgb(84 104 126 / 0.32),
    inset 0 3px 6px rgb(255 255 255 / 0.9);
}

.ball {
  position: absolute;
  width: 13px;
  height: 13px;
  margin: -6.5px 0 0 -6.5px;
  border-radius: 50%;
  box-shadow:
    inset 0 -2px 3px rgb(0 0 0 / 0.28),
    inset 0 2px 3px rgb(255 255 255 / 0.45),
    0 1px 2px rgb(40 46 56 / 0.25);
}

/* 관과 받침 — 통만 있으면 공중에 뜬 것처럼 보인다 */
.chute {
  position: absolute;
  bottom: 6px;
  left: 50%;
  width: 16px;
  height: 10px;
  border-radius: 0 0 5px 5px;
  background: linear-gradient(#39414c, #232830);
  transform: translateX(-50%);
}

.base {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 34px;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(#4a535f, #2b3038);
  transform: translateX(-50%);
  box-shadow: 0 2px 5px rgb(40 46 56 / 0.28);
}
</style>
