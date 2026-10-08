import pool from '../config/db.js'

export async function crearEquipo({
  cliente_id,
  tipo,
  marca,
  modelo,
  numero_serie,
  motivo_ingreso,
  procesador,
  memoria_ram,
  almacenamiento,
  tarjeta_grafica,
  sistema_operativo,
  estado_fisico,
  accesorios,
  observaciones,
}) {
  const [result] = await pool.query(
    `INSERT INTO equipos
      (cliente_id, tipo, marca, modelo, numero_serie, motivo_ingreso,
       procesador, memoria_ram, almacenamiento, tarjeta_grafica, sistema_operativo,
       estado_fisico, accesorios, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cliente_id,
      tipo,
      marca || null,
      modelo,
      numero_serie || null,
      motivo_ingreso || null,
      procesador || null,
      memoria_ram || null,
      almacenamiento || null,
      tarjeta_grafica || null,
      sistema_operativo || null,
      estado_fisico || null,
      accesorios || null,
      observaciones || null,
    ],
  )
  return result.insertId
}

export async function obtenerEquiposPorCliente(clienteId) {
  const [rows] = await pool.query(
    'SELECT * FROM equipos WHERE cliente_id = ? ORDER BY fecha_ingreso DESC',
    [clienteId],
  )
  return rows
}

export async function obtenerEquipoPorId(equipoId) {
  const [rows] = await pool.query(
    `SELECT e.*, e.numero_serie AS numeroSerie, e.cliente_id AS clienteId,
      c.nombres, c.apellidos, c.cedula,
      c.telefono AS clienteTelefono, c.email AS clienteEmail
     FROM equipos e
     LEFT JOIN clientes c ON c.id = e.cliente_id
     WHERE e.id = ?
     LIMIT 1`,
    [equipoId],
  )
  return rows[0] || null
}

export async function listarEquipos({ search = '' } = {}) {
  const term = typeof search === 'string' ? search.trim() : ''
  const params = []
  let query = `SELECT e.*, e.numero_serie AS numeroSerie,
    e.cliente_id AS clienteId, c.nombres, c.apellidos
    FROM equipos e
    LEFT JOIN clientes c ON c.id = e.cliente_id`

  if (term) {
    query += ` WHERE e.numero_serie LIKE ? OR e.marca LIKE ? OR e.modelo LIKE ?
      OR e.tipo LIKE ? OR c.nombres LIKE ? OR c.apellidos LIKE ?`
    const value = `%${term}%`
    params.push(value, value, value, value, value, value)
  }
  query += ' ORDER BY e.id DESC'
  const [rows] = await pool.query(query, params)
  return rows
}

export async function buscarEquipoPorSerial(numeroSerie) {
  const [rows] = await pool.query(
    `SELECT e.*, e.numero_serie AS numeroSerie, e.cliente_id AS clienteId,
      c.nombres, c.apellidos, c.cedula
     FROM equipos e
     LEFT JOIN clientes c ON c.id = e.cliente_id
     WHERE LOWER(TRIM(e.numero_serie)) = LOWER(TRIM(?))
     LIMIT 1`,
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
      datos.marca || null,
      datos.modelo,
      datos.numeroSerie || null,
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
