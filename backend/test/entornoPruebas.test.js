/**
 * Prueba de ejemplo del entorno (HU-31).
 * Muestra el patrón que deben seguir las pruebas del backend: el pool de MySQL
 * se reemplaza con un mock, así que ninguna prueba toca la base de datos real.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest'
import pool from '../src/config/db.js'
import { obtenerContextoOrden } from '../src/models/cotizacionModel.js'
import { mockRequest, mockResponse } from './helpers/http.js'

vi.mock('../src/config/db.js', () => ({
  default: { query: vi.fn(), getConnection: vi.fn() },
}))

describe('Entorno de pruebas del backend', () => {
  beforeEach(() => {
    pool.query.mockReset()
  })

  test('usa variables de entorno ficticias y no las de producción', () => {
    expect(process.env.NODE_ENV).toBe('test')
    expect(process.env.DB_NAME).toBe('techservice_test')
  })

  test('el modelo consulta el pool simulado en lugar de MySQL', async () => {
    pool.query.mockResolvedValue([[{ id: 7, diagnosticoId: 3, clienteUsuarioId: 12 }]])

    const contexto = await obtenerContextoOrden(7)

    expect(contexto).toEqual({ id: 7, diagnosticoId: 3, clienteUsuarioId: 12 })
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('FROM ordenes_servicio'), [7])
  })

  test('el modelo devuelve null cuando el pool simulado no encuentra filas', async () => {
    pool.query.mockResolvedValue([[]])

    expect(await obtenerContextoOrden(99)).toBeNull()
  })

  test('los helpers simulan req y res de Express', () => {
    const req = mockRequest({ params: { ordenId: '5' }, user: { id: 1, rol: 'ADMIN' } })
    const res = mockResponse()

    res.status(404).json({ mensaje: 'No existe' })

    expect(req.params.ordenId).toBe('5')
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'No existe' })
  })
})
