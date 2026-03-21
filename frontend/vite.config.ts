import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< HEAD
import path from 'path' // 1. นำเข้าโมดูล path

// https://vite.dev/config/
=======
import path from 'path'

>>>>>>> fe687ab4973be30cfd7184d885fc117760ffb180
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
<<<<<<< HEAD
      // 2. ตั้งค่า alias ให้ชี้ไปที่โฟลเดอร์ src ของเรา
      '@': path.resolve(__dirname, './src'),
    },
  },
=======
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
>>>>>>> fe687ab4973be30cfd7184d885fc117760ffb180
})