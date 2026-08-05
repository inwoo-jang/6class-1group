<script setup>
import { computed, defineAsyncComponent, shallowRef, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { findMember } from '../data/members'
import { loadWork } from '../members'
import SiteHeader from '../components/SiteHeader.vue'

/**
 * 팀원 한 명의 자리.
 * ------------------------------------------------------------------
 * 갤러리가 하는 일은 머리띠를 얹는 것까지다. 그 아래는
 * 그 사람의 index.vue 에 통째로 넘긴다. 그 안에서 다시 화면이
 * 나뉘는지(RouterView) 아닌지는 그 사람이 정한다.
 *
 * 결과물은 이 주소에 들어왔을 때 비로소 불러온다.
 */
const props = defineProps({
  slug: { type: String, required: true },
})

const member = computed(() => findMember(props.slug))
const memberStyle = computed(() => ({
  '--member-bottom-clearance': member.value?.bottomClearance ?? '0px',
}))
const work = shallowRef(null)

/**
 * 표지 카드 안에서 축소되어 보이는 중인지 (?preview=1).
 * 이때는 머리띠와 바닥글을 뺀다. 카드 안에 또 머리띠가 보이면
 * 사이트 안에 사이트가 든 것처럼 읽혀서 미리보기로 안 보인다.
 */
const route = useRoute()
const isPreview = computed(() => route.query.preview !== undefined)

watch(
  () => props.slug,
  (slug) => {
    const load = loadWork(slug)
    work.value = load ? defineAsyncComponent(load) : null
  },
  { immediate: true },
)
</script>

<template>
  <div class="member" :class="{ preview: isPreview }" :style="memberStyle">
    <SiteHeader v-if="!isPreview" :here="member?.name ?? slug" :live="member?.live ?? ''" />

    <!-- 결과물이 들어온 경우 — 자리만 내주고 아무 것도 덧그리지 않는다 -->
    <main v-if="work" class="stage">
      <component :is="work" />
    </main>

    <!-- 아직 안 들어온 경우 -->
    <main v-else class="waiting">
      <p class="state">준비 중</p>
      <h2>{{ member?.name ?? '이 사람' }}의 결과물이 아직 없습니다</h2>
      <p class="how">
        <code>src/members/{{ slug }}/index.vue</code> 를 두면 이 자리에 그대로 나타납니다.
      </p>
      <RouterLink class="pill back" :to="{ name: 'index' }">← 전체 보기</RouterLink>
    </main>

    <footer v-if="member && !isPreview" class="foot">
      <span class="left">
        <b>{{ member.name }}</b>
        <span v-if="member.role" class="role">{{ member.role }}</span>
      </span>
      <span class="stack">
        <i v-for="tech in member.stack" :key="tech">{{ tech }}</i>
      </span>
    </footer>
  </div>
</template>

<style scoped>
.member {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  min-height: 100vh;
  padding: var(--edge);
  padding-bottom: calc(var(--edge) + var(--member-bottom-clearance));
}

/*
 * 카드 안에 축소되어 들어갈 때.
 * 여백을 없애 결과물이 포스터를 꽉 채우게 하고, 안에서 스크롤이나
 * 클릭이 일어나지 않게 막는다 — 카드 전체가 하나의 링크여야 한다.
 */
.member.preview {
  /* 프레임 높이를 끝까지 채워야 아래에 다른 색 띠가 생기지 않는다 */
  min-height: 100vh;
  padding: 0;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}

/*
 * 자리만 내주고 아무 것도 덧그리지 않는다.
 * grid 로 두면 안의 결과물이 남은 높이를 알아서 채운다 —
 * 결과물이 배경을 깔았을 때 아래가 잘려 보이지 않는다.
 */
.stage {
  display: grid;
  flex: 1;
  min-width: 0;
}

/*
 * 결과물이 지면 위에 한 겹 떠 있어 보이게 한다.
 *
 * 쓸 수 있는 속성이 제한된다 — 팀원 코드에 position: fixed 와 sticky 가 있어서
 * transform · filter · clip-path · overflow:hidden 을 여기 걸면 그것들이 깨진다.
 * (앞의 셋은 fixed 의 기준을 이 요소로 바꿔 버리고, overflow 는 sticky 를 죽인다)
 * 그래서 배치에 전혀 영향이 없는 box-shadow 와 배경만 쓴다.
 *
 * 그림자는 네 겹이다 — 테두리 선, 닿는 그늘, 몸통 그늘, 멀리 퍼지는 그늘.
 * 한 겹만 쓰면 스티커처럼 납작해 보인다.
 *
 * 빛은 오른쪽 위에서 온다고 본다. 그래서 그늘은 전부 왼쪽 아래(-x, +y)로만 간다.
 * 인덱스 화면의 슬라이드와 같은 방향이라, 두 화면을 오가도 광원이 바뀌지 않는다.
 *
 * 모서리는 일부러 둥글리지 않는다. 결과물마다 배경을 그리는 방식이 달라서
 * (어떤 것은 안에서 잘라 내고 어떤 것은 그대로 그린다) 둥글리면 사람마다
 * 모서리가 제각각이 된다. 잘라 내려면 overflow 나 clip-path 가 필요한데
 * 그것들은 팀원 코드의 sticky · fixed 를 깨뜨린다.
 */
.member:not(.preview) .stage {
  background: var(--card);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--fg) 8%, transparent),
    -4px 5px 5px -3px rgb(0 0 0 / 16%),
    -20px 26px 14px -10px rgb(0 0 0 / 18%),
    -40px 52px 60px -24px rgb(0 0 0 / 24%);
}

/* 어두운 화면에서는 그늘이 안 보이므로, 위쪽에 옅은 빛을 얹어 경계를 만든다 */
@media (prefers-color-scheme: dark) {
  .member:not(.preview) .stage {
    box-shadow:
      inset 0 1px 0 color-mix(in srgb, #fff 8%, transparent),
      0 0 0 1px color-mix(in srgb, #fff 6%, transparent),
      -4px 5px 6px -3px rgb(0 0 0 / 50%),
      -20px 26px 15px -10px rgb(0 0 0 / 55%),
      -42px 54px 64px -24px rgb(0 0 0 / 70%);
  }
}

.waiting {
  display: grid;
  flex: 1;
  align-content: center;
  gap: 14px;
  padding: clamp(60px, 16vh, 140px) 24px;
  border-radius: var(--radius);
  background: var(--card);
  box-shadow:
    0 2px 4px color-mix(in srgb, var(--fg) 5%, transparent),
    0 12px 28px -10px color-mix(in srgb, var(--fg) 16%, transparent);
  justify-items: center;
  text-align: center;
}

.state {
  margin: 0;
  color: var(--fg-muted);
}

h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.14px;
  line-height: 16px;
}

.how {
  margin: 0;
  color: var(--fg-muted);
}

.how code {
  font-family: var(--font-mono);
  font-size: 12px;
}

.back {
  margin-top: 10px;
  background: var(--surface);
  transition:
    color 0.3s var(--ease),
    background 0.3s var(--ease);
}

.back:hover {
  color: var(--on-fg);
  background: var(--fg);
}

.foot {
  display: flex;
  flex-wrap: wrap;
  height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  color: var(--fg-muted);
}

.left {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.left b {
  color: var(--fg);
  font-weight: 400;
}

.role {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stack {
  display: inline-flex;
  gap: 8px;
}

.stack i {
  font-style: normal;
  white-space: nowrap;
}

@media (max-width: 680px) {
  .stack {
    display: none;
  }
}
</style>
