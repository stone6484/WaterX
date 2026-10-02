import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Local preview only. Default build and deployment configuration stay unchanged.
export default defineConfig({plugins:[vue()],server:{host:'127.0.0.1',port:5190,strictPort:true,proxy:{'/api':'http://127.0.0.1:8090'}}})
