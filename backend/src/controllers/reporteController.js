import { ORDER_STATUSES } from './consultaController.js'
import {
  contarOrdenesPorEstadoEnPeriodo,
  contarOrdenesPorTecnico,
  LIMITE_DETALLE,
  listarOrdenesDelPeriodo,
  obtenerResumenGestion,
} from '../models/reporteModel.js'
import { validateRangoFechas } from '../validators/reporteValidators.js'

// HU-30: reporte de gestión de las órdenes creadas en un rango de fechas (solo ADMIN)
export async function generarReporteGestion(req, res) {
  const validation = validateRangoFechas(req.query)
  if (!validation.valid) {
    return res.status(400).json({ mensaje: validation.message })
  }

  const { desde, hasta } = validation.data

  try {
    const [resumen, porEstado, porTecnico, ordenes] = await Promise.all([
      obtenerResumenGestion(desde, hasta),
      contarOrdenesPorEstadoEnPeriodo(desde, hasta),
      contarOrdenesPorTecnico(desde, hasta),
      listarOrdenesDelPeriodo(desde, hasta),
    ])

    const counts = new Map(porEstado.map((row) => [row.estado, Number(row.cantidad)]))
    const cotizacionesAprobadas = Number(resumen.cotizacionesAprobadas)
    const ingresosAprobados = Number(resumen.ingresosAprobados)

    return res.json({
      periodo: { desde, hasta },
      resumen: {
        totalOrdenes: Number(resumen.totalOrdenes),
        entregadas: Number(resumen.entregadas),
        canceladas: Number(resumen.canceladas),
        cotizacionesAprobadas,
        ingresosAprobados,
        ticketPromedio: cotizacionesAprobadas > 0
          ? Math.round((ingresosAprobados / cotizacionesAprobadas) * 100) / 100
          : 0,
      },
      estados: ORDER_STATUSES.map((estado) => ({ estado, cantidad: counts.get(estado) ?? 0 })),
      tecnicos: porTecnico.map((row) => ({
        tecnico: row.tecnico,
        ordenes: Number(row.ordenes),
        entregadas: Number(row.entregadas),
      })),
      ordenes: ordenes.map((orden) => ({
        ...orden,
        totalCotizacion: orden.totalCotizacion === null ? null : Number(orden.totalCotizacion),
      })),
      detalleTruncado: ordenes.length >= LIMITE_DETALLE,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'Ocurrió un error al generar el reporte.' })
  }
}
