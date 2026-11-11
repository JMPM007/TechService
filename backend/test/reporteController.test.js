/**
 * Pruebas del reporte de gestión por fechas (HU-30).
 * Cubre la validación del rango y el armado de la respuesta. El modelo se simula.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { generarReporteGestion } from '../src/controllers/reporteController.js'
import {
  contarOrdenesPorEstadoEnPeriodo,
  contarOrdenesPorTecnico,
  listarOrdenesDelPeriodo,
  obtenerResumenGestion,
} from '../src/models/reporteModel.js'
import { validateRangoFechas } from '../src/validators/reporteValidators.js'
import { mockRequest, mockResponse } from './helpers/http.js'

vi.mock('../src/models/reporteModel.js', () => ({
  LIMITE_DETALLE: 3,
  contarOrdenesPorEstadoEnPeriodo: vi.fn(),
  contarOrdenesPorTecnico: vi.fn(),
  listarOrdenesDelPeriodo: vi.fn(),
  obtenerResumenGestion: vi.fn(),
}))

let res

beforeEach(() => {
  res = mockResponse()
})

describe('validateRangoFechas', () => {
  test('acepta un rango válido', () => {
    expect(validateRangoFechas({ desde: '2026-11-01', hasta: '2026-11-30' }))
      .toEqual({ valid: true, data: { desde: '2026-11-01', hasta: '2026-11-30' } })
  })

  test('acepta un solo día', () => {
    expect(validateRangoFechas({ desde: '2026-11-11', hasta: '2026-11-11' }).valid).toBe(true)
  })

  test.each([
    ['sin fechas', {}],
    ['sin fecha final', { desde: '2026-11-01' }],
    ['formato distinto', { desde: '01/11/2026', hasta: '2026-11-30' }],
    ['fecha inexistente', { desde: '2026-02-30', hasta: '2026-03-10' }],
    ['inicio posterior al final', { desde: '2026-12-01', hasta: '2026-11-01' }],
    ['rango de más de 366 días', { desde: '2025-01-01', hasta: '2026-01-03' }],
  ])('rechaza %s', (_caso, query) => {
    expect(validateRangoFechas(query).valid).toBe(false)
  })
})

describe('generarReporteGestion', () => {
  test('responde 400 y no consulta la BD si el rango es inválido', async () => {
    await generarReporteGestion(mockRequest({ query: { desde: '2026-12-01', hasta: '2026-11-01' } }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(obtenerResumenGestion).not.toHaveBeenCalled()
  })

  test('arma el reporte con resumen, estados, técnicos y detalle', async () => {
    obtenerResumenGestion.mockResolvedValue({
      totalOrdenes: 4, entregadas: '2', canceladas: '1', cotizacionesAprobadas: '2', ingresosAprobados: '350000.00',
    })
    contarOrdenesPorEstadoEnPeriodo.mockResolvedValue([
      { estado: 'ENTREGADA', cantidad: 2 },
      { estado: 'CANCELADA', cantidad: 1 },
      { estado: 'EN_REPARACION', cantidad: 1 },
    ])
    contarOrdenesPorTecnico.mockResolvedValue([{ tecnico: 'Laura Gómez', ordenes: 3, entregadas: '2' }])
    listarOrdenesDelPeriodo.mockResolvedValue([
      { id: 9, codigoOrden: 'OS-2026-0009', estado: 'ENTREGADA', totalCotizacion: '200000.00' },
      { id: 8, codigoOrden: 'OS-2026-0008', estado: 'CANCELADA', totalCotizacion: null },
    ])

    await generarReporteGestion(mockRequest({ query: { desde: '2026-11-01', hasta: '2026-11-30' } }), res)

    expect(obtenerResumenGestion).toHaveBeenCalledWith('2026-11-01', '2026-11-30')
    const body = res.json.mock.calls[0][0]
    expect(body.periodo).toEqual({ desde: '2026-11-01', hasta: '2026-11-30' })
    expect(body.resumen).toEqual({
      totalOrdenes: 4,
      entregadas: 2,
      canceladas: 1,
      cotizacionesAprobadas: 2,
      ingresosAprobados: 350000,
      ticketPromedio: 175000,
    })
    expect(body.estados).toHaveLength(10)
    expect(body.estados.find((item) => item.estado === 'ENTREGADA').cantidad).toBe(2)
    expect(body.estados.find((item) => item.estado === 'RECIBIDA').cantidad).toBe(0)
    expect(body.tecnicos).toEqual([{ tecnico: 'Laura Gómez', ordenes: 3, entregadas: 2 }])
    expect(body.ordenes[0].totalCotizacion).toBe(200000)
    expect(body.ordenes[1].totalCotizacion).toBeNull()
    expect(body.detalleTruncado).toBe(false)
  })

  test('el ticket promedio es 0 cuando no hay cotizaciones aprobadas', async () => {
    obtenerResumenGestion.mockResolvedValue({
      totalOrdenes: 0, entregadas: 0, canceladas: 0, cotizacionesAprobadas: 0, ingresosAprobados: 0,
    })
    contarOrdenesPorEstadoEnPeriodo.mockResolvedValue([])
    contarOrdenesPorTecnico.mockResolvedValue([])
    listarOrdenesDelPeriodo.mockResolvedValue([])

    await generarReporteGestion(mockRequest({ query: { desde: '2026-11-01', hasta: '2026-11-30' } }), res)

    const body = res.json.mock.calls[0][0]
    expect(body.resumen.ticketPromedio).toBe(0)
    expect(body.ordenes).toEqual([])
  })

  test('marca el detalle como truncado al llegar al límite de filas', async () => {
    obtenerResumenGestion.mockResolvedValue({
      totalOrdenes: 5, entregadas: 0, canceladas: 0, cotizacionesAprobadas: 0, ingresosAprobados: 0,
    })
    contarOrdenesPorEstadoEnPeriodo.mockResolvedValue([])
    contarOrdenesPorTecnico.mockResolvedValue([])
    listarOrdenesDelPeriodo.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }].map((o) => ({ ...o, totalCotizacion: null })))

    await generarReporteGestion(mockRequest({ query: { desde: '2026-11-01', hasta: '2026-11-30' } }), res)

    expect(res.json.mock.calls[0][0].detalleTruncado).toBe(true)
  })

  test('responde 500 si falla la consulta', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    obtenerResumenGestion.mockRejectedValue(new Error('BD caída'))
    contarOrdenesPorEstadoEnPeriodo.mockResolvedValue([])
    contarOrdenesPorTecnico.mockResolvedValue([])
    listarOrdenesDelPeriodo.mockResolvedValue([])

    await generarReporteGestion(mockRequest({ query: { desde: '2026-11-01', hasta: '2026-11-30' } }), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
