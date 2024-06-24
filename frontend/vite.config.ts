import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dir, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target:
          process.env.NODE_ENV === 'production'
            ? 'https://expense-tracker-backend-112a.onrender.com'
            : 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
