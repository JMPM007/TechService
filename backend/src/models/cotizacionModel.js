import pool from '../config/db.js'

export const ESTADOS_COTIZACION = [
  'PENDIENTE_APROBACION',
  'APROBADA',
  'RECHAZADA',
  'CANCELADA',
]

export const TIPOS_CONCEPTO = ['SERVICIO', 'MANO_OBRA', 'REPUESTO']

export async function obtenerContextoOrden(ordenId) {
  const [rows] = await pool.query(
    `SELECT o.id, d.id AS diagnosticoId, c.usuario_id AS clienteUsuarioId
     FROM ordenes_servicio o
     INNER JOIN diagnosticos_orden d ON d.orden_id = o.id
     INNER JOIN equipos e ON e.id = o.equipo_id
     INNER JOIN clientes c ON c.id = e.cliente_id
     WHERE o.id = ?
     LIMIT 1`,
    [ordenId],
  )
  return rows[0] || null
}

export async function crearCotizacion({ ordenId, usuarioId, conceptos, subtotal, total }) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const [quoteResult] = await connection.query(
      'INSERT INTO cotizaciones (orden_id, creado_por, subtotal, total) VALUES (?, ?, ?, ?)',
      [ordenId, usuarioId, subtotal, total],
    )

    for (const concepto of conceptos) {
      await connection.query(
        `INSERT INTO cotizacion_conceptos
          (cotizacion_id, tipo, descripcion, cantidad, precio_unitario, observaciones)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          quoteResult.insertId,
          concepto.tipo,
          concepto.descripcion,
          concepto.cantidad,
          concepto.precioUnitario,
          concepto.observaciones || null,
        ],
      )
    }

    await connection.commit()
    return quoteResult.insertId
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function obtenerCotizacion(ordenId) {
  const [quotes] = await pool.query(
    `SELECT c.id, c.orden_id AS ordenId, c.estado, c.subtotal, c.total,
      c.creado_por AS creadoPor, u.nombre AS creadorNombre,
      c.creada_en AS creadaEn, c.actualizada_en AS actualizadaEn,
      e.id AS equipoId, e.tipo AS equipoTipo, e.marca AS equipoMarca,
      e.modelo AS equipoModelo, cl.id AS clienteId,
      cl.nombres, cl.apellidos
     FROM cotizaciones c
     INNER JOIN usuarios u ON u.id = c.creado_por
     INNER JOIN ordenes_servicio o ON o.id = c.orden_id
     INNER JOIN equipos e ON e.id = o.equipo_id
     INNER JOIN clientes cl ON cl.id = e.cliente_id
     WHERE c.orden_id = ?
     LIMIT 1`,
    [ordenId],
  )
  if (!quotes.length) return null

  const [conceptos] = await pool.query(
    `SELECT id, tipo, descripcion, cantidad,
      precio_unitario AS precioUnitario, observaciones
     FROM cotizacion_conceptos
     WHERE cotizacion_id = ?
     ORDER BY id ASC`,
    [quotes[0].id],
  )
  return { ...quotes[0], conceptos }
}

export async function actualizarConceptosCotizacion({ ordenId, conceptos, subtotal, total }) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const [quotes] = await connection.query(
      'SELECT id, estado FROM cotizaciones WHERE orden_id = ? FOR UPDATE',
      [ordenId],
    )
    if (!quotes.length) {
      await connection.rollback()
      return 'NOT_FOUND'
    }
    if (quotes[0].estado !== 'PENDIENTE_APROBACION') {
      await connection.rollback()
      return 'LOCKED'
    }

    await connection.query('DELETE FROM cotizacion_conceptos WHERE cotizacion_id = ?', [quotes[0].id])
    for (const concepto of conceptos) {
      await connection.query(
        `INSERT INTO cotizacion_conceptos
          (cotizacion_id, tipo, descripcion, cantidad, precio_unitario, observaciones)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [quotes[0].id, concepto.tipo, concepto.descripcion, concepto.cantidad, concepto.precioUnitario, concepto.observaciones || null],
      )
    }
    await connection.query(
      'UPDATE cotizaciones SET subtotal = ?, total = ? WHERE id = ?',
      [subtotal, total, quotes[0].id],
    )
    await connection.commit()
    return 'UPDATED'
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function actualizarEstadoCotizacion(ordenId, estado) {
  const [result] = await pool.query(
    'UPDATE cotizaciones SET estado = ? WHERE orden_id = ? AND estado <> ? AND estado <> ?',
    [estado, ordenId, 'CANCELADA', estado],
  )
  return result.affectedRows
}
