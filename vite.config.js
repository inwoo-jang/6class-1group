import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 하위 경로에 올릴 때만 base 를 붙인다.
// 저장소 이름이 다르면 아래 한 줄만 고치면 된다.
const REPO = '/6class-1group/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? REPO : '/',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    /*
     * 개발 중 /api 로 나가는 요청을 mock 서버(3001)로 넘긴다.
     * 주소를 화면에 박아 두지 않으므로, dev 포트가 밀려도 그대로 동작한다.
     * 서버는 `npm run api` 로 따로 띄운다.
     */
    proxy: {
      '^/api/(auth|fortune-records|health|reset)': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}))
