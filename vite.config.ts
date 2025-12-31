import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/webhook': {
        target: 'https://www.feishu.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webhook/, '/flow/api/trigger-webhook/db8d94317fd960eec7e22bbfe78ee982')
      }
    }
  }
})
