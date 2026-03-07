import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9090,
    proxy: {
      '/status': 'http://localhost:5050',
      '/health': 'http://localhost:5050',
      '/devices': 'http://localhost:5050',
      '/config': 'http://localhost:5050',
      '/data': 'http://localhost:5050',
      '/login': 'http://localhost:5050',
      '/iomt': 'http://localhost:5050',
      '/sensors': 'http://localhost:5050',
      '/traffic': 'http://localhost:5050',
      '/cctv': 'http://localhost:5050',
    },
  },
})
