import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // بيئة jsdom حتى تُختبر السلة والطلبات كما في المتصفح
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    clearMocks: true,
  },
})
