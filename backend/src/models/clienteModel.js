import pool from "../config/db.js"

export const ClienteModel = {
  async findAll(search = "") {
    if (search && search.trim() !== "") {
      const like = `%${search.trim()}%`
      const [rows] = await pool.query(
        `SELECT id, cedula, nombre, direccion, telefono, email, creado_en 
         FROM clientes 
         WHERE cedula LIKE ? OR nombre LIKE ? 
         ORDER BY nombre ASC LIMIT 50`,
        [like, like]
      )
      return rows
    }
    const [rows] = await pool.query(`SELECT * FROM clientes ORDER BY nombre ASC`)
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

  async create({ cedula, nombre, direccion, telefono, email }) {
    const [result] = await pool.query(
      `INSERT INTO clientes (cedula, nombre, direccion, telefono, email) VALUES (?, ?, ?, ?, ?)`,
      [cedula, nombre, direccion || null, telefono, email || null]
    )
    return this.findById(result.insertId)
  },

  async update(id, { nombre, direccion, telefono, email }) {
    await pool.query(
      `UPDATE clientes SET nombre = ?, direccion = ?, telefono = ?, email = ? WHERE id = ?`,
      [nombre, direccion || null, telefono, email || null, id]
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
