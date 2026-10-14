import pool from '../config/db.js'

export async function findClientOrderByCode(codigoOrden, usuarioId) {
  const [rows] = await pool.query(
    `SELECT o.id, o.codigo_orden AS codigoOrden, o.estado,
            o.creada_en AS fechaIngreso,
            e.tipo, e.marca, e.modelo,
            ut.nombre AS tecnicoNombre
      FROM ordenes_servicio o
      JOIN equipos e ON e.id = o.equipo_id
      JOIN clientes c ON c.id = e.cliente_id
      LEFT JOIN tecnicos t ON t.id = o.tecnico_id
      LEFT JOIN usuarios ut ON ut.id = t.usuario_id
      WHERE o.codigo_orden = ? AND c.usuario_id = ?
      LIMIT 1`,
    [codigoOrden, usuarioId],
  )

  return rows[0] ?? null
}

export async function findOrderStatusHistory(ordenId) {
  const [rows] = await pool.query(
    `SELECT estado_anterior AS estadoAnterior,
            estado_nuevo AS estadoNuevo,
            creado_en AS creadoEn
      FROM historial_estados_orden
      WHERE orden_id = ?
      ORDER BY creado_en ASC, id ASC`,
    [ordenId],
  )

  return rows
}

export async function countOrdersByStatus() {
  const [rows] = await pool.query(
    `SELECT estado, COUNT(*) AS cantidad
      FROM ordenes_servicio
      GROUP BY estado`,
  )

  return rows
}

export async function searchGlobal(term) {
  const [rows] = await pool.query(
    `SELECT c.id AS clienteId, c.cedula, c.nombres, c.apellidos,
            e.id AS equipoId, e.tipo, e.marca, e.modelo,
            e.numero_serie AS numeroSerie,
            o.id AS ordenId, o.codigo_orden AS codigoOrden, o.estado,
            CASE
              WHEN c.cedula = ? THEN 'CEDULA'
              WHEN e.numero_serie = ? THEN 'SERIE'
              ELSE 'ORDEN'
            END AS coincidencia
      FROM clientes c
      LEFT JOIN equipos e ON e.cliente_id = c.id
      LEFT JOIN ordenes_servicio o ON o.equipo_id = e.id
      WHERE c.cedula = ? OR e.numero_serie = ? OR o.codigo_orden = ?
      ORDER BY c.id, e.id, o.id
      LIMIT 100`,
    [term, term, term, term, term],
  )

  return rows
}