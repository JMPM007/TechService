import pool from "../config/db.js"

export async function buscarClientePorCedulaOEmail(cedula, email) {
    const [rows] = await pool.query(
        "SELECT * FROM clientes WHERE cedula = ? OR email = ? LIMIT 1",
        [cedula, email]
    )
    return rows[0] || null
}

export async function crearCliente({ cedula, nombres, apellidos, telefono, email, usuario_id}) {
    const [result] = await pool.query(
        "INSERT INTO clientes (usuario_id, cedula, nombres, apellidos, telefono, email) VALUES (?, ?, ?, ?,?, ?)",
        [usuario_id || null, cedula, nombres, apellidos, telefono, email]
    )
    return { id: result.insertId, usuario_id: usuario_id || null, cedula, nombres, apellidos, telefono, email }
}

export async function buscarClientePorUsuarioId(usuario_id) {
    const [rows] = await pool.query(
        "SELECT * FROM clientes WHERE usuario_id = ? LIMIT 1",
        [usuario_id]
    )
    return rows[0] || null
}

export const ClienteModel = {
  async findAll(search = "") {
    if (search && search.trim() !== "") {
      const like = `%${search.trim()}%`
      const [rows] = await pool.query(
        `SELECT id, cedula, nombres, apellidos, CONCAT(nombres, ' ', apellidos) AS nombre, direccion, telefono, email, creado_en 
         FROM clientes 
         WHERE cedula LIKE ? OR nombres LIKE ? OR apellidos LIKE ? 
         ORDER BY nombres ASC, apellidos ASC LIMIT 50`,
        [like, like, like]
      )
      return rows
    }
    const [rows] = await pool.query(
      `SELECT clientes.*, CONCAT(nombres, ' ', apellidos) AS nombre FROM clientes ORDER BY nombres ASC, apellidos ASC`
    )
    return rows
  },

  async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM clientes WHERE id = ?`, [id])
    return rows[0] || null
  },

  async findByCedula(cedula) {
    const [rows] = await pool.query(`SELECT * FROM clientes WHERE cedula = ?`, [cedula])
    return rows[0] || null
  },

  async create({ cedula, nombre, nombres = nombre, apellidos = "Por completar", direccion, telefono, email, usuario_id }) {
    const [result] = await pool.query(
      `INSERT INTO clientes (usuario_id, cedula, nombres, apellidos, direccion, telefono, email) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, cedula, nombres, apellidos, direccion || null, telefono, email || null]
    )
    return this.findById(result.insertId)
  },

  async update(id, { nombre, nombres = nombre, apellidos, direccion, telefono, email }) {
    await pool.query(
      `UPDATE clientes SET nombres = ?, apellidos = COALESCE(?, apellidos), direccion = ?, telefono = ?, email = ? WHERE id = ?`,
      [nombres, apellidos ?? null, direccion || null, telefono, email || null, id]
    )
    return this.findById(id)
  },

  async findTecnicos() {
    const [rows] = await pool.query(
      `SELECT id, nombre, email, rol FROM usuarios WHERE rol IN ('TECNICO', 'ADMIN') ORDER BY nombre ASC`
    )
    return rows
  }
}
