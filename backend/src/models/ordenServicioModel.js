import pool from "../config/db.js"

export const OrdenServicioModel = {
  // Generar identificador correlativo único para la orden de servicio (ej: OS-2026-0001)
  async generateCodigoOrden() {
    const currentYear = new Date().getFullYear()
    const prefix = `OS-${currentYear}-`

    const [rows] = await pool.query(
      `SELECT codigo_orden FROM ordenes_servicio 
       WHERE codigo_orden LIKE ? 
       ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    )

    let nextNumber = 1
    if (rows.length > 0 && rows[0].codigo_orden) {
      const parts = rows[0].codigo_orden.split("-")
      const lastSeq = parseInt(parts[2], 10)
      if (!isNaN(lastSeq)) {
        nextNumber = lastSeq + 1
      }
    }

    const paddedNumber = String(nextNumber).padStart(4, "0")
    return `${prefix}${paddedNumber}`
  },

  // Crear una nueva orden de servicio vinculada al equipo
  async create(data) {
    const codigo_orden = await this.generateCodigoOrden()

    const query = `
      INSERT INTO ordenes_servicio (
        codigo_orden, equipo_id, tecnico_id, motivo_ingreso,
        tipo_servicio, prioridad, estado, costo_estimado,
        abono_inicial, observaciones_recepcion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const values = [
      codigo_orden,
      data.equipo_id,
      data.tecnico_id || null,
      data.motivo_ingreso,
      data.tipo_servicio,
      data.prioridad || "MEDIA",
      data.estado || "PENDIENTE",
      data.costo_estimado !== undefined && data.costo_estimado !== "" ? data.costo_estimado : 0.00,
      data.abono_inicial !== undefined && data.abono_inicial !== "" ? data.abono_inicial : 0.00,
      data.observaciones_recepcion || null
    ]

    const [result] = await pool.query(query, values)
    return this.findById(result.insertId)
  },

  // Obtener orden de servicio por ID con detalles de equipo, cliente y técnico
  async findById(id) {
    const query = `
      SELECT 
        o.*,
        e.numero_serie AS equipo_serie,
        e.tipo_equipo AS equipo_tipo,
        e.marca AS equipo_marca,
        e.modelo AS equipo_modelo,
        e.procesador AS equipo_procesador,
        e.memoria_ram AS equipo_ram,
        e.almacenamiento AS equipo_almacenamiento,
        e.sistema_operativo AS equipo_so,
        e.estado_fisico AS equipo_estado_fisico,
        e.accesorios AS equipo_accesorios,
        c.id AS cliente_id,
        c.nombre AS cliente_nombre,
        c.cedula AS cliente_cedula,
        c.telefono AS cliente_telefono,
        c.email AS cliente_email,
        u.nombre AS tecnico_nombre
      FROM ordenes_servicio o
      INNER JOIN equipos e ON o.equipo_id = e.id
      INNER JOIN clientes c ON e.cliente_id = c.id
      LEFT JOIN usuarios u ON o.tecnico_id = u.id
      WHERE o.id = ?
    `
    const [rows] = await pool.query(query, [id])
    return rows[0] || null
  },

  // Listar todas las órdenes de servicio con filtros opcionales (HU-15 criterio 9)
  async findAll({ search = "", estado = "" } = {}) {
    let query = `
      SELECT 
        o.*,
        e.numero_serie AS equipo_serie,
        e.tipo_equipo AS equipo_tipo,
        e.marca AS equipo_marca,
        e.modelo AS equipo_modelo,
        c.nombre AS cliente_nombre,
        c.cedula AS cliente_cedula,
        c.telefono AS cliente_telefono,
        u.nombre AS tecnico_nombre
      FROM ordenes_servicio o
      INNER JOIN equipos e ON o.equipo_id = e.id
      INNER JOIN clientes c ON e.cliente_id = c.id
      LEFT JOIN usuarios u ON o.tecnico_id = u.id
      WHERE 1 = 1
    `
    const params = []

    if (estado && estado.trim() !== "") {
      query += ` AND o.estado = ?`
      params.push(estado.trim())
    }

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`
      query += ` AND (
        o.codigo_orden LIKE ? 
        OR e.numero_serie LIKE ? 
        OR e.marca LIKE ? 
        OR e.modelo LIKE ? 
        OR c.nombre LIKE ?
        OR c.cedula LIKE ?
      )`
      params.push(term, term, term, term, term, term)
    }

    query += ` ORDER BY o.id DESC`

    const [rows] = await pool.query(query, params)
    return rows
  }
}
