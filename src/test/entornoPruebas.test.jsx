/**
 * Prueba de ejemplo del entorno (HU-31).
 * Muestra el patrón para el frontend: fetch se reemplaza con un mock para no
 * depender del backend, y los componentes se renderizan sobre jsdom.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { publicApiRequest } from '../services/api'

describe('Entorno de pruebas del frontend', () => {
  test('renderiza componentes de React sobre jsdom', () => {
    render(<h1>TechService</h1>)

    expect(screen.getByRole('heading', { name: 'TechService' })).toBeInTheDocument()
  })

  test('las llamadas a la API usan un fetch simulado', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ mensaje: 'ok' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const respuesta = await publicApiRequest('/salud')

    expect(respuesta).toEqual({ mensaje: 'ok' })
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/salud', expect.any(Object))
    vi.unstubAllGlobals()
  })
})
