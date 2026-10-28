import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cada prueba inicia con el DOM y el almacenamiento local limpios.
afterEach(() => {
  cleanup()
  localStorage.clear()
})
