<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import UiIcon from '../components/UiIcon.vue'
import { useAdminStore } from '../stores/adminStore'

/**
 * 관리자 — /admin
 *
 * 로그인한 사람의 role 이 ADMIN 일 때만 들어올 수 있다(routes.js 의 가드).
 * 다만 진짜로 막는 곳은 서버다 — 주소를 직접 쳐도 API 가 403 을 돌려준다.
 *
 * 여기서 하는 일은 셋뿐이다.
 *   ① 모든 사람의 기록을 한 줄로 늘어놓고
 *   ② 이상한 것(테스트용·부적절한 것)을 지우고
 *   ③ 필요하면 전부 비운다
 */
const store = useAdminStore()
const { records, isLoading, isWorking, errorMessage, byOwner, byKind } = storeToRefs(store)

const KIND_LABEL = { tarot: '🔮 운세', test: '🧪 테스트', game: '🎲 게임' }

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/*
 * 날짜가 비었거나 형식이 어긋난 기록이 섞여 들어와도 화면 전체가 멈추면 안 된다.
 * Intl 은 잘못된 날짜를 만나면 예외를 던지므로 여기서 걸러 낸다.
 */
const formatDate = (iso) => {
  const date = new Date(iso ?? '')
  return Number.isNaN(date.getTime()) ? '날짜 없음' : dateFormatter.format(date)
}

const removeOne = async (record) => {
  try {
    await ElMessageBox.confirm(
      `${record.owner?.name ?? '알 수 없음'}님의 ${record.type} 기록을 지울까요?`,
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
    return // 취소
  }

  const ok = await store.remove(record.id)
  ElMessage[ok ? 'success' : 'error']({
    message: ok ? '기록을 지웠습니다.' : store.errorMessage,
    duration: 1600,
  })
}

/** 되돌릴 수 없는 동작이라 한 번 더 묻는다 */
const resetAll = async () => {
  try {
    await ElMessageBox.confirm(
      `모든 사용자의 기록 ${records.value.length}건을 전부 지웁니다. 되돌릴 수 없습니다.`,
      '데이터 초기화',
      {
        confirmButtonText: '전부 지우기',
        cancelButtonText: '그만두기',
        type: 'warning',
        // 이 이름을 단 대화창만 아래 스타일이 잡는다 (다른 화면에는 안 번진다)
        customClass: 'inwoo-confirm',
      },
    )
  } catch {
    return
  }

  const ok = await store.resetAll()
  ElMessage[ok ? 'success' : 'error']({
    message: ok ? '기록을 모두 지웠습니다.' : store.errorMessage,
    duration: 1600,
  })
}

onMounted(() => store.load())
</script>

<template>
  <BaseDashboardCard>
    <div class="admin">
      <header class="head">
        <div>
          <p class="eyebrow">ADMIN</p>
          <h3>전체 기록 관리</h3>
          <p class="lead">모든 사용자가 남긴 운세 · 테스트 · 게임 기록입니다.</p>
        </div>

        <div class="head-acts">
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
          <button type="button" class="danger" :disabled="isWorking || !records.length" @click="resetAll">
            데이터 초기화
          </button>
        </div>
      </header>

      <!-- 한눈에 보는 수치 -->
      <div class="stats">
        <p class="stat">
          <b>{{ records.length }}</b>
          <small>전체 기록</small>
        </p>
        <p class="stat">
          <b>{{ byOwner.length }}</b>
          <small>남긴 사람</small>
        </p>
        <p class="stat">
          <b>{{ byKind.tarot }}</b>
          <small>운세</small>
        </p>
        <p class="stat">
          <b>{{ byKind.test }}</b>
          <small>테스트</small>
        </p>
        <p class="stat">
          <b>{{ byKind.game }}</b>
          <small>게임</small>
        </p>
      </div>

      <p v-if="errorMessage" class="notice error">
        {{ errorMessage }}
        <button type="button" @click="store.load()">다시 시도</button>
      </p>

      <p v-else-if="isLoading && !records.length" class="notice">기록을 불러오는 중입니다…</p>

      <p v-else-if="!records.length" class="notice empty">아직 남은 기록이 없습니다.</p>

      <ul v-else class="list">
        <li v-for="record in records" :key="record.id">
          <div class="row">
            <span class="who">
              {{ record.owner?.name ?? '알 수 없음' }}
              <!-- 이름만으로는 누구 계정인지 모른다. 로그인에 쓴 이메일까지 적는다 -->
              <em v-if="record.owner?.email">{{ record.owner.email }}</em>
            </span>
            <span class="kind">{{ KIND_LABEL[record.kind ?? 'tarot'] }}</span>
            <span class="type">{{ record.type }}</span>
            <time :datetime="record.createdAt">{{ formatDate(record.createdAt) }}</time>
            <button
              type="button"
              class="remove"
              :disabled="isWorking"
              :title="`${record.type} 기록 삭제`"
              @click="removeOne(record)"
            >
              삭제
            </button>
          </div>
          <p class="reading">{{ record.reading }}</p>
        </li>
      </ul>
    </div>
  </BaseDashboardCard>
</template>

<style scoped>
.admin {
  display: grid;
  gap: 16px;
}

.head {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.eyebrow {
  margin: 0 0 4px;
  color: var(--danger);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
}

h3 {
  margin: 0;
  color: var(--ink);
  font-size: 20px;
}

.lead {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.head-acts {
  display: flex;
  gap: 8px;
  align-items: center;
}

.danger {
  padding: 7px 14px;
  border: 1px solid var(--danger);
  border-radius: 999px;
  background: transparent;
  color: var(--danger);
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
}

.danger:hover:not(:disabled) {
  background: var(--danger-tint);
}

.danger:disabled {
  cursor: default;
  opacity: 0.45;
}

/* ── 수치 ── */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 8px;
}

.stat {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--surface);
  text-align: center;
}

.stat b {
  color: var(--ink);
  font-size: 20px;
  font-weight: 800;
}

.stat small {
  color: var(--faint);
  font-size: 11.5px;
}

/* ── 목록 ── */
.list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.list li {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-left: 3px solid var(--danger-tint);
  border-radius: 14px;
  background: var(--surface);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.who {
  display: inline-flex;
  gap: 6px;
  align-items: baseline;
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
}

.who em {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11px;
  font-style: normal;
  font-weight: 500;
}

.kind {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--surface-sunken);
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
}

.type {
  color: var(--ink-soft);
  font-size: 12.5px;
}

time {
  margin-left: auto;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11.5px;
}

.remove {
  padding: 4px 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 11.5px;
}

.remove:hover:not(:disabled) {
  border-color: var(--danger);
  color: var(--danger);
}

.reading {
  margin: 0;
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.6;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* ── 안내 ── */
.notice {
  margin: 0;
  padding: 22px 16px;
  border-radius: 14px;
  background: var(--surface);
  color: var(--muted);
  font-size: 13px;
  text-align: center;
}

.notice.error {
  color: var(--danger);
}

.notice button {
  margin-left: 8px;
  padding: 4px 12px;
  border: 1px solid currentcolor;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

@media (max-width: 720px) {
  time {
    margin-left: 0;
  }
}
</style>
