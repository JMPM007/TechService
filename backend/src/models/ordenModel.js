import pool from '../config/db.js'

export const ESTADOS_ORDEN = [
  'RECIBIDA',
  'EN_REVISION',
  'EN_REPARACION',
  'REPARADA',
  'ENTREGADA',
  'CANCELADA',
]

export async function crearOrden({ equipoId, usuarioId, observacion }) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const [ordenResult] = await connection.query(
      'INSERT INTO ordenes_servicio (equipo_id) VALUES (?)',
      [equipoId],
    )
    await connection.query(
      `INSERT INTO historial_estados_orden
        (orden_id, estado_anterior, estado_nuevo, usuario_id, observacion)
        VALUES (?, NULL, 'RECIBIDA', ?, ?)`,
      [ordenResult.insertId, usuarioId, observacion || null],
    )
    await connection.commit()
    return ordenResult.insertId
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function obtenerOrden(ordenId) {
  const [rows] = await pool.query(
    `SELECT o.id, o.equipo_id AS equipoId, o.estado, o.creada_en AS creadaEn,
      e.tipo, e.marca, e.modelo, e.numero_serie AS numeroSerie,
      c.id AS clienteId, c.nombres, c.apellidos
     FROM ordenes_servicio o
     INNER JOIN equipos e ON e.id = o.equipo_id
     INNER JOIN clientes c ON c.id = e.cliente_id
      WHERE o.id = ? OR o.codigo_orden = ?`,
    [ordenId, ordenId],
  )
  return rows[0] || null
}

export async function cambiarEstadoOrden({ ordenId, estadoNuevo, usuarioId, observacion }) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const [ordenes] = await connection.query(
      'SELECT estado FROM ordenes_servicio WHERE id = ? FOR UPDATE',
      [ordenId],
    )
    if (!ordenes.length) {
      await connection.rollback()
      return null
    }

    const estadoAnterior = ordenes[0].estado
    if (estadoAnterior === estadoNuevo) {
      const error = new Error('El nuevo estado debe ser diferente al estado actual.')
      error.code = 'SAME_STATUS'
      throw error
    }

    await connection.query(
      'UPDATE ordenes_servicio SET estado = ? WHERE id = ?',
      [estadoNuevo, ordenId],
    )
    await connection.query(
      `INSERT INTO historial_estados_orden
        (orden_id, estado_anterior, estado_nuevo, usuario_id, observacion)
        VALUES (?, ?, ?, ?, ?)`,
      [ordenId, estadoAnterior, estadoNuevo, usuarioId, observacion || null],
    )
    await connection.commit()
    return { estadoAnterior, estadoNuevo }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function obtenerHistorialOrden(ordenId) {
  const [rows] = await pool.query(
    `SELECT h.id, h.estado_anterior AS estadoAnterior,
      h.estado_nuevo AS estadoNuevo, h.observacion,
      h.creado_en AS creadoEn, h.usuario_id AS usuarioId, u.nombre AS usuarioNombre
     FROM historial_estados_orden h
     INNER JOIN usuarios u ON u.id = h.usuario_id
     WHERE h.orden_id = ?
     ORDER BY h.creado_en ASC, h.id ASC`,
    [ordenId],
  )
  return rows
}

export async function obtenerOrdenPorReferencia(referencia) {
  const [rows] = await pool.query(
    'SELECT id FROM ordenes_servicio WHERE id = ? OR codigo_orden = ? LIMIT 1',
    [referencia, referencia],
  )
  return rows[0] || null
}

export async function registrarEstadoInicial(ordenId, usuarioId, estado = 'PENDIENTE') {
  await pool.query(
    `INSERT INTO historial_estados_orden
      (orden_id, estado_anterior, estado_nuevo, usuario_id, observacion)
     SELECT ?, NULL, ?, ?, 'Registro inicial de la orden'
     WHERE NOT EXISTS (
       SELECT 1 FROM historial_estados_orden WHERE orden_id = ?
     )`,
    [ordenId, estado, usuarioId, ordenId],
  )
}
