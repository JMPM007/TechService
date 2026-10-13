import pool from '../config/db.js'

async function bloquearOrdenYCotizacion(connection, ordenId) {
  const [orders] = await connection.query(
    'SELECT id FROM ordenes_servicio WHERE id = ? FOR UPDATE',
    [ordenId],
  )
  if (!orders.length) return 'NOT_FOUND'

  const [quotes] = await connection.query(
    'SELECT id, estado FROM cotizaciones WHERE orden_id = ? FOR UPDATE',
    [ordenId],
  )
  if (quotes.length && quotes[0].estado !== 'PENDIENTE_APROBACION') return 'LOCKED'
  return quotes[0] || null
}

async function recalcularCotizacion(connection, ordenId) {
  const [quotes] = await connection.query(
    'SELECT id FROM cotizaciones WHERE orden_id = ? LIMIT 1',
    [ordenId],
  )
  if (!quotes.length) return

  const [conceptTotals] = await connection.query(
    `SELECT COALESCE(SUM(cantidad * precio_unitario), 0) AS total
     FROM cotizacion_conceptos WHERE cotizacion_id = ?`,
    [quotes[0].id],
  )
  const [laborTotals] = await connection.query(
    `SELECT COALESCE(SUM(costo), 0) AS total
     FROM servicios_mano_obra WHERE orden_id = ?`,
    [ordenId],
  )
  const total = Number(conceptTotals[0].total) + Number(laborTotals[0].total)
  const roundedTotal = Math.round((total + Number.EPSILON) * 100) / 100
  await connection.query(
    'UPDATE cotizaciones SET subtotal = ?, total = ?, actualizada_en = CURRENT_TIMESTAMP WHERE id = ?',
    [roundedTotal, roundedTotal, quotes[0].id],
  )
}

export async function obtenerServiciosManoObra(ordenId) {
  const [rows] = await pool.query(
    `SELECT s.id, s.orden_id AS ordenId, s.descripcion, s.costo,
      s.tiempo_minutos AS tiempoMinutos, s.registrado_por AS registradoPor,
      u.nombre AS registradoPorNombre, s.creado_en AS creadoEn,
      s.actualizado_en AS actualizadoEn
     FROM servicios_mano_obra s
     INNER JOIN usuarios u ON u.id = s.registrado_por
     WHERE s.orden_id = ?
     ORDER BY s.id ASC`,
    [ordenId],
  )
  return rows
}

export async function crearServicioManoObra({ ordenId, usuarioId, descripcion, costo, tiempoMinutos }) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const quote = await bloquearOrdenYCotizacion(connection, ordenId)
    if (quote === 'NOT_FOUND') {
      await connection.rollback()
      return 'NOT_FOUND'
    }
    if (quote === 'LOCKED') {
      await connection.rollback()
      return 'LOCKED'
    }
    const [result] = await connection.query(
      `INSERT INTO servicios_mano_obra
        (orden_id, descripcion, costo, tiempo_minutos, registrado_por)
       VALUES (?, ?, ?, ?, ?)`,
      [ordenId, descripcion, costo, tiempoMinutos, usuarioId],
    )
    await recalcularCotizacion(connection, ordenId)
    await connection.commit()
    return result.insertId
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function actualizarServicioManoObra({ ordenId, servicioId, descripcion, costo, tiempoMinutos }) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const quote = await bloquearOrdenYCotizacion(connection, ordenId)
    if (quote === 'NOT_FOUND') {
      await connection.rollback()
      return 'NOT_FOUND'
    }
    if (quote === 'LOCKED') {
      await connection.rollback()
      return 'LOCKED'
    }
    const [services] = await connection.query(
      'SELECT id FROM servicios_mano_obra WHERE id = ? AND orden_id = ? FOR UPDATE',
      [servicioId, ordenId],
    )
    if (!services.length) {
      await connection.rollback()
      return 'SERVICE_NOT_FOUND'
    }
    await connection.query(
      `UPDATE servicios_mano_obra
       SET descripcion = ?, costo = ?, tiempo_minutos = ?
       WHERE id = ?`,
      [descripcion, costo, tiempoMinutos, servicioId],
    )
    await recalcularCotizacion(connection, ordenId)
    await connection.commit()
    return 'UPDATED'
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function eliminarServicioManoObra(ordenId, servicioId) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const quote = await bloquearOrdenYCotizacion(connection, ordenId)
    if (quote === 'NOT_FOUND') {
      await connection.rollback()
      return 'NOT_FOUND'
    }
    if (quote === 'LOCKED') {
      await connection.rollback()
      return 'LOCKED'
    }
    const [result] = await connection.query(
      'DELETE FROM servicios_mano_obra WHERE id = ? AND orden_id = ?',
      [servicioId, ordenId],
    )
    if (!result.affectedRows) {
      await connection.rollback()
      return 'SERVICE_NOT_FOUND'
    }
    await recalcularCotizacion(connection, ordenId)
    await connection.commit()
    return 'DELETED'
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}