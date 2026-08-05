<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { link } from '../routes'
import { useAuthStore } from '@/members/gayeon/stores/authStore'
import { ElMessage } from 'element-plus'

const router = useRouter()
const currentStep = ref(0)

/* ─────────────────────────────────────────────
   1단계: 약관 동의
   ───────────────────────────────────────────── */
const agreeTerms = ref(false) // 필수: 이용약관
const agreePrivacy = ref(false) // 필수: 개인정보 수집·이용
const agreeMarketing = ref(false) // 선택: 마케팅 수신

const allRequiredAgreed = computed(() => agreeTerms.value && agreePrivacy.value)

// "전체 동의" 체크박스 - 누르면 3개 다 켜지고/꺼지고, 개별 체크 상태도 반영해서 보여줌
const allAgreed = computed({
  get: () => agreeTerms.value && agreePrivacy.value && agreeMarketing.value,
  set: (val) => {
    agreeTerms.value = val
    agreePrivacy.value = val
    agreeMarketing.value = val
  },
})

/* ─────────────────────────────────────────────
   2단계: 정보 입력
   ───────────────────────────────────────────── */
const formRef = ref(null)
const form = reactive({
  userId: '',
  password: '',
  passwordConfirm: '',
  name: '',
})
const authStore = useAuthStore()

const validatePasswordConfirm = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('비밀번호가 일치하지 않아요'))
  } else {
    callback()
  }
}

const rules = {
  userId: [
    { required: true, message: '아이디를 입력해주세요', trigger: 'blur' },
    { min: 4, message: '4자 이상 입력해주세요', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '비밀번호를 입력해주세요', trigger: 'blur' },
    { min: 8, message: '8자 이상 입력해주세요', trigger: 'blur' },
  ],
  passwordConfirm: [
    { required: true, message: '비밀번호를 한 번 더 입력해주세요', trigger: 'blur' },
    { validator: validatePasswordConfirm, trigger: 'blur' },
  ],
  name: [{ required: true, message: '이름을 입력해주세요', trigger: 'blur' }],
}

/* ─────────────────────────────────────────────
   단계 이동
   ───────────────────────────────────────────── */
const goToStep1 = () => {
  currentStep.value = 1
}

const goToStep2 = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      authStore.login(form.name)
      ElMessage.success(`${form.name}님, 가입을 축하해요! 🎉`)
      currentStep.value = 2
    }
  })
}

const goBack = () => {
  currentStep.value -= 1
}

const goHome = () => {
  router.push(link('home'))
}
</script>

<template>
  <div class="signup-page">
    <header class="page-header">
      <h1 class="page-title"><i class="fa-solid fa-user-plus"></i> 회원가입</h1>
      <p class="page-subtitle">날씨 다이어리와 함께할 계정을 만들어보세요</p>
    </header>

    <el-steps :active="currentStep + 1" align-center finish-status="success" class="signup-steps">
      <el-step title="약관 동의" />
      <el-step title="정보 입력" />
      <el-step title="가입 완료" />
    </el-steps>

    <div class="step-panel">
      <!-- STEP 0: 약관 동의 -->
      <div v-if="currentStep === 0" class="step-content">
        <el-checkbox v-model="allAgreed" class="agree-all"> 전체 약관에 동의합니다 </el-checkbox>

        <div class="terms-box">
          <p class="terms-text">
            (필수) 서비스 이용약관에 동의합니다. 본 서비스는 실습용 개인 프로젝트로, 실제 회원
            데이터를 수집·저장하지 않습니다.
          </p>
        </div>
        <el-checkbox v-model="agreeTerms">[필수] 이용약관 동의</el-checkbox>

        <div class="terms-box">
          <p class="terms-text">
            (필수) 회원가입을 위해 아이디, 이름 등 최소한의 정보를 입력받으며, 해당 정보는 브라우저
            화면에만 표시되고 별도 서버에 전송·저장되지 않습니다.
          </p>
        </div>
        <el-checkbox v-model="agreePrivacy">[필수] 개인정보 수집·이용 동의</el-checkbox>

        <el-checkbox v-model="agreeMarketing">[선택] 이벤트·마케팅 정보 수신 동의</el-checkbox>

        <button class="nav-btn primary" :disabled="!allRequiredAgreed" @click="goToStep1">
          다음 <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>

      <!-- STEP 1: 정보 입력 -->
      <div v-else-if="currentStep === 1" class="step-content">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <el-form-item label="아이디" prop="userId">
            <el-input v-model="form.userId" placeholder="4자 이상 입력해주세요" />
          </el-form-item>
          <el-form-item label="비밀번호" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="8자 이상 입력해주세요"
            />
          </el-form-item>
          <el-form-item label="비밀번호 확인" prop="passwordConfirm">
            <el-input
              v-model="form.passwordConfirm"
              type="password"
              show-password
              placeholder="비밀번호를 한 번 더 입력해주세요"
            />
          </el-form-item>
          <el-form-item label="이름" prop="name">
            <el-input v-model="form.name" placeholder="이름을 입력해주세요" />
          </el-form-item>
        </el-form>

        <div class="nav-row">
          <button class="nav-btn ghost" @click="goBack">
            <i class="fa-solid fa-arrow-left"></i> 이전
          </button>
          <button class="nav-btn primary" @click="goToStep2">
            가입하기 <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- STEP 2: 완료 -->
      <div v-else class="step-content complete">
        <div class="complete-icon"><i class="fa-solid fa-circle-check"></i></div>
        <p class="complete-title">{{ form.name }}님, 가입을 축하해요! 🎉</p>
        <p class="complete-desc">
          아이디 <strong>{{ form.userId }}</strong
          >로 가입이 완료됐어요.
        </p>
        <button class="nav-btn primary" @click="goHome">
          <i class="fa-solid fa-house"></i> 홈으로 가기
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.signup-page {
  max-width: 480px;
  margin: 0 auto;
}

.page-header {
  padding: 8px 8px 24px 8px;
  margin-bottom: 24px;
  border-bottom: 2px dashed #f1ecff;
  text-align: center;
}
.page-title {
  margin: 0;
  font-family: 'Jua', 'Pretendard', sans-serif;
  font-size: 24px;
  font-weight: 400;
  color: #45415f;
}
.page-subtitle {
  margin: 6px 0 0 0;
  font-size: 13px;
  color: #a6a0be;
}

.signup-steps {
  margin-bottom: 28px;
}

.step-panel {
  min-height: 280px;
}
.step-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.agree-all {
  padding-bottom: 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid #f1ecff;
  font-weight: 700;
}
.terms-box {
  padding: 12px 14px;
  background-color: #fbfaff;
  border-radius: 12px;
}
.terms-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #7a7590;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav-btn.primary {
  margin-top: 10px;
  background-color: #ff7faa;
  color: #ffffff;
}
.nav-btn.primary:hover:not(:disabled) {
  background-color: #ff5c8a;
}
.nav-btn.primary:disabled {
  background-color: #f1ecff;
  color: #c7c2de;
  cursor: not-allowed;
}
.nav-btn.ghost {
  background-color: #f1ecff;
  color: #45415f;
}
.nav-btn.ghost:hover {
  background-color: #e3ddf7;
}

.nav-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
.nav-row .nav-btn {
  flex: 1;
  margin-top: 0;
}

.complete {
  align-items: center;
  text-align: center;
  padding: 30px 10px;
}
.complete-icon {
  font-size: 56px;
  color: #3fcb94;
  margin-bottom: 6px;
}
.complete-title {
  margin: 0;
  font-family: 'Jua', 'Pretendard', sans-serif;
  font-size: 18px;
  color: #45415f;
}
.complete-desc {
  margin: 4px 0 10px 0;
  font-size: 13px;
  color: #a6a0be;
}
.complete-desc strong {
  color: #ff7faa;
}
.complete .nav-btn {
  width: 100%;
}

.signup-steps {
  --el-color-success: #ff7faa;
  --el-color-primary: #ff7faa;
}
:deep(.el-step__title.is-process),
:deep(.el-step__title.is-finish),
:deep(.el-step__title.is-success) {
  color: #45415f;
  font-weight: 700;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner),
:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: #ff7faa;
  border-color: #ff7faa;
}
:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #ff7faa;
}

:deep(.el-input__wrapper) {
  border-radius: 12px;
}
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #ff7faa inset !important;
}

:deep(.el-form-item__label) {
  font-weight: 700;
  color: #45415f;
}
</style>
