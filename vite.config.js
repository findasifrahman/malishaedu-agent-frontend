import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  // Fix for Railway build: use temp directory for cache
  cacheDir: process.env.RAILWAY_ENVIRONMENT ? '/tmp/.vite' : 'node_modules/.vite',
  build: {
    // Clear output directory before build
    emptyOutDir: true
  }
})

