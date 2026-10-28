/**
 * Pruebas unitarias del controlador de cotizaciones (HU-21 y HU-22).
 * Se valida la lógica de negocio: normalización de conceptos, cálculo del total,
 * permisos del cliente y reglas de cambio de estado. El modelo se simula.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  cambiarEstadoCotizacion,
  consultarCotizacion,
  editarConceptosCotizacion,
  registrarCotizacion,
  registrarDecision,
} from '../src/controllers/cotizacionController.js'
import {
  actualizarConceptosCotizacion,
  actualizarEstadoCotizacion,
  crearCotizacion,
  obtenerContextoOrden,
  obtenerCotizacion,
  registrarDecisionCotizacion,
} from '../src/models/cotizacionModel.js'
import { mockRequest, mockResponse } from './helpers/http.js'

vi.mock('../src/models/cotizacionModel.js', () => ({
  ESTADOS_COTIZACION: ['PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA', 'CANCELADA'],
  TIPOS_CONCEPTO: ['SERVICIO', 'MANO_OBRA', 'REPUESTO'],
  actualizarConceptosCotizacion: vi.fn(),
  actualizarEstadoCotizacion: vi.fn(),
  crearCotizacion: vi.fn(),
  obtenerContextoOrden: vi.fn(),
  obtenerCotizacion: vi.fn(),
  registrarDecisionCotizacion: vi.fn(),
}))

const ADMIN = { id: 1, rol: 'ADMIN' }
const CLIENTE = { id: 20, rol: 'CLIENTE' }

const conceptoValido = {
  tipo: 'SERVICIO',
  descripcion: '  Cambio de pantalla ',
  cantidad: '2',
  precioUnitario: '50000.10',
}

let res

beforeEach(() => {
  res = mockResponse()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('registrarCotizacion', () => {
  test('responde 400 cuando el id de la orden no es un entero positivo', async () => {
    await registrarCotizacion(mockRequest({ params: { ordenId: 'abc' }, body: { conceptos: [conceptoValido] }, user: ADMIN }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(crearCotizacion).not.toHaveBeenCalled()
  })

  test('responde 400 cuando no se envían conceptos', async () => {
    await registrarCotizacion(mockRequest({ params: { ordenId: '3' }, body: { conceptos: [] }, user: ADMIN }), res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  test.each([
    ['tipo inexistente', { ...conceptoValido, tipo: 'OTRO' }],
    ['descripción vacía', { ...conceptoValido, descripcion: '   ' }],
    ['cantidad cero', { ...conceptoValido, cantidad: 0 }],
    ['precio negativo', { ...conceptoValido, precioUnitario: -1 }],
    ['precio no numérico', { ...conceptoValido, precioUnitario: 'gratis' }],
  ])('responde 400 cuando un concepto tiene %s', async (_caso, concepto) => {
    await registrarCotizacion(mockRequest({ params: { ordenId: '3' }, body: { conceptos: [conceptoValido, concepto] }, user: ADMIN }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(obtenerContextoOrden).not.toHaveBeenCalled()
  })

  test('responde 400 cuando la orden no tiene diagnóstico registrado', async () => {
    obtenerContextoOrden.mockResolvedValue(null)

    await registrarCotizacion(mockRequest({ params: { ordenId: '3' }, body: { conceptos: [conceptoValido] }, user: ADMIN }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(crearCotizacion).not.toHaveBeenCalled()
  })

  test('responde 409 cuando la orden ya tiene cotización', async () => {
    obtenerContextoOrden.mockResolvedValue({ id: 3 })
    obtenerCotizacion.mockResolvedValue({ id: 8 })

    await registrarCotizacion(mockRequest({ params: { ordenId: '3' }, body: { conceptos: [conceptoValido] }, user: ADMIN }), res)

    expect(res.status).toHaveBeenCalledWith(409)
  })

  test('normaliza los conceptos y calcula el total redondeado a dos decimales', async () => {
    obtenerContextoOrden.mockResolvedValue({ id: 3 })
    obtenerCotizacion.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 8, total: 100000.2 })
    crearCotizacion.mockResolvedValue(8)
    const conceptos = [conceptoValido, { tipo: 'REPUESTO', descripcion: 'Batería', cantidad: 1, precioUnitario: 0.1, observaciones: ' original ' }]

    await registrarCotizacion(mockRequest({ params: { ordenId: '3' }, body: { conceptos }, user: ADMIN }), res)

    expect(crearCotizacion).toHaveBeenCalledWith({
      ordenId: 3,
      usuarioId: 1,
      conceptos: [
        { tipo: 'SERVICIO', descripcion: 'Cambio de pantalla', cantidad: 2, precioUnitario: 50000.1, observaciones: '' },
        { tipo: 'REPUESTO', descripcion: 'Batería', cantidad: 1, precioUnitario: 0.1, observaciones: 'original' },
      ],
      subtotal: 100000.3,
      total: 100000.3,
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 8 }))
  })

  test('responde 409 cuando la base de datos reporta un registro duplicado', async () => {
    obtenerContextoOrden.mockResolvedValue({ id: 3 })
    obtenerCotizacion.mockResolvedValue(null)
    crearCotizacion.mockRejectedValue(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }))

    await registrarCotizacion(mockRequest({ params: { ordenId: '3' }, body: { conceptos: [conceptoValido] }, user: ADMIN }), res)

    expect(res.status).toHaveBeenCalledWith(409)
  })

  test('responde 500 ante un error inesperado', async () => {
    obtenerContextoOrden.mockRejectedValue(new Error('BD caída'))

    await registrarCotizacion(mockRequest({ params: { ordenId: '3' }, body: { conceptos: [conceptoValido] }, user: ADMIN }), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('consultarCotizacion', () => {
  test('responde 400 con un id de orden inválido', async () => {
    await consultarCotizacion(mockRequest({ params: { ordenId: '0' }, user: ADMIN }), res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('responde 404 cuando la orden no tiene cotización', async () => {
    obtenerCotizacion.mockResolvedValue(null)

    await consultarCotizacion(mockRequest({ params: { ordenId: '3' }, user: ADMIN }), res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  test('un administrador consulta cualquier cotización', async () => {
    obtenerCotizacion.mockResolvedValue({ id: 8, ordenId: 3 })

    await consultarCotizacion(mockRequest({ params: { ordenId: '3' }, user: ADMIN }), res)

    expect(obtenerContextoOrden).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ cotizacion: { id: 8, ordenId: 3 } })
  })

  test('un cliente consulta la cotización de su propia orden', async () => {
    obtenerCotizacion.mockResolvedValue({ id: 8, ordenId: 3 })
    obtenerContextoOrden.mockResolvedValue({ clienteUsuarioId: CLIENTE.id })

    await consultarCotizacion(mockRequest({ params: { ordenId: '3' }, user: CLIENTE }), res)

    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ cotizacion: { id: 8, ordenId: 3 } })
  })

  test('responde 403 cuando un cliente consulta la cotización de otro cliente', async () => {
    obtenerCotizacion.mockResolvedValue({ id: 8, ordenId: 3 })
    obtenerContextoOrden.mockResolvedValue({ clienteUsuarioId: 99 })

    await consultarCotizacion(mockRequest({ params: { ordenId: '3' }, user: CLIENTE }), res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  test('responde 500 ante un error inesperado', async () => {
    obtenerCotizacion.mockRejectedValue(new Error('BD caída'))

    await consultarCotizacion(mockRequest({ params: { ordenId: '3' }, user: ADMIN }), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('editarConceptosCotizacion', () => {
  const req = () => mockRequest({ params: { ordenId: '3' }, body: { conceptos: [conceptoValido] }, user: ADMIN })

  test('responde 400 con conceptos inválidos', async () => {
    await editarConceptosCotizacion(mockRequest({ params: { ordenId: '3' }, body: { conceptos: 'x' }, user: ADMIN }), res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('responde 404 cuando la cotización no existe', async () => {
    actualizarConceptosCotizacion.mockResolvedValue('NOT_FOUND')

    await editarConceptosCotizacion(req(), res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  test('responde 409 cuando la cotización ya no está pendiente', async () => {
    actualizarConceptosCotizacion.mockResolvedValue('LOCKED')

    await editarConceptosCotizacion(req(), res)

    expect(res.status).toHaveBeenCalledWith(409)
  })

  test('actualiza los conceptos de una cotización pendiente', async () => {
    actualizarConceptosCotizacion.mockResolvedValue('OK')
    obtenerCotizacion.mockResolvedValue({ id: 8 })

    await editarConceptosCotizacion(req(), res)

    expect(actualizarConceptosCotizacion).toHaveBeenCalledWith(expect.objectContaining({ ordenId: 3, total: 100000.2 }))
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ cotizacion: { id: 8 } }))
  })

  test('responde 500 ante un error inesperado', async () => {
    actualizarConceptosCotizacion.mockRejectedValue(new Error('BD caída'))

    await editarConceptosCotizacion(req(), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('cambiarEstadoCotizacion', () => {
  const req = (estado) => mockRequest({ params: { ordenId: '3' }, body: { estado }, user: ADMIN })

  test('responde 400 con un estado desconocido', async () => {
    await cambiarEstadoCotizacion(req('PAGADA'), res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('responde 403 si se intenta aprobar desde este endpoint', async () => {
    await cambiarEstadoCotizacion(req('APROBADA'), res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(actualizarEstadoCotizacion).not.toHaveBeenCalled()
  })

  test('responde 404 cuando la cotización no existe', async () => {
    obtenerCotizacion.mockResolvedValue(null)

    await cambiarEstadoCotizacion(req('CANCELADA'), res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  test('responde 409 cuando la cotización ya estaba cancelada', async () => {
    obtenerCotizacion.mockResolvedValue({ estado: 'CANCELADA' })

    await cambiarEstadoCotizacion(req('CANCELADA'), res)

    expect(res.status).toHaveBeenCalledWith(409)
  })

  test('cancela una cotización pendiente', async () => {
    obtenerCotizacion.mockResolvedValue({ estado: 'PENDIENTE_APROBACION' })

    await cambiarEstadoCotizacion(req('CANCELADA'), res)

    expect(actualizarEstadoCotizacion).toHaveBeenCalledWith(3, 'CANCELADA')
    expect(res.status).not.toHaveBeenCalled()
  })

  test('responde 500 ante un error inesperado', async () => {
    obtenerCotizacion.mockRejectedValue(new Error('BD caída'))

    await cambiarEstadoCotizacion(req('CANCELADA'), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('registrarDecision', () => {
  const req = (estado) => mockRequest({ params: { ordenId: '3' }, body: { estado }, user: CLIENTE })

  test('responde 400 cuando la decisión no es APROBADA ni RECHAZADA', async () => {
    await registrarDecision(req('CANCELADA'), res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  test.each([
    ['NOT_FOUND', 404],
    ['FORBIDDEN', 403],
    ['ALREADY_DECIDED', 409],
  ])('cuando el modelo responde %s devuelve %i', async (resultado, status) => {
    registrarDecisionCotizacion.mockResolvedValue(resultado)

    await registrarDecision(req('APROBADA'), res)

    expect(res.status).toHaveBeenCalledWith(status)
  })

  test.each([
    ['APROBADA', 'Cotización aprobada correctamente.'],
    ['RECHAZADA', 'Cotización rechazada correctamente.'],
  ])('registra la decisión %s del cliente propietario', async (estado, mensaje) => {
    registrarDecisionCotizacion.mockResolvedValue('OK')
    obtenerCotizacion.mockResolvedValue({ id: 8, estado })

    await registrarDecision(req(estado), res)

    expect(registrarDecisionCotizacion).toHaveBeenCalledWith({ ordenId: 3, usuarioId: CLIENTE.id, estado })
    expect(res.json).toHaveBeenCalledWith({ mensaje, cotizacion: { id: 8, estado } })
  })

  test('responde 500 ante un error inesperado', async () => {
    registrarDecisionCotizacion.mockRejectedValue(new Error('BD caída'))

    await registrarDecision(req('APROBADA'), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
