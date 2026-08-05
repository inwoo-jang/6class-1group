import axios from 'axios'

// .env의 VITE_API_BASE_URL이 있으면 사용하고,
// 없으면 로컬 Mock API의 기본 주소를 사용합니다.
const baseURL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const http = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'X-Lab-Client': 'vue-mock-api-sample',
  },
})

// 모든 API 오류를 화면에서 사용하기 쉬운 Error 객체로 통일합니다.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'API 응답 시간이 초과되었습니다.'
        : 'API 서버에 연결할 수 없습니다. npm run dev:all 실행 여부를 확인하세요.')

    return Promise.reject(new Error(message))
  },
)

