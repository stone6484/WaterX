import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Both professional workflows share one isolated server and the same virtual people.
export default defineConfig({
  plugins: [vue()],
  define: { 'import.meta.env.VITE_PROCESS_DAILY_PREVIEW': JSON.stringify('true'), 'import.meta.env.VITE_PROCESS_ARCHIVE_PREVIEW': JSON.stringify('true') },
  server: { host: '127.0.0.1', port: 5187, strictPort: true, proxy: { '/api': 'http://127.0.0.1:8085' } },
})
