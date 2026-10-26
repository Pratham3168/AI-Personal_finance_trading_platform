import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The dev server proxies /api to the backend, so there are no CORS issues in development.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000, // matches the backend's default CLIENT_URL
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
