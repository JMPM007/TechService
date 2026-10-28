/**
 * Pruebas unitarias del cliente HTTP del frontend (HU-32).
 * fetch se simula para validar encabezados, token y manejo de errores sin backend.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { ApiError, apiRequest, publicApiRequest } from './api'

const API = 'http://localhost:3000/api'

function respuesta({ ok = true, status = 200, body = {} } = {}) {
  return { ok, status, json: () => Promise.resolve(body) }
}

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(respuesta({ body: { ok: true } }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiRequest (requiere sesión)', () => {
  test('lanza ApiError 401 sin llamar a la API cuando no hay token', async () => {
    await expect(apiRequest('/clientes')).rejects.toMatchObject({ name: 'ApiError', status: 401 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('envía el token guardado en el encabezado Authorization', async () => {
    localStorage.setItem('techservice_token', 'abc123')

    await apiRequest('/clientes')

    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toBe(`${API}/clientes`)
    expect(opciones.headers.get('Authorization')).toBe('Bearer abc123')
    expect(opciones.headers.has('Content-Type')).toBe(false)
  })

  test('agrega Content-Type JSON cuando la petición tiene cuerpo', async () => {
    localStorage.setItem('techservice_token', 'abc123')

    await apiRequest('/clientes', { method: 'POST', body: JSON.stringify({ nombre: 'Ana' }) })

    const [, opciones] = fetchMock.mock.calls[0]
    expect(opciones.method).toBe('POST')
    expect(opciones.headers.get('Content-Type')).toBe('application/json')
  })
})

describe('publicApiRequest (sin sesión)', () => {
  test('no exige token ni envía Authorization', async () => {
    const data = await publicApiRequest('/consultas/orden/ORD-1')

    expect(data).toEqual({ ok: true })
    expect(fetchMock.mock.calls[0][1].headers.has('Authorization')).toBe(false)
  })

  test('lanza ApiError con estado 0 cuando el backend no responde', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await publicApiRequest('/salud').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
    expect(error.message).toMatch(/No se pudo conectar con la API/)
  })

  test('usa el mensaje del backend y concatena los detalles de validación', async () => {
    fetchMock.mockResolvedValue(respuesta({
      ok: false,
      status: 400,
      body: { mensaje: 'Datos inválidos.', detalles: ['Falta el nombre.', 'Correo inválido.'] },
    }))

    await expect(publicApiRequest('/clientes')).rejects.toMatchObject({
      status: 400,
      message: 'Datos inválidos. Falta el nombre. Correo inválido.',
    })
  })

  test('usa el campo error cuando el backend no envía mensaje', async () => {
    fetchMock.mockResolvedValue(respuesta({ ok: false, status: 409, body: { error: 'Ya existe.' } }))

    await expect(publicApiRequest('/repuestos')).rejects.toMatchObject({ status: 409, message: 'Ya existe.' })
  })

  test('usa un mensaje genérico cuando la respuesta de error no es JSON', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: () => Promise.reject(new SyntaxError('no json')) })

    await expect(publicApiRequest('/clientes')).rejects.toMatchObject({
      status: 500,
      message: 'No fue posible procesar la solicitud.',
    })
  })
})
