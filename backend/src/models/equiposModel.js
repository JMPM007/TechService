import pool from '../config/db.js'

export async function crearEquipo({ cliente_id, tipo, marca, modelo, numero_serie, motivo_ingreso }) {
  const [result] = await pool.query(
    'INSERT INTO equipos (cliente_id, tipo, marca, modelo, numero_serie, motivo_ingreso) VALUES (?, ?, ?, ?, ?, ?)',
    [cliente_id, tipo, marca || null, modelo, numero_serie || null, motivo_ingreso],
  )
  return result.insertId
}

export async function obtenerEquiposPorCliente(cliente_id) {
  const [rows] = await pool.query(
    'SELECT * FROM equipos WHERE cliente_id = ? ORDER BY fecha_ingreso DESC',
    [cliente_id],
  )
  return rows
}

export async function obtenerEquiposDelUsuario(usuarioId) {
  const [rows] = await pool.query(
    `SELECT e.id, e.tipo, e.marca, e.modelo, e.numero_serie AS numeroSerie,
      e.estado, e.fecha_ingreso AS fechaIngreso
     FROM equipos e
     INNER JOIN clientes c ON c.id = e.cliente_id
     WHERE c.usuario_id = ?
     ORDER BY e.fecha_ingreso DESC`,
    [usuarioId],
  )
  return rows
}

export async function obtenerEquipoPorId(equipo_id) {
  const [rows] = await pool.query(
    `SELECT e.*, e.numero_serie AS numeroSerie, e.cliente_id AS clienteId,
      c.nombres, c.apellidos, c.cedula, c.telefono AS clienteTelefono, c.email AS clienteEmail
    FROM equipos e
     LEFT JOIN clientes c ON c.id = e.cliente_id
     WHERE e.id = ?
     LIMIT 1`,
    [equipo_id],
  )
  return rows[0] || null
}

export async function listarEquipos({ search = '' } = {}) {
  const term = search.trim()
  const params = []
  let query = `SELECT e.*, e.numero_serie AS numeroSerie,
    e.cliente_id AS clienteId, c.nombres, c.apellidos, c.cedula
    FROM equipos e LEFT JOIN clientes c ON c.id = e.cliente_id`

  if (term) {
    query += ` WHERE e.numero_serie LIKE ? OR e.marca LIKE ? OR e.modelo LIKE ?
      OR e.tipo LIKE ? OR c.nombres LIKE ? OR c.apellidos LIKE ? OR c.cedula LIKE ?
      OR CONCAT(c.nombres, ' ', c.apellidos) LIKE ?`
    const value = `%${term}%`
    params.push(value, value, value, value, value, value, value, value)
  }
  query += ' ORDER BY e.id DESC'
  const [rows] = await pool.query(query, params)
  return rows
}

export async function buscarEquipoPorSerial(numeroSerie) {
  const [rows] = await pool.query(
    `SELECT e.*, e.numero_serie AS numeroSerie, e.cliente_id AS clienteId,
      c.nombres, c.apellidos, c.cedula
     FROM equipos e LEFT JOIN clientes c ON c.id = e.cliente_id
     WHERE LOWER(TRIM(e.numero_serie)) = LOWER(TRIM(?)) LIMIT 1`,
    [numeroSerie],
  )
  return rows[0] || null
}

export async function actualizarEquipo(equipoId, datos) {
  const [result] = await pool.query(
    `UPDATE equipos SET tipo = ?, marca = ?, modelo = ?, numero_serie = ?,
      procesador = ?, memoria_ram = ?, almacenamiento = ?, tarjeta_grafica = ?,
      sistema_operativo = ?, estado_fisico = ?, accesorios = ?, observaciones = ?
     WHERE id = ?`,
    [
      datos.tipo,
      datos.marca,
      datos.modelo,
      datos.numeroSerie,
      datos.procesador || null,
      datos.memoriaRam || null,
      datos.almacenamiento || null,
      datos.tarjetaGrafica || null,
      datos.sistemaOperativo || null,
      datos.estadoFisico || null,
      datos.accesorios || null,
      datos.observaciones || null,
      equipoId,
    ],
  )
  return result.affectedRows ? obtenerEquipoPorId(equipoId) : null
}

export async function obtenerEquipoPorMarcaYSerial(marca, numeroSerie) {
  const [rows] = await pool.query(
    `SELECT id, tipo, marca, modelo, numero_serie AS numeroSerie,
      estado, cliente_id AS clienteId
     FROM equipos
     WHERE LOWER(TRIM(marca)) = LOWER(TRIM(?))
       AND LOWER(TRIM(numero_serie)) = LOWER(TRIM(?))
     LIMIT 1`,
    [marca, numeroSerie],
  )
  return rows[0] || null
}

export async function obtenerHistorialServiciosEquipo(equipoId, usuarioId = null) {
  const ownerFilter = usuarioId === null ? '' : 'AND c.usuario_id = ?'
  const equipoParams = usuarioId === null ? [equipoId] : [equipoId, usuarioId]
  const [equipos] = await pool.query(
    `SELECT e.id, e.tipo, e.marca, e.modelo, e.numero_serie AS numeroSerie,
      e.estado, e.fecha_ingreso AS fechaIngreso
     FROM equipos e
     INNER JOIN clientes c ON c.id = e.cliente_id
     WHERE e.id = ? ${ownerFilter}
     LIMIT 1`,
    equipoParams,
  )
  if (!equipos.length) return null

  const [ordenes] = await pool.query(
    `SELECT o.id AS ordenId,
      COALESCE(o.codigo_orden, CONCAT('OS-', o.id)) AS numeroOrden,
      o.estado, o.creada_en AS fecha,
      o.tipo_servicio AS tipoServicio, o.motivo_ingreso AS motivoIngreso,
      d.descripcion AS diagnostico, d.falla_encontrada AS fallaEncontrada,
      d.procedimientos, d.recomendaciones,
      c.id AS cotizacionId, c.estado AS estadoCotizacion
     FROM ordenes_servicio o
     LEFT JOIN diagnosticos_orden d ON d.orden_id = o.id
     LEFT JOIN cotizaciones c ON c.orden_id = o.id
     WHERE o.equipo_id = ?
     ORDER BY o.creada_en DESC, o.id DESC`,
    [equipoId],
  )

  if (!ordenes.length) return { equipo: equipos[0], historial: [] }

  const cotizacionIds = ordenes
    .map((orden) => orden.cotizacionId)
    .filter((id) => id !== null)
  let conceptos = []
  if (cotizacionIds.length) {
    const placeholders = cotizacionIds.map(() => '?').join(', ')
    const [rows] = await pool.query(
      `SELECT cotizacion_id AS cotizacionId, tipo, descripcion, cantidad
       FROM cotizacion_conceptos
       WHERE cotizacion_id IN (${placeholders})
       ORDER BY id ASC`,
      cotizacionIds,
    )
    conceptos = rows
  }

  const conceptosPorCotizacion = new Map()
  for (const concepto of conceptos) {
    const items = conceptosPorCotizacion.get(concepto.cotizacionId) ?? []
    items.push(concepto)
    conceptosPorCotizacion.set(concepto.cotizacionId, items)
  }

  const historial = ordenes.map((orden) => {
    const itemsCotizados = conceptosPorCotizacion.get(orden.cotizacionId) ?? []
    return {
      ordenId: orden.ordenId,
      numeroOrden: orden.numeroOrden,
      fecha: orden.fecha,
      estado: orden.estado,
      diagnostico: orden.diagnostico,
      fallaEncontrada: orden.fallaEncontrada,
      procedimientos: orden.procedimientos,
      recomendaciones: orden.recomendaciones,
      tipoServicio: orden.tipoServicio,
      motivoIngreso: orden.motivoIngreso,
      estadoCotizacion: orden.estadoCotizacion,
      serviciosCotizados: itemsCotizados.filter((item) => item.tipo !== 'REPUESTO'),
      repuestosCotizados: itemsCotizados.filter((item) => item.tipo === 'REPUESTO'),
    }
  })

  return { equipo: equipos[0], historial }
}
