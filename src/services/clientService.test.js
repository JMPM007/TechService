/**
 * Pruebas unitarias del servicio de clientes del frontend (HU-07, HU-08 y HU-09).
 * Se simula el cliente HTTP para validar rutas, métodos y parámetros enviados.
 */
import { describe, expect, test, vi } from 'vitest'
import { apiRequest, publicApiRequest } from './api'
import { deleteClient, getClients, registerClient } from './clientService'

vi.mock('./api', () => ({
  apiRequest: vi.fn(),
  publicApiRequest: vi.fn(),
}))

describe('clientService', () => {
  test('getClients consulta todos los clientes cuando no hay búsqueda', () => {
    getClients()

    expect(apiRequest).toHaveBeenCalledWith('/clientes')
  })

  test('getClients codifica el término de búsqueda en la URL', () => {
    getClients('José & Cía')

    expect(apiRequest).toHaveBeenCalledWith('/clientes?search=Jos%C3%A9%20%26%20C%C3%ADa')
  })

  test('registerClient usa el endpoint público con método POST', () => {
    const datos = { nombre: 'Ana', cedula: '123' }

    registerClient(datos)

    expect(publicApiRequest).toHaveBeenCalledWith('/clientes', {
      method: 'POST',
      body: JSON.stringify(datos),
    })
  })

  test('deleteClient elimina el cliente por su id', () => {
    deleteClient(7)

    expect(apiRequest).toHaveBeenCalledWith('/clientes/7', { method: 'DELETE' })
  })
})
