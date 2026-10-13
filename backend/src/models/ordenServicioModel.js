import pool from '../config/db.js'

export const ESTADOS_ORDEN = [
  'RECIBIDA',
  'PENDIENTE',
  'EN_REVISION',
  'EN_REPARACION',
  'EN_PROCESO',
  'EN_ESPERA_REPUESTO',
  'REPARADA',
  'COMPLETADO',
  'ENTREGADA',
  'CANCELADA',
]

export const TIPOS_SERVICIO = [
  'Mantenimiento Preventivo',
  'Mantenimiento Correctivo',
  'Diagnóstico Técnico',
  'Garantía',
  'Instalación Hardware/Software',
]

export const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE']

export function codigoOrdenParaId(id) {
  return `OS-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`
}

export async function crearOrden({ equipoId, usuarioId, observacion }) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [result] = await connection.query(
      `INSERT INTO ordenes_servicio (equipo_id, estado)
       VALUES (?, 'RECIBIDA')`,
      [equipoId],
    )
    const ordenId = result.insertId
    await connection.query(
      'UPDATE ordenes_servicio SET codigo_orden = ? WHERE id = ?',
      [codigoOrdenParaId(ordenId), ordenId],
    )
    await connection.query(
      `INSERT INTO historial_estados_orden
        (orden_id, estado_anterior, estado_nuevo, usuario_id, observacion)
       VALUES (?, NULL, 'RECIBIDA', ?, ?)`,
      [ordenId, usuarioId, observacion || null],
    )
    await connection.commit()
    return ordenId
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function crearOrdenServicio(data) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [result] = await connection.query(
      `INSERT INTO ordenes_servicio
        (equipo_id, tecnico_id, motivo_ingreso, tipo_servicio, prioridad,
         estado, costo_estimado, abono_inicial, observaciones_recepcion)
       VALUES (?, ?, ?, ?, ?, 'PENDIENTE', ?, ?, ?)`,
      [
        data.equipoId,
        data.tecnicoId || null,
        data.motivoIngreso,
        data.tipoServicio,
        data.prioridad,
        data.costoEstimado,
        data.abonoInicial,
        data.observacionesRecepcion || null,
      ],
    )
    const ordenId = result.insertId
    await connection.query(
      'UPDATE ordenes_servicio SET codigo_orden = ? WHERE id = ?',
      [codigoOrdenParaId(ordenId), ordenId],
    )
    await connection.query(
      `INSERT INTO historial_estados_orden
        (orden_id, estado_anterior, estado_nuevo, usuario_id, observacion)
       VALUES (?, NULL, 'PENDIENTE', ?, ?)`,
      [ordenId, data.usuarioId, 'Registro inicial de la orden'],
    )
    await connection.commit()
    return obtenerOrdenServicio(ordenId)
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
      t.id AS tecnicoId, u.nombre AS tecnicoNombre
     FROM ordenes_servicio o
     INNER JOIN equipos e ON e.id = o.equipo_id
     LEFT JOIN clientes c ON c.id = e.cliente_id
     LEFT JOIN tecnicos t ON t.id = o.tecnico_id
     LEFT JOIN usuarios u ON u.id = t.usuario_id
     WHERE o.id = ? LIMIT 1`,
    [ordenId],
  )
  return rows[0] || null
}

export async function obtenerOrden(ordenId) {
  return obtenerOrdenServicio(ordenId)
}

export async function obtenerOrdenPorReferencia(referencia) {
  const [rows] = await pool.query(
    'SELECT id FROM ordenes_servicio WHERE id = ? OR codigo_orden = ? LIMIT 1',
    [referencia, referencia],
  )
  return rows[0] || null
}

export async function listarOrdenesServicio({ search = '', estado = '' } = {}) {
  const params = []
  let query = `SELECT o.*, e.numero_serie AS equipoSerial, e.marca AS equipoMarca,
    e.modelo AS equipoModelo, e.tipo AS equipoTipo, c.nombres, c.apellidos,
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
    query += ` AND (o.codigo_orden LIKE ? OR e.numero_serie LIKE ? OR e.marca LIKE ?
      OR e.modelo LIKE ? OR c.nombres LIKE ? OR c.apellidos LIKE ?)`
    params.push(term, term, term, term, term, term)
  }
  query += ' ORDER BY o.id DESC'
  const [rows] = await pool.query(query, params)
  return rows
}

export async function cambiarEstadoOrden({ ordenId, estadoNuevo, usuarioId, observacion }) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [orders] = await connection.query(
      'SELECT estado FROM ordenes_servicio WHERE id = ? FOR UPDATE',
      [ordenId],
    )
    if (!orders.length) {
      await connection.rollback()
      return null
    }
    const estadoAnterior = orders[0].estado
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

export async function asignarTecnicoAOrden(ordenId, tecnicoId) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [technicians] = await connection.query(
      `SELECT t.id, t.estado FROM tecnicos t
       INNER JOIN usuarios u ON u.id = t.usuario_id
       WHERE t.id = ? AND u.rol = 'TECNICO' LIMIT 1`,
      [tecnicoId],
    )
    if (!technicians.length) {
      await connection.rollback()
      return 'TECHNICIAN_NOT_FOUND'
    }
    if (technicians[0].estado === 'INACTIVO') {
      await connection.rollback()
      return 'TECHNICIAN_INACTIVE'
    }
    const [orders] = await connection.query(
      'SELECT id FROM ordenes_servicio WHERE id = ? FOR UPDATE',
      [ordenId],
    )
    if (!orders.length) {
      await connection.rollback()
      return 'ORDER_NOT_FOUND'
    }
    await connection.query(
      `UPDATE ordenes_servicio
       SET tecnico_id = ?, fecha_asignacion = CURRENT_TIMESTAMP
       WHERE id = ?`,
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

export async function cerrarOrdenDefinitivamente(ordenId, observaciones, usuarioId) {
  return cambiarEstadoOrden({
    ordenId,
    estadoNuevo: 'COMPLETADO',
    usuarioId,
    observacion: observaciones,
  })
}

export const OrdenServicioModel = {
  async generateCodigoOrden() {
    const [rows] = await pool.query(
      `SELECT codigo_orden FROM ordenes_servicio
       WHERE codigo_orden LIKE ?
       ORDER BY id DESC LIMIT 1`,
      [`OS-${new Date().getFullYear()}-%`],
    )
    const lastSequence = rows[0]?.codigo_orden?.split('-')[2]
    const nextNumber = Number.parseInt(lastSequence, 10)
    return `OS-${new Date().getFullYear()}-${String(Number.isNaN(nextNumber) ? 1 : nextNumber + 1).padStart(4, '0')}`
  },

  async create(data) {
    const codigo_orden = await this.generateCodigoOrden()
    const [result] = await pool.query(
      `INSERT INTO ordenes_servicio (
        codigo_orden, equipo_id, tecnico_id, motivo_ingreso,
        tipo_servicio, prioridad, estado, costo_estimado,
        abono_inicial, observaciones_recepcion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo_orden,
        data.equipo_id,
        data.tecnico_id || null,
        data.motivo_ingreso,
        data.tipo_servicio,
        data.prioridad || 'MEDIA',
        data.estado || 'PENDIENTE',
        data.costo_estimado ?? 0,
        data.abono_inicial ?? 0,
        data.observaciones_recepcion || null,
      ],
    )
    return this.findById(result.insertId)
  },

  findById: obtenerOrdenServicio,
  findAll: listarOrdenesServicio,
  assignTecnico: (id, tecnicoId) => asignarTecnicoAOrden(id, tecnicoId),
  updateState: (id, estadoNuevo, estadoAnterior, usuarioId, observacion) =>
    cambiarEstadoOrden({ ordenId: id, estadoNuevo, usuarioId, observacion: observacion ?? estadoAnterior }),
  closeOrden: (id, observaciones, usuarioId) =>
    cerrarOrdenDefinitivamente(id, observaciones, usuarioId),
}
