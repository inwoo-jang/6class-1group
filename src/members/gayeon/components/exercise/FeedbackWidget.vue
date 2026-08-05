<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const FEEDBACK_KEY = 'weather-diary-feedback'

const loadFeedback = () => {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const feedbackList = ref(loadFeedback())
watch(feedbackList, (val) => localStorage.setItem(FEEDBACK_KEY, JSON.stringify(val)), {
  deep: true,
})

const dialogVisible = ref(false)
const rating = ref(0)
const comment = ref('')

const submitFeedback = () => {
  if (rating.value === 0) {
    ElMessage.warning('별점을 선택해주세요!')
    return
  }

  feedbackList.value.unshift({
    id: Date.now(),
    rating: rating.value,
    comment: comment.value.trim(),
    date: new Date().toLocaleDateString('ko-KR'),
  })

  rating.value = 0
  comment.value = ''
  ElMessage.success('소중한 피드백 감사합니다! 🎉')
}
</script>

<template>
  <button class="feedback-fab" @click="dialogVisible = true">
    <i class="fa-solid fa-comment-dots"></i>
  </button>

  <el-dialog
    v-model="dialogVisible"
    width="90%"
    style="max-width: 420px"
    align-center
    class="cute-dialog"
  >
    <template #header>
      <p class="dialog-title"><i class="fa-solid fa-heart"></i> 피드백 남기기</p>
    </template>

    <div class="feedback-form">
      <p class="form-label">이 서비스는 어떠셨나요?</p>
      <div class="rate-wrap">
        <el-rate
          v-model="rating"
          size="large"
          :colors="['#ffb648', '#ff9f45', '#ff7faa']"
          class="big-rate"
        />
      </div>

      <p class="form-label">자유롭게 의견을 남겨주세요</p>
      <el-input
        v-model="comment"
        type="textarea"
        :rows="3"
        placeholder="예) 검색 필터가 정말 편해요! 도시가 더 있으면 좋겠어요."
        maxlength="200"
        show-word-limit
      />

      <button class="submit-btn" @click="submitFeedback">
        <i class="fa-solid fa-paper-plane"></i> 피드백 제출
      </button>
    </div>

    <el-divider v-if="feedbackList.length > 0"
      >지난 피드백 ({{ feedbackList.length }}건)</el-divider
    >

    <div v-if="feedbackList.length > 0" class="feedback-list">
      <div v-for="item in feedbackList" :key="item.id" class="feedback-item">
        <div class="feedback-item__top">
          <el-rate v-model="item.rating" disabled size="small" />
          <span class="feedback-date">{{ item.date }}</span>
        </div>
        <p v-if="item.comment" class="feedback-comment">{{ item.comment }}</p>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.feedback-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 50;
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 50%;
  background-color: #ff7faa;
  color: #ffffff;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(255, 127, 170, 0.4);
  transition: transform 0.2s ease;
}
.feedback-fab:hover {
  transform: translateY(-3px) scale(1.05);
  background-color: #ff5c8a;
}

.dialog-title {
  margin: 0;
  font-family: 'Jua', 'Pretendard', sans-serif;
  font-size: 18px;
  font-weight: 400;
  color: #45415f;
}
.dialog-title i {
  color: #ff7faa;
  margin-right: 4px;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  margin: 10px 0 4px 0;
  font-size: 13px;
  font-weight: 700;
  color: #45415f;
  font-family: 'Pretendard', sans-serif;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 14px;
  padding: 12px;
  border: none;
  border-radius: 999px;
  background-color: #ff7faa;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  font-family: 'Pretendard', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}
.submit-btn:hover {
  background-color: #ff5c8a;
  transform: translateY(-1px);
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 220px;
  overflow-y: auto;
}
.feedback-item {
  padding: 10px 12px;
  background-color: #fbfaff;
  border-radius: 12px;
}
.feedback-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.feedback-date {
  font-size: 11px;
  color: #a6a0be;
  font-family: 'Pretendard', sans-serif;
}
.feedback-comment {
  margin: 6px 0 0 0;
  font-size: 12px;
  color: #45415f;
  line-height: 1.5;
  font-family: 'Pretendard', sans-serif;
}
</style>

<style>
/* Element Plus는 Teleport로 body 바깥에 렌더링돼서 scoped가 안 먹어요.
   :global 대신 별도 non-scoped 블록으로 다이얼로그 내부를 꾸며요. */
.cute-dialog {
  border-radius: 24px !important;
  padding: 24px !important;
  font-family:
    'Pretendard',
    -apple-system,
    sans-serif;
}
.cute-dialog .el-dialog__header {
  padding: 0 0 12px 0;
  margin: 0;
  border-bottom: 2px dashed #f1ecff;
}
.cute-dialog .el-dialog__headerbtn {
  top: 20px;
  right: 20px;
}
.cute-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #a6a0be;
  font-size: 18px;
}
.cute-dialog .el-dialog__headerbtn .el-dialog__close:hover {
  color: #ff7faa;
}
.cute-dialog .el-dialog__body {
  padding: 16px 0 0 0;
}

/* textarea 포커스 색상을 핑크로 */
.cute-dialog .el-textarea__inner {
  border-radius: 14px;
  font-family: 'Pretendard', sans-serif;
}
.cute-dialog .el-textarea__inner:focus {
  box-shadow: 0 0 0 1px #ff7faa inset !important;
}

/* 구분선 텍스트도 톤 맞추기 */
.cute-dialog .el-divider__text {
  font-size: 12px;
  font-weight: 700;
  color: #a6a0be;
  font-family: 'Pretendard', sans-serif;
}

.rate-wrap {
  display: flex;
  justify-content: center;
  padding: 8px 0 4px 0;
}
.big-rate.el-rate {
  --el-rate-icon-size: 34px;
  --el-rate-icon-margin: 8px;
}
</style>
