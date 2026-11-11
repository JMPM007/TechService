import { useState } from 'react'
import { getManagementReport } from '../services/reporteService'
import { buildReportCsv, formatStatus, toInputDate } from '../utils/reportCsv'

const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function ReportsPanel() {
  const today = new Date()
  const [desde, setDesde] = useState(() => toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)))
  const [hasta, setHasta] = useState(() => toInputDate(today))
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (desde > hasta) {
      setReport(null)
      setError('La fecha inicial no puede ser posterior a la fecha final.')
      return
    }

    setLoading(true)
    try {
      setReport(await getManagementReport(desde, hasta))
    } catch (requestError) {
      setReport(null)
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  function handleExport() {
    // El BOM hace que Excel reconozca las tildes del archivo UTF-8.
    const blob = new Blob(['﻿', buildReportCsv(report)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-gestion_${report.periodo.desde}_${report.periodo.hasta}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const resumen = report?.resumen

  return (
    <section className="card reports-card">
      <h2>Reporte de gestión por fechas</h2>
      <p>Consulta las órdenes ingresadas en un periodo, su estado, los técnicos asignados y los ingresos por cotizaciones aprobadas.</p>

      <form className="report-filters" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="report-desde">Fecha inicial</label>
          <input id="report-desde" type="date" value={desde} onChange={(event) => setDesde(event.target.value)} required />
        </div>
        <div>
          <label htmlFor="report-hasta">Fecha final</label>
          <input id="report-hasta" type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} required />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Generando...' : 'Generar reporte'}
        </button>
      </form>

      {error && <p className="alert error" role="alert">{error}</p>}

      {report && (
        <>
          <div className="dashboard-toolbar report-toolbar">
            <p className="status-total">
              Periodo: <strong>{report.periodo.desde}</strong> a <strong>{report.periodo.hasta}</strong>
            </p>
            <button type="button" onClick={handleExport} disabled={report.ordenes.length === 0}>
              Exportar a Excel (CSV)
            </button>
          </div>

          {resumen.totalOrdenes === 0 ? (
            <p className="empty-state">No hay órdenes registradas en el periodo seleccionado.</p>
          ) : (
            <>
              <div className="status-grid report-summary">
                <div className="status-tile"><span className="status-count">{resumen.totalOrdenes}</span><span className="status-label">Órdenes ingresadas</span></div>
                <div className="status-tile"><span className="status-count">{resumen.entregadas}</span><span className="status-label">Entregadas</span></div>
                <div className="status-tile"><span className="status-count">{resumen.canceladas}</span><span className="status-label">Canceladas</span></div>
                <div className="status-tile"><span className="status-count">{currency.format(resumen.ingresosAprobados)}</span><span className="status-label">Ingresos por cotizaciones aprobadas</span></div>
                <div className="status-tile"><span className="status-count">{currency.format(resumen.ticketPromedio)}</span><span className="status-label">Valor promedio por cotización</span></div>
              </div>

              <h3>Órdenes por estado</h3>
              <div className="status-grid">
                {report.estados.filter((item) => item.cantidad > 0).map((item) => (
                  <div className="status-tile" key={item.estado}>
                    <span className="status-count">{item.cantidad}</span>
                    <span className="status-label">{formatStatus(item.estado)}</span>
                  </div>
                ))}
              </div>

              <h3>Órdenes por técnico</h3>
              <div className="results-wrapper">
                <table className="results-table">
                  <thead>
                    <tr><th>Técnico</th><th>Órdenes asignadas</th><th>Entregadas</th></tr>
                  </thead>
                  <tbody>
                    {report.tecnicos.map((item) => (
                      <tr key={item.tecnico}>
                        <td>{item.tecnico}</td><td>{item.ordenes}</td><td>{item.entregadas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3>Detalle de órdenes</h3>
              {report.detalleTruncado && (
                <p className="alert error">Se muestran las primeras {report.ordenes.length} órdenes. Reduce el rango de fechas para ver el detalle completo.</p>
              )}
              <div className="results-wrapper">
                <table className="results-table">
                  <thead>
                    <tr><th>Código</th><th>Ingreso</th><th>Cliente</th><th>Equipo</th><th>Técnico</th><th>Estado</th><th>Cotización</th></tr>
                  </thead>
                  <tbody>
                    {report.ordenes.map((orden) => (
                      <tr key={orden.id}>
                        <td>{orden.codigoOrden ?? `#${orden.id}`}</td>
                        <td>{new Date(orden.fechaIngreso).toLocaleDateString('es-CO')}</td>
                        <td>{orden.cliente}</td>
                        <td>{orden.equipo}</td>
                        <td>{orden.tecnico ?? 'Sin asignar'}</td>
                        <td>{formatStatus(orden.estado)}</td>
                        <td>{orden.totalCotizacion === null ? 'Sin cotización' : `${currency.format(orden.totalCotizacion)} (${formatStatus(orden.estadoCotizacion)})`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
