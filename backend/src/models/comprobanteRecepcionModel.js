import pool from '../config/db.js'

async function obtenerOrdenConDatos(connection, ordenId) {
  const [rows] = await connection.query(
    `SELECT o.id, o.codigo_orden AS codigoOrden, o.motivo_ingreso AS motivoIngreso,
      o.observaciones_recepcion AS observacionesRecepcion, o.creada_en AS fechaRecepcion,
      e.id AS equipoId, e.tipo AS equipoTipo, e.marca AS equipoMarca,
      e.modelo AS equipoModelo, e.numero_serie AS equipoSerial,
      e.estado_fisico AS estadoFisico, e.accesorios,
      c.id AS clienteId, c.usuario_id AS clienteUsuarioId,
      c.nombres, c.apellidos, c.cedula, c.telefono, c.email
     FROM ordenes_servicio o
     INNER JOIN equipos e ON e.id = o.equipo_id
     INNER JOIN clientes c ON c.id = e.cliente_id
     WHERE o.id = ?
     LIMIT 1`,
    [ordenId],
  )
  return rows[0] || null
}

function mapearComprobante(row) {
  return {
    id: row.id,
    ordenId: row.ordenId,
    numeroComprobante: row.numeroComprobante,
    codigoOrden: row.codigoOrden,
    fechaRecepcion: row.fechaRecepcion,
    fallaReportada: row.fallaReportada,
    estadoFisico: row.estadoFisico,
    accesorios: row.accesorios,
    observaciones: row.observaciones,
    cliente: {
      id: row.clienteId,
      usuarioId: row.clienteUsuarioId,
      nombres: row.nombres,
      apellidos: row.apellidos,
      cedula: row.cedula,
      telefono: row.telefono,
      email: row.email,
    },
    equipo: {
      id: row.equipoId,
      tipo: row.equipoTipo,
      marca: row.equipoMarca,
      modelo: row.equipoModelo,
      numeroSerie: row.equipoSerial,
    },
  }
}

export async function obtenerComprobanteRecepcion(ordenId) {
  const [rows] = await pool.query(
    `SELECT r.id, r.orden_id AS ordenId, r.numero_comprobante AS numeroComprobante,
      o.codigo_orden AS codigoOrden, r.fecha_recepcion AS fechaRecepcion,
      r.falla_reportada AS fallaReportada, r.estado_fisico AS estadoFisico,
      r.accesorios, r.observaciones, c.id AS clienteId, c.usuario_id AS clienteUsuarioId,
      c.nombres, c.apellidos, c.cedula, c.telefono, c.email,
      e.id AS equipoId, e.tipo AS equipoTipo, e.marca AS equipoMarca,
      e.modelo AS equipoModelo, e.numero_serie AS equipoSerial
     FROM comprobantes_recepcion r
     INNER JOIN ordenes_servicio o ON o.id = r.orden_id
     INNER JOIN equipos e ON e.id = o.equipo_id
     INNER JOIN clientes c ON c.id = e.cliente_id
     WHERE r.orden_id = ?
     LIMIT 1`,
    [ordenId],
  )
  return rows[0] ? mapearComprobante(rows[0]) : null
}

export async function crearComprobanteRecepcion({ ordenId, usuarioId, fallaReportada, estadoFisico, accesorios, observaciones }) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const orden = await obtenerOrdenConDatos(connection, ordenId)
    if (!orden) {
      await connection.rollback()
      return 'NOT_FOUND'
    }
    const [existing] = await connection.query(
      'SELECT id FROM comprobantes_recepcion WHERE orden_id = ? FOR UPDATE',
      [ordenId],
    )
    if (existing.length) {
      await connection.rollback()
      return 'EXISTS'
    }
    const numeroComprobante = `CR-${new Date().getFullYear()}-${String(ordenId).padStart(6, '0')}`
    await connection.query(
      `INSERT INTO comprobantes_recepcion
        (orden_id, numero_comprobante, generado_por, falla_reportada,
         estado_fisico, accesorios, observaciones, fecha_recepcion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ordenId,
        numeroComprobante,
        usuarioId,
        fallaReportada,
        estadoFisico,
        accesorios,
        observaciones || null,
        orden.fechaRecepcion,
      ],
    )
    await connection.commit()
    return 'CREATED'
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function obtenerOrdenParaComprobante(ordenId) {
  const [rows] = await pool.query(
    `SELECT o.id, o.codigo_orden AS codigoOrden, o.motivo_ingreso AS motivoIngreso,
      o.observaciones_recepcion AS observacionesRecepcion, e.estado_fisico AS estadoFisico,
      e.accesorios, e.numero_serie AS equipoSerial, e.tipo AS equipoTipo,
      e.marca AS equipoMarca, e.modelo AS equipoModelo,
      c.nombres, c.apellidos, c.cedula, c.telefono, c.email
     FROM ordenes_servicio o
     INNER JOIN equipos e ON e.id = o.equipo_id
     INNER JOIN clientes c ON c.id = e.cliente_id
     WHERE o.id = ? LIMIT 1`,
    [ordenId],
  )
  return rows[0] || null
}