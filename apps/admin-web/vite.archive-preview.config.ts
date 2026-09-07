import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Isolated local verification only; never proxies to the original 8080 database.
export default defineConfig({
  plugins: [vue()],
  define: { 'import.meta.env.VITE_PROCESS_DAILY_PREVIEW': JSON.stringify('true'), 'import.meta.env.VITE_PROCESS_ARCHIVE_PREVIEW': JSON.stringify('true') },
  server: { host: '127.0.0.1', port: 5186, strictPort: true, proxy: { '/api': 'http://127.0.0.1:8084' } },
})
