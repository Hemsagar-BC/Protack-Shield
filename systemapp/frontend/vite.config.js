import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/status': 'http://localhost:5050',
      '/health': 'http://localhost:5050',
      '/devices': 'http://localhost:5050',
      '/config': 'http://localhost:5050',
    },
  },
  build: {
    outDir: '../static/dist',
    emptyOutDir: true,
  },
})
