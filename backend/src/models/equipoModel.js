import pool from "../config/db.js"

export const EquipoModel = {
  // Buscar equipos con filtro opcional (por número de serie, marca, modelo, o cliente)
  async findAll({ search = "" } = {}) {
    let query = `
      SELECT 
        e.*,
        c.nombre AS cliente_nombre,
        c.cedula AS cliente_cedula,
        c.telefono AS cliente_telefono,
        c.email AS cliente_email
      FROM equipos e
      INNER JOIN clientes c ON e.cliente_id = c.id
    `
    const params = []

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`
      query += `
        WHERE e.numero_serie LIKE ?
           OR e.marca LIKE ?
           OR e.modelo LIKE ?
           OR e.tipo_equipo LIKE ?
           OR c.nombre LIKE ?
           OR c.cedula LIKE ?
      `
      params.push(term, term, term, term, term, term)
    }

    query += ` ORDER BY e.id DESC`

    const [rows] = await pool.query(query, params)
    return rows
  },

  // Obtener ficha técnica por ID
  async findById(id) {
    const query = `
      SELECT 
        e.*,
        c.nombre AS cliente_nombre,
        c.cedula AS cliente_cedula,
        c.telefono AS cliente_telefono,
        c.email AS cliente_email,
        c.direccion AS cliente_direccion
      FROM equipos e
      INNER JOIN clientes c ON e.cliente_id = c.id
      WHERE e.id = ?
    `
    const [rows] = await pool.query(query, [id])
    return rows[0] || null
  },

  // Buscar equipo por número de serie exacto
  async findByNumeroSerie(numeroSerie) {
    const query = `
      SELECT 
        e.*,
        c.nombre AS cliente_nombre,
        c.cedula AS cliente_cedula,
        c.telefono AS cliente_telefono,
        c.email AS cliente_email,
        c.direccion AS cliente_direccion
      FROM equipos e
      INNER JOIN clientes c ON e.cliente_id = c.id
      WHERE LOWER(TRIM(e.numero_serie)) = LOWER(TRIM(?))
    `
    const [rows] = await pool.query(query, [numeroSerie])
    return rows[0] || null
  },

  // Actualizar características y ficha técnica del equipo (HU-14)
  async update(id, data) {
    const query = `
      UPDATE equipos SET
        tipo_equipo = ?,
        marca = ?,
        modelo = ?,
        numero_serie = ?,
        procesador = ?,
        memoria_ram = ?,
        almacenamiento = ?,
        tarjeta_grafica = ?,
        sistema_operativo = ?,
        estado_fisico = ?,
        accesorios = ?,
        observaciones = ?
      WHERE id = ?
    `
    const values = [
      data.tipo_equipo,
      data.marca,
      data.modelo,
      data.numero_serie,
      data.procesador || null,
      data.memoria_ram || null,
      data.almacenamiento || null,
      data.tarjeta_grafica || null,
      data.sistema_operativo || null,
      data.estado_fisico || null,
      data.accesorios || null,
      data.observaciones || null,
      id
    ]

    const [result] = await pool.query(query, values)
    if (result.affectedRows === 0) return null
    return this.findById(id)
  },

  // Crear nuevo equipo
  async create(data) {
    const query = `
      INSERT INTO equipos (
        cliente_id, numero_serie, tipo_equipo, marca, modelo,
        procesador, memoria_ram, almacenamiento, tarjeta_grafica,
        sistema_operativo, estado_fisico, accesorios, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const values = [
      data.cliente_id,
      data.numero_serie,
      data.tipo_equipo,
      data.marca,
      data.modelo,
      data.procesador || null,
      data.memoria_ram || null,
      data.almacenamiento || null,
      data.tarjeta_grafica || null,
      data.sistema_operativo || null,
      data.estado_fisico || null,
      data.accesorios || null,
      data.observaciones || null
    ]

    const [result] = await pool.query(query, values)
    return this.findById(result.insertId)
  }
}
