<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { MEMBERS } from '../data/members'
import { hasWork } from '../members'

/**
 * 표지 — 팀원 목록.
 *
 * 카드를 격자로 늘어놓는 대신 이름만 줄로 세우고,
 * 줄에 마우스를 올리면 미리보기가 커서를 따라오게 했다.
 * 화면이 비어 보일수록 이름이 커 보인다.
 */
const hovered = ref(null)
const pointer = ref({ x: 0, y: 0 })
const isCoarse = ref(false) // 터치 기기에서는 따라다니는 미리보기를 끈다

const onMove = (event) => {
  pointer.value = { x: event.clientX, y: event.clientY }
}

onMounted(() => {
  isCoarse.value = window.matchMedia('(hover: none)').matches
  if (!isCoarse.value) window.addEventListener('pointermove', onMove)
})

onBeforeUnmount(() => window.removeEventListener('pointermove', onMove))

const members = computed(() =>
  MEMBERS.map((m, i) => ({ ...m, index: String(i + 1).padStart(2, '0'), live: m.live })),
)

const preview = computed(() => members.value.find((m) => m.slug === hovered.value) ?? null)

const doneCount = computed(() => MEMBERS.filter((m) => hasWork(m.slug)).length)
</script>

<template>
  <div class="index">
    <!-- 표지 -->
    <header class="hero page">
      <p class="eyebrow">SKALA · Full-stack Engineering</p>
      <h1>
        여섯 사람이<br />
        각자 만든 것을<br />
        <em>한자리에</em>
      </h1>
      <p class="lede">
        Vue.js 수업에서 각자 완성한 화면을 모았습니다. 이름을 누르면 그 사람의 결과물이 그대로
        열립니다.
      </p>
      <p class="count">
        <span>{{ doneCount }}</span> / {{ MEMBERS.length }} 명 제출
      </p>
    </header>

    <!-- 명단 -->
    <section class="roster page" aria-label="팀원 목록">
      <RouterLink
        v-for="member in members"
        :key="member.slug"
        class="row"
        :class="{ dim: hovered && hovered !== member.slug, empty: !hasWork(member.slug) }"
        :to="{ name: 'member', params: { slug: member.slug } }"
        @pointerenter="hovered = member.slug"
        @pointerleave="hovered = null"
        @focus="hovered = member.slug"
        @blur="hovered = null"
      >
        <span class="no">{{ member.index }}</span>
        <span class="name">{{ member.name }}</span>
        <span class="role">{{ member.role }}</span>
        <span class="stack">
          <i v-for="tech in member.stack" :key="tech">{{ tech }}</i>
        </span>
        <span class="state">{{ hasWork(member.slug) ? '보기' : '준비 중' }}</span>
      </RouterLink>
    </section>

    <footer class="foot page">
      <p>SKALA Vue.js · 2026</p>
      <p class="how">
        결과물을 넣으려면 <code>src/members/&lt;이름&gt;/index.vue</code> 를 두면 됩니다.
      </p>
    </footer>

    <!-- 커서를 따라오는 미리보기 -->
    <Transition name="peek">
      <div
        v-if="preview && !isCoarse"
        class="peek"
        :style="{
          transform: `translate3d(${pointer.x}px, ${pointer.y}px, 0)`,
          '--accent': preview.accent,
        }"
        aria-hidden="true"
      >
        <div class="peek-art">
          <span class="peek-initial">{{ preview.name.slice(-2) }}</span>
        </div>
        <p class="peek-name">{{ preview.name }}</p>
        <p class="peek-role">{{ preview.role }}</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.index {
  padding-bottom: 120px;
}

/* ── 표지 ── */
.hero {
  padding: clamp(80px, 16vh, 180px) 0 clamp(60px, 10vh, 120px);
}

h1 {
  margin: 22px 0 0;
  font-size: clamp(40px, 8.4vw, 104px);
  font-weight: 500;
  letter-spacing: -0.045em;
  line-height: 1.02;
}

h1 em {
  font-style: normal;
  /* 한 단어만 얇게 — 색 대신 무게로 강조한다 */
  font-weight: 200;
  opacity: 0.55;
}

.lede {
  max-width: 44ch;
  margin: 34px 0 0;
  color: var(--muted);
  font-size: clamp(14px, 1.3vw, 16px);
  line-height: 1.8;
}

.count {
  margin: 46px 0 0;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
}

.count span {
  color: var(--ink);
}

/* ── 명단 ── */
.roster {
  border-top: 1px solid var(--line);
}

.row {
  display: grid;
  grid-template-columns: 54px minmax(0, 210px) minmax(0, 1fr) auto 76px;
  gap: 24px;
  align-items: baseline;
  padding: clamp(22px, 3.4vw, 38px) 0;
  border-bottom: 1px solid var(--line);
  transition:
    opacity 0.35s ease,
    padding-left 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

/* 다른 줄에 마우스가 올라가면 나머지는 물러난다 */
.row.dim {
  opacity: 0.32;
}

.row:hover,
.row:focus-visible {
  padding-left: 14px;
  outline: none;
}

.no {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
}

.name {
  font-size: clamp(20px, 2.6vw, 30px);
  font-weight: 500;
  letter-spacing: -0.03em;
}

.role {
  color: var(--muted);
  font-size: 13.5px;
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.stack i {
  padding: 3px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-style: normal;
}

.state {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-align: right;
}

.row:hover .state {
  color: var(--ink);
}

.row.empty .name {
  color: var(--faint);
  font-weight: 300;
}

/* ── 바닥 ── */
.foot {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: space-between;
  margin-top: 90px;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11px;
}

.foot p {
  margin: 0;
}

.how code {
  color: var(--muted);
}

/* ── 커서를 따라오는 미리보기 ── */
.peek {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 20;
  width: 268px;
  margin: -160px 0 0 34px;
  padding: 14px 14px 16px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--surface);
  pointer-events: none;
}

.peek-art {
  display: grid;
  aspect-ratio: 4 / 3;
  margin-bottom: 12px;
  background:
    radial-gradient(110% 90% at 20% 10%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 70%),
    var(--paper-deep);
  place-items: center;
}

.peek-initial {
  color: var(--accent);
  font-size: 34px;
  font-weight: 500;
  letter-spacing: -0.04em;
  opacity: 0.9;
}

.peek-name {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.peek-role {
  margin: 3px 0 0;
  color: var(--faint);
  font-size: 11.5px;
}

.peek-enter-active,
.peek-leave-active {
  transition:
    opacity 0.22s ease,
    scale 0.22s ease;
}

.peek-enter-from,
.peek-leave-to {
  opacity: 0;
  scale: 0.97;
}

@media (max-width: 900px) {
  .row {
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 8px 18px;
  }

  .role {
    grid-column: 2 / -1;
  }

  .stack {
    grid-column: 2 / -1;
    justify-content: flex-start;
  }
}
</style>
