<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CopyFilled, DownloadOutlined } from '@ant-design/icons-vue'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import UiIcon from '../components/UiIcon.vue'
import { RECORD_KINDS, useRecordStore } from '../stores/recordStore'
import { useAuthStore } from '../stores/authStore'
import { findTest } from '../data/personalityTests'
import { downloadBlob, drawLottoCard, drawResultCard } from '../utils/resultCard'
import { link } from '../routes'

/**
 * My — /final/records
 *
 * 운세와 심리테스트를 한 곳에 모아 둔다.
 *   조회  GET    /api/fortune-records        (?kind=tarot|test)
 *   수정  PATCH  /api/fortune-records/:id    (메모만)
 *   삭제  DELETE /api/fortune-records/:id
 *
 * 위쪽 필터는 운세/테스트 둘로만 나눈다. '오늘의 운세'·'솔로연애운' 같은
 * 세부 이름은 각 카드 안의 배지로 보여 준다 — 종류가 늘어도 필터가 늘지 않는다.
 */
const auth = useAuthStore()
const { displayName } = storeToRefs(auth)

const store = useRecordStore()
const { records, isLoading, errorMessage, filterKind, count, kindCounts } = storeToRefs(store)

/** 종류 배지 앞에 붙는 그림 */
const kindEmoji = (record) => {
  const kind = record.kind ?? 'tarot'
  return kind === 'test' ? '🧪' : kind === 'game' ? '🎲' : '🔮'
}

/** 테스트 기록은 저장된 id 로 지금 번들의 그림을 다시 찾아 쓴다 */
const artOf = (record) => {
  if (record.kind !== 'test' || !record.meta) return ''
  return findTest(record.meta.testId)?.results?.[record.meta.resultId]?.image ?? ''
}

/* ── 삭제 ───────────────────────────────────────────────────────── */

/** 되돌릴 수 없는 동작이라 한 번 묻는다 */
const confirmRemove = async (record) => {
  try {
    await ElMessageBox.confirm(
      `${formatDate(record.createdAt)}의 ${record.type} 기록을 지울까요?`,
      '기록 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '그대로 두기',
        type: 'warning',
        // 이 이름을 단 대화창만 아래 스타일이 잡는다 (다른 화면에는 안 번진다)
        customClass: 'inwoo-confirm',
      },
    )
  } catch {
    // 취소를 누르면 여기로 온다 — 아무 일도 하지 않는다
    return
  }

  const ok = await store.remove(record.id)
  if (!ok) {
    ElMessage.error(store.errorMessage)
    return
  }
  ElMessage.success({ message: '기록을 지웠습니다.', duration: 1600 })
}

/* ── 표시용 ─────────────────────────────────────────────────────── */
/* 며칠 전 기록인지 헷갈리지 않게 연도까지 적는다 */
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const formatDate = (iso) => dateFormatter.format(new Date(iso))

/* ── 한 건씩 가져가기 ──────────────────────────────────────────
 *
 * 기록은 남겨 두는 것으로 끝나지 않는다. 친구에게 보내거나 어딘가 붙여
 * 두고 싶을 때가 있어서, 카드마다 '글자로 복사'와 '그림으로 저장'을 둔다.
 * 그림은 각 화면에서 쓰던 카드 그리기를 그대로 다시 쓴다.
 */
const copyOne = async (record) => {
  const lines = [`[${record.type}] ${formatDate(record.createdAt)}`, record.reading]
  if (record.cards?.length) lines.splice(1, 0, cardLine(record.cards))
  if (isLotto(record)) lines.splice(1, 0, record.meta.result)

  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    ElMessage.success({ message: '기록을 복사했어요.', duration: 1400 })
  } catch {
    ElMessage.warning('브라우저가 복사를 막았습니다. 길게 눌러 직접 복사해 주세요.')
  }
}

/** 이 기록을 그림으로 만들 수 있는지 (테스트 · 로또만 그릴 그림이 있다) */
const canDraw = (record) =>
  isLotto(record) || (record.kind === 'test' && Boolean(findTest(record.meta?.testId)))

const savingId = ref(0)

const saveImage = async (record) => {
  if (savingId.value) return
  savingId.value = record.id
  try {
    let blob = null

    if (isLotto(record)) {
      const sets = record.meta.lines.map((numbers, i) => ({
        letter: String.fromCharCode(65 + i),
        numbers,
        bonus: record.meta.bonus?.[i],
      }))
      blob = await drawLottoCard({ sets })
    } else if (record.kind === 'test') {
      const test = findTest(record.meta.testId)
      const result = test?.results?.[record.meta.resultId]
      if (result) blob = await drawResultCard({ test, result })
    }

    if (!blob) throw new Error('no blob')
    downloadBlob(blob, `${record.type}_${formatDate(record.createdAt)}.png`)
    ElMessage.success({ message: '이미지로 저장했어요!', duration: 1500 })
  } catch {
    ElMessage.error('그림을 만들지 못했어요.')
  } finally {
    savingId.value = 0
  }
}

/** 로또 기록인지 — 번호가 줄 단위로 담겨 있어야 공으로 그릴 수 있다 */
const isLotto = (record) =>
  record.kind === 'game' && record.meta?.gameId === 'lotto' && Array.isArray(record.meta.lines)

/** 공 색 — 게임 화면과 같은 구간을 쓴다 */
const lottoTone = (n) => {
  if (n <= 10) return '#f5bf35'
  if (n <= 20) return '#3d8fdd'
  if (n <= 30) return '#e8564c'
  if (n <= 40) return '#4b525c'
  return '#3fa870'
}

/** 카드 세 장을 "정/역"까지 한 줄로 */
const cardLine = (cards) =>
  (cards ?? []).map((card) => `${card.name}${card.reversed ? '(역)' : ''}`).join(' · ')

const summaryOf = (record) =>
  String(record.reading ?? '')
    .replace(/\n+/g, ' ')
    .split(/[.!?。]/)[0]
    .trim()

const tarotReplayLink = (record) =>
  link('tarot', {}, {
    recordId: record.id,
    replay: JSON.stringify({ type: record.type, cards: record.cards }),
  })

onMounted(() => store.load())
</script>

<template>
  <BaseDashboardCard>
    <div class="records">
      <header class="head">
        <div>
          <h3>My</h3>
          <p class="lead">
            <b>{{ displayName }}</b>님이 남긴 기록 <b>{{ count }}</b>건
          </p>
        </div>

        <el-button
          circle
          size="small"
          :loading="isLoading"
          title="새로고침"
          aria-label="새로고침"
          @click="store.load()"
        >
          <UiIcon v-if="!isLoading" name="refresh" :size="15" />
        </el-button>
      </header>

      <!-- 필터는 운세 / 테스트 둘뿐이다 -->
      <div class="filters" role="group" aria-label="기록 종류">
        <button type="button" :class="{ on: filterKind === '' }" @click="store.setFilter('')">
          전체 <span class="num">{{ store.allRecords.length }}</span>
        </button>
        <button
          v-for="kind in RECORD_KINDS"
          :key="kind.key"
          type="button"
          :class="{ on: filterKind === kind.key }"
          @click="store.setFilter(kind.key)"
        >
          <span aria-hidden="true">{{ kind.emoji }}</span>
          {{ kind.label }}
          <span class="num">{{ kindCounts[kind.key] ?? 0 }}</span>
        </button>
      </div>

      <p v-if="errorMessage" class="notice error">
        {{ errorMessage }}
        <button type="button" @click="store.load()">다시 시도</button>
      </p>

      <p v-else-if="isLoading && !records.length" class="notice">기록을 불러오는 중입니다…</p>

      <p v-else-if="!records.length" class="notice empty">
        아직 남긴 기록이 없습니다.
        <RouterLink :to="link('tarot')">운세</RouterLink>나
        <RouterLink :to="link('tests')">테스트</RouterLink>를 보고 결과를 저장해 보세요.
      </p>

      <ul v-else class="list">
        <li v-for="record in records" :key="record.id" :class="record.kind ?? 'tarot'">
          <div class="row">
            <!-- 세부 종류는 여기서 보여 준다 (오늘의 운세 · 영혼 동물 테스트 …) -->
            <span class="type">
              <span aria-hidden="true">{{ kindEmoji(record) }}</span>
              {{ record.type }}
            </span>
            <time :datetime="record.createdAt">{{ formatDate(record.createdAt) }}</time>
          </div>

          <!-- ① 테스트 — 그림 + 결과 이름 -->
          <div v-if="record.kind === 'test' && record.meta" class="test-result">
            <img v-if="artOf(record)" :src="artOf(record)" :alt="`${record.meta.title} 그림`" />
            <span v-else class="face" aria-hidden="true">{{ record.meta.emoji }}</span>
            <span>
              <b>{{ record.meta.emoji }} {{ record.meta.title }}</b>
              <small>{{ record.meta.subtitle }}</small>
            </span>
          </div>

          <!-- ② 로또 — 화면에서 본 그대로 색 공으로 -->
          <div v-else-if="isLotto(record)" class="lotto-result">
            <span v-for="(line, li) in record.meta.lines" :key="li" class="lotto-line">
              <!-- 몇 번째 세트인지는 번호 옆에 붙인다. 따로 한 줄을 쓰지 않는다 -->
              <span class="letter">{{ String.fromCharCode(65 + li) }}</span>
              <span
                v-for="n in line"
                :key="n"
                class="ball"
                :style="{ background: lottoTone(n) }"
              >
                {{ n }}
              </span>
              <template v-if="record.meta.bonus?.[li]">
                <span class="plus" aria-hidden="true">+</span>
                <span class="ball bonus" :style="{ background: lottoTone(record.meta.bonus[li]) }">
                  {{ record.meta.bonus[li] }}
                </span>
              </template>
            </span>
          </div>

          <!-- ③ 그 밖의 게임 — 무엇이 나왔는지 -->
          <p v-else-if="record.kind === 'game' && record.meta" class="game-result">
            <b>{{ record.meta.result }}</b>
            <small v-if="record.meta.items?.length">{{ record.meta.items.length }}개 중에서</small>

            <!-- 그때 돌린 항목 그대로 다시 돌려 볼 수 있게 -->
            <RouterLink
              v-if="record.meta.gameId === 'roulette' && record.meta.items?.length"
              class="replay"
              :to="link('roulette', {}, { items: JSON.stringify(record.meta.items) })"
            >
              이 목록으로 다시 →
            </RouterLink>
          </p>

          <!-- ④ 운세 — 뽑은 카드 -->
          <div v-else-if="record.cards?.length" class="tarot-result">
            <span class="cards">{{ cardLine(record.cards) }}</span>
            <small>{{ summaryOf(record) }}</small>
          </div>

          <!-- 로또는 공이 곧 내용이라 설명 줄을 따로 두지 않는다 -->
          <p v-if="!isLotto(record)" class="reading">{{ record.reading }}</p>

          <div class="record-footer">
            <RouterLink v-if="record.cards?.length" class="replay-link" :to="tarotReplayLink(record)">
              결과 다시 보기 →
            </RouterLink>

            <div class="actions">
              <button type="button" class="icon" title="글자로 복사" @click="copyOne(record)">
                <CopyFilled />
              </button>
              <button
                v-if="canDraw(record)"
                type="button"
                class="icon"
              title="이미지로 저장"
                :disabled="savingId === record.id"
                @click="saveImage(record)"
              >
                <DownloadOutlined />
              </button>
              <button type="button" class="danger" @click="confirmRemove(record)">삭제</button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </BaseDashboardCard>
</template>

<style scoped>
.records {
  display: grid;
  gap: 14px;
}

.head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

h3 {
  margin: 0 0 4px;
  color: var(--ink);
  font-size: 18px;
}

.lead {
  margin: 0;
  color: var(--muted);
  font-size: 12.5px;
}

.lead b {
  color: var(--ink-soft);
}

/* ── 필터 ── */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filters button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 7px 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel-strong);
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
}

.filters button:hover {
  border-color: var(--accent-line);
  color: var(--accent);
}

.filters button.on {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--on-accent);
}

.num {
  color: inherit;
  font-family: var(--font-mono);
  font-size: 11px;
  opacity: 0.75;
}

/* ── 목록 ── */
.list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.list li {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent-line);
  border-radius: 8px;
  background: var(--panel-inner, var(--surface));
}

/* 왼쪽 선 색으로 종류가 한눈에 구분된다 */
.list li.test {
  border-left-color: var(--slate);
}

.list li.game {
  border-left-color: var(--signal);
}

.list li.game .type {
  background: var(--signal-tint);
  color: var(--signal);
}

/* 게임은 무엇이 나왔는지가 전부라 크게 한 줄 */
/* ── 로또 기록 ── */
.lotto-result {
  display: grid;
  gap: 6px;
}

.lotto-result .letter {
  width: 14px;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
}

.lotto-line {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
}

.lotto-result .ball {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  font-size: 12.5px;
  font-weight: 800;
  box-shadow:
    inset 0 -2px 4px rgb(0 0 0 / 0.18),
    inset 0 2px 4px rgb(255 255 255 / 0.3);
}

.lotto-result .ball.bonus {
  width: 26px;
  height: 26px;
  font-size: 11.5px;
  opacity: 0.92;
}

.lotto-result .plus {
  color: var(--faint);
  font-size: 12px;
  font-weight: 700;
}

.game-result {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: baseline;
  margin: 0;
}

.game-result b {
  color: var(--ink);
  /* 로또처럼 번호가 길게 이어지는 결과도 있어 줄바꿈을 허용한다 */
  font-size: 16px;
  font-weight: 800;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.game-result small {
  color: var(--faint);
  font-size: 11.5px;
}

.replay {
  padding: 4px 11px;
  border-radius: 999px;
  background: var(--accent-tint);
  color: var(--accent);
  font-size: 11.5px;
  font-weight: 700;
  text-decoration: none;
}

.replay:hover {
  background: color-mix(in srgb, var(--accent) 22%, transparent);
}

.row {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.type {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--accent-tint);
  color: var(--accent);
  font-size: 11.5px;
  font-weight: 700;
}

.list li.test .type {
  background: var(--slate-tint);
  color: var(--slate);
}

time {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11.5px;
}

/* ── 테스트 결과 ── */
.test-result {
  display: flex;
  gap: 12px;
  align-items: center;
}

.test-result img {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  object-fit: cover;
}

.test-result .face {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: var(--slate-tint);
  font-size: 24px;
}

.test-result span {
  display: grid;
  gap: 2px;
}

.test-result b {
  color: var(--ink);
  font-size: 14px;
}

.test-result small {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

/* ── 운세 카드 ── */
.cards {
  margin: 0;
  color: var(--ink-soft);
  font-size: 12.5px;
  font-weight: 600;
}

.tarot-result { display: grid; gap: 4px; }
.tarot-result small { overflow: hidden; color: var(--muted); font-size: 12px; line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.record-footer { display: flex; min-height: 28px; margin-top: 5px; align-items: end; justify-content: space-between; }
.replay-link { color: var(--accent); font-size: 11.5px; font-weight: 700; text-decoration: none; }
.replay-link:hover { text-decoration: underline; }

.reading {
  margin: 0;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.actions button {
  padding: 5px 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
}

/*
 * 아이콘 버튼은 테두리를 두르지 않는다.
 * 옆의 '삭제' 처럼 알약을 씌우면 아이콘 셋이 나란히 서서 시끄럽다.
 * 그림 하나만 놓고, 눌리는 자리는 넉넉히 잡아 둔다.
 */
.actions button.icon {
  display: grid;
  width: 26px;
  height: 26px;
  padding: 0;
  place-items: center;
  border: 0;
  color: var(--faint);
  font-size: 14px;
}

.actions button.icon:hover {
  color: var(--ink-soft);
}

.actions button.icon:disabled {
  cursor: default;
  opacity: 0.5;
}

.actions button:hover {
  border-color: var(--accent-line);
  color: var(--accent);
}

.actions button.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}

/* ── 안내 ── */
.notice {
  margin: 0;
  padding: 16px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.7;
  text-align: center;
}

.notice.error {
  border-style: solid;
  border-color: var(--danger);
  background: var(--danger-tint);
  color: var(--danger);
}

.notice.error button {
  margin-left: 8px;
  padding: 3px 10px;
  border: 1px solid currentcolor;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.notice a {
  color: var(--accent);
  font-weight: 600;
}
</style>
