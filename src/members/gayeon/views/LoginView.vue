<script setup>
import { ref, reactive } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { link } from '../routes'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/members/gayeon/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref(null)
const form = reactive({ userId: '', password: '' })

const rules = {
  userId: [{ required: true, message: '아이디를 입력해주세요', trigger: 'blur' }],
  password: [{ required: true, message: '비밀번호를 입력해주세요', trigger: 'blur' }],
}

const handleLogin = () => {
  formRef.value.validate((valid) => {
    if (!valid) return
    authStore.login(form.userId)
    ElMessage.success(`${form.userId}님, 환영해요! 🎉`)
    router.push(link('home'))
  })
}
</script>

<template>
  <div class="login-page">
    <header class="page-header">
      <h1 class="page-title"><i class="fa-solid fa-right-to-bracket"></i> 로그인</h1>
      <p class="page-subtitle">다시 만나서 반가워요!</p>
    </header>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="아이디" prop="userId">
        <el-input v-model="form.userId" placeholder="아이디를 입력해주세요" />
      </el-form-item>
      <el-form-item label="비밀번호" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          placeholder="비밀번호를 입력해주세요"
          @keyup.enter="handleLogin"
        />
      </el-form-item>
    </el-form>

    <button class="login-btn" @click="handleLogin">
      <i class="fa-solid fa-right-to-bracket"></i> 로그인
    </button>

    <p class="signup-hint">
      아직 계정이 없으신가요?
      <RouterLink :to="link('signup')" class="signup-link">회원가입</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.login-page {
  max-width: 400px;
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

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  border: none;
  border-radius: 999px;
  background-color: #ff7faa;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.login-btn:hover {
  background-color: #ff5c8a;
}

.signup-hint {
  margin: 18px 0 0 0;
  text-align: center;
  font-size: 12px;
  color: #a6a0be;
}
.signup-link {
  color: #ff7faa;
  font-weight: 700;
  text-decoration: none;
}
.signup-link:hover {
  text-decoration: underline;
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
