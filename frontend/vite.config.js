import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    host: true,
    port: 5175,
    strictPort: true,
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    copyPublicDir: true,
  }
})