import pool from '../config/db.js'

export const TIPOS_SERVICIO = [
  'Mantenimiento Preventivo',
  'Mantenimiento Correctivo',
  'Diagnóstico Técnico',
  'Garantía',
  'Instalación Hardware/Software',
]

export const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE']

export async function crearOrdenServicio(data) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const [result] = await connection.query(
      `INSERT INTO ordenes_servicio
        (equipo_id, tecnico_id, motivo_ingreso, tipo_servicio, prioridad,
         estado, costo_estimado, abono_inicial, observaciones_recepcion)
       VALUES (?, ?, ?, ?, ?, 'PENDIENTE', ?, ?, ?)`,
      [data.equipoId, data.tecnicoId || null, data.motivoIngreso, data.tipoServicio, data.prioridad, data.costoEstimado, data.abonoInicial, data.observacionesRecepcion || null],
    )
    await connection.query(
      `INSERT INTO historial_estados_orden
        (orden_id, estado_anterior, estado_nuevo, usuario_id, observacion)
       VALUES (?, NULL, 'PENDIENTE', ?, 'Registro inicial de la orden')`,
      [result.insertId, data.usuarioId],
    )
    const codigoOrden = `OS-${new Date().getFullYear()}-${String(result.insertId).padStart(4, '0')}`
    await connection.query('UPDATE ordenes_servicio SET codigo_orden = ? WHERE id = ?', [codigoOrden, result.insertId])
    await connection.commit()
    return obtenerOrdenServicio(result.insertId)
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function obtenerOrdenServicio(ordenId) {
  const [rows] = await pool.query(
    `SELECT o.*, e.numero_serie AS equipoSerial, e.tipo AS equipoTipo,
      e.marca AS equipoMarca, e.modelo AS equipoModelo,
      c.id AS clienteId, c.nombres, c.apellidos,
      u.nombre AS tecnicoNombre
     FROM ordenes_servicio o
     INNER JOIN equipos e ON e.id = o.equipo_id
     LEFT JOIN clientes c ON c.id = e.cliente_id
     LEFT JOIN tecnicos t ON t.id = o.tecnico_id
     LEFT JOIN usuarios u ON u.id = t.usuario_id OR u.id = o.tecnico_id
     WHERE o.id = ? LIMIT 1`,
    [ordenId],
  )
  return rows[0] || null
}

export async function listarOrdenesServicio({ search = '', estado = '' } = {}) {
  const params = []
  let query = `SELECT o.*, e.numero_serie AS equipoSerial, e.marca AS equipoMarca,
    e.modelo AS equipoModelo, c.nombres, c.apellidos,
    t.id AS tecnicoId, u.nombre AS tecnicoNombre
    FROM ordenes_servicio o
    INNER JOIN equipos e ON e.id = o.equipo_id
    LEFT JOIN clientes c ON c.id = e.cliente_id
    LEFT JOIN tecnicos t ON t.id = o.tecnico_id
    LEFT JOIN usuarios u ON u.id = t.usuario_id
    WHERE 1 = 1`
  if (estado.trim()) {
    query += ' AND o.estado = ?'
    params.push(estado.trim())
  }
  if (search.trim()) {
    const term = `%${search.trim()}%`
    query += ' AND (o.codigo_orden LIKE ? OR e.numero_serie LIKE ? OR e.marca LIKE ? OR e.modelo LIKE ? OR c.nombres LIKE ? OR c.apellidos LIKE ?)'
    params.push(term, term, term, term, term, term)
  }
  query += ' ORDER BY o.id DESC'
  const [rows] = await pool.query(query, params)
  return rows
}

export async function asignarTecnicoAOrden(ordenId, tecnicoId) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const [tecnicos] = await connection.query(
      `SELECT t.id, t.estado FROM tecnicos t
       INNER JOIN usuarios u ON u.id = t.usuario_id
       WHERE t.id = ? AND u.rol = 'TECNICO' LIMIT 1`,
      [tecnicoId],
    )
    if (!tecnicos.length) return 'TECHNICIAN_NOT_FOUND'
    if (tecnicos[0].estado === 'INACTIVO') return 'TECHNICIAN_INACTIVE'

    const [orders] = await connection.query(
      'SELECT id FROM ordenes_servicio WHERE id = ? FOR UPDATE',
      [ordenId],
    )
    if (!orders.length) return 'ORDER_NOT_FOUND'

    await connection.query(
      'UPDATE ordenes_servicio SET tecnico_id = ? WHERE id = ?',
      [tecnicoId, ordenId],
    )
    await connection.commit()
    return 'ASSIGNED'
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}