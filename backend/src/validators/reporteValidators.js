const datePattern = /^\d{4}-\d{2}-\d{2}$/
export const MAX_DIAS_RANGO = 366

function parseDate(value) {
  if (typeof value !== 'string' || !datePattern.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  // Descarta fechas inexistentes como 2026-02-30, que Date desplaza al mes siguiente.
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

export function validateRangoFechas(query) {
  const desde = typeof query?.desde === 'string' ? query.desde.trim() : ''
  const hasta = typeof query?.hasta === 'string' ? query.hasta.trim() : ''

  if (!desde || !hasta) {
    return { valid: false, message: 'Selecciona la fecha inicial y la fecha final del reporte.' }
  }

  const fechaDesde = parseDate(desde)
  const fechaHasta = parseDate(hasta)
  if (!fechaDesde || !fechaHasta) {
    return { valid: false, message: 'Las fechas deben tener el formato AAAA-MM-DD y ser válidas.' }
  }
  if (fechaDesde > fechaHasta) {
    return { valid: false, message: 'La fecha inicial no puede ser posterior a la fecha final.' }
  }

  const dias = (fechaHasta - fechaDesde) / 86_400_000 + 1
  if (dias > MAX_DIAS_RANGO) {
    return { valid: false, message: `El rango del reporte no puede superar ${MAX_DIAS_RANGO} días.` }
  }

  return { valid: true, data: { desde, hasta } }
}
