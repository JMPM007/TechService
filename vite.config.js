import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configuración de pruebas del frontend (HU-31). jsdom simula el navegador
  // para poder renderizar componentes y usar localStorage/fetch en las pruebas.
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['./src/test/setup.js'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**'],
      reporter: ['text', 'html'],
    },
  },
})
