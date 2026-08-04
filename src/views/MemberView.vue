<script setup>
import { computed, defineAsyncComponent, shallowRef, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { findMember } from '../data/members'
import { loadWork } from '../members'

/**
 * 팀원 한 명의 결과물 화면.
 * 결과물 컴포넌트는 이 주소에 들어왔을 때 비로소 불러온다.
 */
const props = defineProps({
  slug: { type: String, required: true },
})

const member = computed(() => findMember(props.slug))
const work = shallowRef(null)

watch(
  () => props.slug,
  (slug) => {
    const loader = loadWork(slug)
    work.value = loader ? defineAsyncComponent(loader) : null
  },
  { immediate: true },
)
</script>

<template>
  <div class="member">
    <header class="bar page">
      <RouterLink class="back" :to="{ name: 'index' }">
        <span aria-hidden="true">←</span> 목록
      </RouterLink>

      <div class="who">
        <b>{{ member?.name ?? '알 수 없는 사람' }}</b>
        <span v-if="member">{{ member.role }}</span>
      </div>

      <a
        v-if="member?.live"
        class="live"
        :href="member.live"
        target="_blank"
        rel="noreferrer"
      >
        따로 배포한 사이트 ↗
      </a>
    </header>

    <!-- 결과물이 들어온 경우 -->
    <main v-if="work" class="stage">
      <component :is="work" />
    </main>

    <!-- 아직 안 들어온 경우 -->
    <main v-else class="waiting page">
      <p class="eyebrow">NOT SUBMITTED</p>
      <h2>{{ member?.name ?? '이 사람' }}의 결과물이 아직 없습니다</h2>
      <p class="how">
        <code>src/members/{{ slug }}/index.vue</code> 를 두면 이 자리에 그대로 나타납니다.
      </p>
      <RouterLink class="to-index" :to="{ name: 'index' }">목록으로 돌아가기</RouterLink>
    </main>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  padding: 26px 0;
  border-bottom: 1px solid var(--line);
}

.back {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
}

.back:hover {
  color: var(--ink);
}

.who {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: baseline;
  margin-left: 12px;
}

.who b {
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.who span {
  color: var(--faint);
  font-size: 12.5px;
}

.live {
  margin-left: auto;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 11.5px;
}

.live:hover {
  color: var(--ink);
}

/* 결과물은 자기 폭을 스스로 정하게 둔다 */
.stage {
  padding: clamp(28px, 5vw, 56px) 0 120px;
}

.waiting {
  padding: clamp(90px, 20vh, 200px) 0 160px;
}

.waiting h2 {
  margin: 18px 0 0;
  font-size: clamp(24px, 3.4vw, 38px);
  font-weight: 400;
  letter-spacing: -0.03em;
}

.how {
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 13.5px;
}

.how code {
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 12.5px;
}

.to-index {
  display: inline-block;
  margin-top: 34px;
  padding: 11px 20px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  font-size: 13px;
}

.to-index:hover {
  border-color: var(--ink);
}
</style>
