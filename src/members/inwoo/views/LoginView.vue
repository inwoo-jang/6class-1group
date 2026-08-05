<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import { useAuthStore } from '../stores/authStore'
import { checkHealth } from '../data/fortuneApi'
import { link } from '../routes'

/**
 * 로그인 — /final/login
 *
 * 운세 기록은 "내 것"이라서 서버가 누구인지 알아야 내어 준다.
 * 여기서 받은 토큰을 authStore 가 들고, 이후 모든 요청에 자동으로 붙는다.
 *
 * 연습용 서버라 계정을 미리 두 개 심어 두었다(mock-api/data/stores.js).
 * 화면 아래 버튼을 누르면 그 계정이 입력칸에 채워진다 — 매번 타이핑하지 않도록.
 */
const route = useRoute()
const router = useRouter()

const auth = useAuthStore()
const { isLoading, errorMessage, isLoggedIn } = storeToRefs(auth)

const email = ref('')
const password = ref('')

/** 서버가 안 떠 있으면 무엇을 눌러도 실패한다. 그 사실을 먼저 알린다 */
const serverState = ref('checking') // checking | up | down

const SAMPLE_ACCOUNTS = [
  { label: '수강생', email: 'student@skala.com', password: '1234' },
  { label: '관리자', email: 'admin@skala.com', password: 'admin1234' },
]

const fillAccount = (account) => {
  email.value = account.email
  password.value = account.password
}

const canSubmit = computed(
  () => Boolean(email.value.trim()) && Boolean(password.value) && !isLoading.value,
)

/**
 * 로그인 전에 가려던 곳이 있으면 그리로 돌려보낸다.
 * 라우터 가드가 ?redirect=/final/records 처럼 적어 둔다.
 */
const goNext = () => {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/final')) {
    router.replace(redirect)
    return
  }
  router.replace(link('records'))
}

const submit = async () => {
  if (!canSubmit.value) return
  const ok = await auth.login(email.value.trim(), password.value)
  if (!ok) return
  ElMessage.success({ message: `${auth.displayName}님, 환영합니다.`, duration: 1800 })
  goNext()
}

onMounted(async () => {
  // 이미 로그인한 사람이 주소를 직접 쳐서 들어온 경우
  if (isLoggedIn.value) {
    goNext()
    return
  }
  try {
    await checkHealth()
    serverState.value = 'up'
  } catch {
    serverState.value = 'down'
  }
})
</script>

<template>
  <BaseDashboardCard>
    <div class="login">
      <header>
        <h3>로그인</h3>
        <p class="lead">운세 기록을 남기고 다시 꺼내 보려면 먼저 로그인해 주세요.</p>
      </header>

      <!-- 서버가 안 떠 있으면 무엇을 해도 안 되므로 먼저 알린다 -->
      <p v-if="serverState === 'down'" class="notice down">
        API 서버에 닿지 못했습니다. 터미널에서
        <code>npm run api</code> 를 실행한 뒤 다시 시도해 주세요.
      </p>

      <!-- @submit.prevent — 폼 기본 동작(새로고침)을 막고 우리 함수를 부른다 -->
      <form @submit.prevent="submit">
        <label>
          <span>이메일</span>
          <el-input
            v-model="email"
            type="email"
            size="large"
            placeholder="student@skala.com"
            autocomplete="username"
          />
        </label>

        <label>
          <span>비밀번호</span>
          <el-input
            v-model="password"
            type="password"
            size="large"
            placeholder="비밀번호"
            autocomplete="current-password"
            show-password
            @keyup.enter="submit"
          />
        </label>

        <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>

        <el-button
          size="large"
          class="submit glass-cta"
          :loading="isLoading"
          :disabled="!canSubmit"
          native-type="submit"
        >
          {{ isLoading ? '확인하는 중…' : '로그인' }}
        </el-button>
      </form>

      <footer>
        <p class="hint">연습용 계정</p>
        <div class="samples">
          <button
            v-for="account in SAMPLE_ACCOUNTS"
            :key="account.email"
            type="button"
            @click="fillAccount(account)"
          >
            {{ account.label }}
            <code>{{ account.email }}</code>
          </button>
        </div>
      </footer>
    </div>
  </BaseDashboardCard>
</template>

<style scoped>
.login {
  display: grid;
  gap: 18px;
  max-width: 380px;
  margin: 0 auto;
  padding: 8px 0 4px;
}

h3 {
  margin: 0 0 6px;
  color: var(--ink);
  font-size: 18px;
}

.lead {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

form {
  display: grid;
  gap: 14px;
}

label {
  display: grid;
  gap: 6px;
}

label span {
  color: var(--ink-soft);
  font-size: 12.5px;
  font-weight: 600;
}

.submit {
  width: 100%;
}

.notice {
  margin: 0;
  padding: 9px 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: 12.5px;
  line-height: 1.6;
}

.notice.error {
  border-color: var(--danger);
  background: var(--danger-tint);
  color: var(--danger);
}

.notice.down {
  border-color: var(--signal-line);
  background: var(--signal-tint);
  color: var(--signal);
}

.notice code {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--surface);
  font-family: var(--font-mono);
}

footer {
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.hint {
  margin: 0 0 8px;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11.5px;
}

.samples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.samples button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 7px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink-soft);
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
}

.samples button:hover {
  border-color: var(--accent-line);
  color: var(--accent);
}

.samples code {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
}
</style>
