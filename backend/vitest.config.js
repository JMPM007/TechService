import { defineConfig } from 'vitest/config'

// Configuración de pruebas del backend (HU-31).
// Las pruebas nunca deben conectarse a la base de datos real: los módulos que
// acceden a MySQL se reemplazan con vi.mock('../src/config/db.js') o mockeando
// el modelo correspondiente. Las variables de entorno de abajo son valores
// ficticios que solo existen durante la ejecución de las pruebas.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    clearMocks: true,
    restoreMocks: true,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'jwt-secret-de-pruebas',
      DB_HOST: '127.0.0.1',
      DB_USER: 'test',
      DB_PASSWORD: 'test',
      DB_NAME: 'techservice_test',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/index.js', 'src/config/**', 'src/routes/**'],
      reporter: ['text', 'html'],
    },
  },
})
