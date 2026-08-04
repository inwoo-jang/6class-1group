<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import UiIcon from '../components/UiIcon.vue'
import { RECORD_TYPES, useRecordStore } from '../stores/recordStore'
import { useAuthStore } from '../stores/authStore'
import { link } from '../routes'

/**
 * 운세 기록 — /final/records
 *
 * 타로 화면에서 남긴 기록을 다시 꺼내 본다.
 *   조회  GET    /api/fortune-records        (?type= 으로 종류만 추림)
 *   수정  PATCH  /api/fortune-records/:id    (메모만)
 *   삭제  DELETE /api/fortune-records/:id
 *
 * 서버는 토큰의 주인 것만 내어 주므로, 화면에서 "내 것인지" 따로 거를 필요가 없다.
 */
const auth = useAuthStore()
const { displayName } = storeToRefs(auth)

const store = useRecordStore()
const { records, isLoading, errorMessage, filterType, count, typeCounts } = storeToRefs(store)

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
  cards.map((card) => `${card.name}${card.reversed ? '(역)' : ''}`).join(' · ')

onMounted(() => store.load())
</script>

<template>
  <BaseDashboardCard>
    <div class="records">
      <header class="head">
        <div>
          <h3>운세 기록</h3>
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

      <!-- 종류 필터 — 서버에 ?type= 으로 넘어간다 -->
      <div class="filters" role="group" aria-label="운세 종류">
        <button type="button" :class="{ on: filterType === '' }" @click="store.setFilter('')">
          전체 <span class="num">{{ store.allRecords.length }}</span>
        </button>
        <button
          v-for="type in RECORD_TYPES"
          :key="type"
          type="button"
          :class="{ on: filterType === type }"
          @click="store.setFilter(type)"
        >
          {{ type }} <span class="num">{{ typeCounts[type] ?? 0 }}</span>
        </button>
      </div>

      <p v-if="errorMessage" class="notice error">
        {{ errorMessage }}
        <button type="button" @click="store.load()">다시 시도</button>
      </p>

      <p v-else-if="isLoading && !records.length" class="notice">기록을 불러오는 중입니다…</p>

      <!-- 비어 있을 때도 다음에 무엇을 하면 되는지 알려 준다 -->
      <p v-else-if="!records.length" class="notice empty">
        아직 남긴 기록이 없습니다.
        <RouterLink :to="link('tarot')">운세를 보고</RouterLink> 마음에 드는 해석을 저장해 보세요.
      </p>

      <ul v-else class="list">
        <li v-for="record in records" :key="record.id">
          <div class="row">
            <span class="type">{{ record.type }}</span>
            <time :datetime="record.createdAt">{{ formatDate(record.createdAt) }}</time>
          </div>

          <p class="cards">{{ cardLine(record.cards) }}</p>
          <p class="reading">{{ record.reading }}</p>

          <!-- 메모: 보는 중 / 고치는 중 두 모습 -->
          <div v-if="editingId === record.id" class="memo-edit">
            <el-input
              v-model="memoDraft"
              type="textarea"
              :rows="3"
              maxlength="200"
              show-word-limit
              placeholder="이 운세에 대해 남기고 싶은 말"
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
  padding: 6px 12px;
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
  border-radius: 8px;
  background: var(--panel-inner, var(--surface));
}

.row {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.type {
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--accent-tint);
  color: var(--accent);
  font-size: 11.5px;
  font-weight: 700;
}

time {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11.5px;
}

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
