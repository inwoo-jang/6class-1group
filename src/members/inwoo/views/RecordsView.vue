<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import UiIcon from '../components/UiIcon.vue'
import { RECORD_KINDS, useRecordStore } from '../stores/recordStore'
import { useAuthStore } from '../stores/authStore'
import { findTest } from '../data/personalityTests'
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

/** 테스트 기록은 저장된 id 로 지금 번들의 그림을 다시 찾아 쓴다 */
const artOf = (record) => {
  if (record.kind !== 'test' || !record.meta) return ''
  return findTest(record.meta.testId)?.results?.[record.meta.resultId]?.image ?? ''
}

/* ── 메모 수정 ──────────────────────────────────────────────────── */

/**
 * 어느 기록을 고치는 중인지 id 하나로 기억한다.
 * 기록마다 편집 상태를 따로 두면 목록을 다시 받을 때 서로 어긋난다.
 */
const editingId = ref(0)
const memoDraft = ref('')
const isSavingMemo = ref(false)

const startEdit = (record) => {
  editingId.value = record.id
  memoDraft.value = record.memo ?? ''
}

const cancelEdit = () => {
  editingId.value = 0
  memoDraft.value = ''
}

const saveMemo = async (record) => {
  isSavingMemo.value = true
  const ok = await store.editMemo(record.id, memoDraft.value.trim())
  isSavingMemo.value = false
  if (!ok) {
    ElMessage.error(store.errorMessage)
    return
  }
  ElMessage.success({ message: '메모를 저장했습니다.', duration: 1600 })
  cancelEdit()
}

/* ── 삭제 ───────────────────────────────────────────────────────── */

/** 되돌릴 수 없는 동작이라 한 번 묻는다 */
const confirmRemove = async (record) => {
  try {
    await ElMessageBox.confirm(
      `${formatDate(record.createdAt)}의 ${record.type} 기록을 지울까요?`,
      '기록 삭제',
      { confirmButtonText: '삭제', cancelButtonText: '그대로 두기', type: 'warning' },
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
  if (editingId.value === record.id) cancelEdit()
  ElMessage.success({ message: '기록을 지웠습니다.', duration: 1600 })
}

/* ── 표시용 ─────────────────────────────────────────────────────── */
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const formatDate = (iso) => dateFormatter.format(new Date(iso))

/** 카드 세 장을 "정/역"까지 한 줄로 */
const cardLine = (cards) =>
  (cards ?? []).map((card) => `${card.name}${card.reversed ? '(역)' : ''}`).join(' · ')

onMounted(() => store.load())
</script>

<template>
  <BaseDashboardCard>
    <div class="records">
      <header class="head">
        <div>
          <h3>My</h3>
          <p class="lead">
            <b>{{ displayName }}</b>님이 남긴 운세와 테스트 <b>{{ count }}</b>건
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
              <span aria-hidden="true">{{ (record.kind ?? 'tarot') === 'test' ? '🧪' : '🔮' }}</span>
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

          <!-- ② 운세 — 뽑은 카드 -->
          <p v-else-if="record.cards?.length" class="cards">{{ cardLine(record.cards) }}</p>

          <p class="reading">{{ record.reading }}</p>

          <!-- 메모: 보는 중 / 고치는 중 두 모습 -->
          <div v-if="editingId === record.id" class="memo-edit">
            <el-input
              v-model="memoDraft"
              type="textarea"
              :rows="3"
              maxlength="200"
              show-word-limit
              placeholder="이 기록에 남기고 싶은 말"
            />
            <div class="memo-actions">
              <el-button size="small" :loading="isSavingMemo" type="primary" @click="saveMemo(record)">
                저장
              </el-button>
              <el-button size="small" :disabled="isSavingMemo" @click="cancelEdit">취소</el-button>
            </div>
          </div>

          <p v-else class="memo" :class="{ blank: !record.memo }">
            {{ record.memo || '메모 없음' }}
          </p>

          <div class="actions">
            <button v-if="editingId !== record.id" type="button" @click="startEdit(record)">
              {{ record.memo ? '메모 고치기' : '메모 남기기' }}
            </button>
            <button type="button" class="danger" @click="confirmRemove(record)">삭제</button>
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
  background: var(--surface);
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

/* 테스트 기록은 왼쪽 선 색으로 한눈에 구분된다 */
.list li.test {
  border-left-color: var(--slate);
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

.reading {
  margin: 0;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.memo {
  margin: 0;
  padding: 8px 10px;
  border-left: 2px solid var(--accent-line);
  color: var(--ink-soft);
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.memo.blank {
  border-left-color: var(--line);
  color: var(--faint);
}

.memo-edit {
  display: grid;
  gap: 8px;
}

.memo-actions {
  display: flex;
  gap: 6px;
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
