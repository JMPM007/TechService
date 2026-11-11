export function toInputDate(date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export function formatStatus(value) {
  const text = value.replaceAll('_', ' ')
  return text.charAt(0) + text.slice(1).toLowerCase()
}

function escapeCsv(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[";\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

// Punto y coma como separador para que Excel en español abra las columnas correctamente.
export function buildReportCsv(report) {
  const header = ['Código', 'Fecha de ingreso', 'Cliente', 'Equipo', 'Técnico', 'Estado', 'Cotización', 'Total cotización']
  const rows = report.ordenes.map((orden) => [
    orden.codigoOrden ?? `#${orden.id}`,
    orden.fechaIngreso ? toInputDate(new Date(orden.fechaIngreso)) : '',
    orden.cliente,
    orden.equipo,
    orden.tecnico ?? 'Sin asignar',
    formatStatus(orden.estado),
    orden.estadoCotizacion ? formatStatus(orden.estadoCotizacion) : 'Sin cotización',
    orden.totalCotizacion ?? '',
  ])
  return [header, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\r\n')
}
