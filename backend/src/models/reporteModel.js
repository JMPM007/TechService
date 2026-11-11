import pool from '../config/db.js'

export const LIMITE_DETALLE = 500

// Las órdenes se filtran por fecha de creación; "hasta" incluye el día completo.
const filtroPeriodo = 'o.creada_en >= ? AND o.creada_en < DATE_ADD(?, INTERVAL 1 DAY)'

export async function obtenerResumenGestion(desde, hasta) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS totalOrdenes,
            COALESCE(SUM(o.estado = 'ENTREGADA'), 0) AS entregadas,
            COALESCE(SUM(o.estado = 'CANCELADA'), 0) AS canceladas,
            COALESCE(SUM(c.estado = 'APROBADA'), 0) AS cotizacionesAprobadas,
            COALESCE(SUM(CASE WHEN c.estado = 'APROBADA' THEN c.total END), 0) AS ingresosAprobados
      FROM ordenes_servicio o
      LEFT JOIN cotizaciones c ON c.orden_id = o.id
      WHERE ${filtroPeriodo}`,
    [desde, hasta],
  )

  return rows[0]
}

export async function contarOrdenesPorEstadoEnPeriodo(desde, hasta) {
  const [rows] = await pool.query(
    `SELECT o.estado, COUNT(*) AS cantidad
      FROM ordenes_servicio o
      WHERE ${filtroPeriodo}
      GROUP BY o.estado`,
    [desde, hasta],
  )

  return rows
}

export async function contarOrdenesPorTecnico(desde, hasta) {
  const [rows] = await pool.query(
    `SELECT COALESCE(u.nombre, 'Sin asignar') AS tecnico,
            COUNT(*) AS ordenes,
            COALESCE(SUM(o.estado = 'ENTREGADA'), 0) AS entregadas
      FROM ordenes_servicio o
      LEFT JOIN tecnicos t ON t.id = o.tecnico_id
      LEFT JOIN usuarios u ON u.id = t.usuario_id
      WHERE ${filtroPeriodo}
      GROUP BY o.tecnico_id, u.nombre
      ORDER BY ordenes DESC, tecnico ASC`,
    [desde, hasta],
  )

  return rows
}

export async function listarOrdenesDelPeriodo(desde, hasta) {
  const [rows] = await pool.query(
    `SELECT o.id, o.codigo_orden AS codigoOrden, o.creada_en AS fechaIngreso, o.estado,
            CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente,
            CONCAT_WS(' ', e.tipo, e.marca, e.modelo) AS equipo,
            u.nombre AS tecnico,
            c.estado AS estadoCotizacion, c.total AS totalCotizacion
      FROM ordenes_servicio o
      JOIN equipos e ON e.id = o.equipo_id
      JOIN clientes cl ON cl.id = e.cliente_id
      LEFT JOIN tecnicos t ON t.id = o.tecnico_id
      LEFT JOIN usuarios u ON u.id = t.usuario_id
      LEFT JOIN cotizaciones c ON c.orden_id = o.id
      WHERE ${filtroPeriodo}
      ORDER BY o.creada_en DESC, o.id DESC
      LIMIT ${LIMITE_DETALLE}`,
    [desde, hasta],
  )

  return rows
}
