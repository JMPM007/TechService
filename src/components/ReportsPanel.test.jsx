import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import ReportsPanel from './ReportsPanel'
import { buildReportCsv } from '../utils/reportCsv'

const report = {
  periodo: { desde: '2026-11-01', hasta: '2026-11-30' },
  resumen: { totalOrdenes: 1, entregadas: 1, canceladas: 0, cotizacionesAprobadas: 1, ingresosAprobados: 150000, ticketPromedio: 150000 },
  estados: [{ estado: 'ENTREGADA', cantidad: 1 }, { estado: 'RECIBIDA', cantidad: 0 }],
  tecnicos: [{ tecnico: 'Laura Gómez', ordenes: 1, entregadas: 1 }],
  ordenes: [{
    id: 4,
    codigoOrden: 'OS-2026-0004',
    fechaIngreso: '2026-11-05T15:00:00.000Z',
    cliente: 'Ana; Torres',
    equipo: 'Portátil Lenovo T14',
    tecnico: null,
    estado: 'ENTREGADA',
    estadoCotizacion: 'APROBADA',
    totalCotizacion: 150000,
  }],
  detalleTruncado: false,
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('buildReportCsv', () => {
  test('genera encabezado y filas separadas por punto y coma, escapando valores', () => {
    const [header, fila] = buildReportCsv(report).split('\r\n')

    expect(header).toBe('Código;Fecha de ingreso;Cliente;Equipo;Técnico;Estado;Cotización;Total cotización')
    expect(fila).toBe('OS-2026-0004;2026-11-05;"Ana; Torres";Portátil Lenovo T14;Sin asignar;Entregada;Aprobada;150000')
  })
})

describe('ReportsPanel', () => {
  test('consulta el periodo elegido y muestra el resumen', async () => {
    localStorage.setItem('techservice_token', 'token-de-prueba')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => report })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<ReportsPanel />)
    await user.clear(screen.getByLabelText('Fecha inicial'))
    await user.type(screen.getByLabelText('Fecha inicial'), '2026-11-01')
    await user.clear(screen.getByLabelText('Fecha final'))
    await user.type(screen.getByLabelText('Fecha final'), '2026-11-30')
    await user.click(screen.getByRole('button', { name: 'Generar reporte' }))

    expect(fetchMock.mock.calls[0][0]).toContain('/reportes/gestion?desde=2026-11-01&hasta=2026-11-30')
    expect(await screen.findByText('Órdenes ingresadas')).toBeInTheDocument()
    expect(screen.getByText('Laura Gómez')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar a Excel (CSV)' })).toBeEnabled()
  })

  test('avisa si la fecha inicial es posterior a la final sin llamar a la API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<ReportsPanel />)
    await user.clear(screen.getByLabelText('Fecha final'))
    await user.type(screen.getByLabelText('Fecha final'), '2026-01-01')
    await user.clear(screen.getByLabelText('Fecha inicial'))
    await user.type(screen.getByLabelText('Fecha inicial'), '2026-02-01')
    await user.click(screen.getByRole('button', { name: 'Generar reporte' }))

    expect(screen.getByRole('alert')).toHaveTextContent('La fecha inicial no puede ser posterior a la fecha final.')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
