import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT2 || 5173,
    proxy: {
      '/api': {
        target: 'https://fino-x-change-backend.onrender.com',
        changeOrigin: true,
      }
    }
  }
})
