import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

// 전역 상태 저장소 — 팀원별 Store 는 각자 id 로 나뉘므로 서로 섞이지 않는다
app.use(createPinia())

// UI 라이브러리. CSS 는 assets/main.css 보다 먼저 불러야 갤러리 디자인이 위에 덮인다
app.use(ElementPlus)

app.use(router)
app.mount('#app')
