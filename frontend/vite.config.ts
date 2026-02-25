import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // 1. นำเข้าโมดูล path

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 2. ตั้งค่า alias ให้ชี้ไปที่โฟลเดอร์ src ของเรา
      '@': path.resolve(__dirname, './src'),
    },
  },
})