import pool from '../config/db.js'

export async function buscarClientePorCedulaOEmail(cedula, email) {
  const [rows] = await pool.query(
    `SELECT * FROM clientes
     WHERE cedula = ? OR (? IS NOT NULL AND email = ?)
     LIMIT 1`,
    [cedula, email, email],
  )
  return rows[0] || null
}

export async function crearCliente({
  cedula,
  nombres,
  apellidos,
  direccion,
  telefono,
  email,
  usuario_id,
}) {
  const [result] = await pool.query(
    `INSERT INTO clientes
      (usuario_id, cedula, nombres, apellidos, direccion, telefono, email)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [usuario_id || null, cedula, nombres, apellidos, direccion || null, telefono, email || null],
  )
  return {
    id: result.insertId,
    usuario_id: usuario_id || null,
    cedula,
    nombres,
    apellidos,
    direccion: direccion || null,
    telefono,
    email: email || null,
  }
}

export async function buscarClientePorUsuarioId(usuarioId) {
  const [rows] = await pool.query(
    'SELECT * FROM clientes WHERE usuario_id = ? LIMIT 1',
    [usuarioId],
  )
  return rows[0] || null
}

export const ClienteModel = {
  async findAll(search = '') {
    const term = typeof search === 'string' ? search.trim() : ''
    const params = []
    let query = `SELECT c.*,
      CONCAT_WS(' ', c.nombres, c.apellidos) AS nombre
      FROM clientes c`

    if (term) {
      const like = `%${term}%`
      query += ` WHERE c.cedula LIKE ? OR c.nombres LIKE ? OR c.apellidos LIKE ?
        OR c.direccion LIKE ? OR c.telefono LIKE ? OR c.email LIKE ?`
      params.push(like, like, like, like, like, like)
    }

    query += ' ORDER BY c.nombres ASC, c.apellidos ASC LIMIT 50'
    const [rows] = await pool.query(query, params)
    return rows
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT c.*, CONCAT_WS(' ', c.nombres, c.apellidos) AS nombre
       FROM clientes c WHERE c.id = ? LIMIT 1`,
      [id],
    )
    return rows[0] || null
  },

  async update(id, { nombres, apellidos, direccion, telefono, email }) {
    await pool.query(
      `UPDATE clientes SET nombres = ?, apellidos = ?, direccion = ?,
        telefono = ?, email = ? WHERE id = ?`,
      [nombres, apellidos, direccion || null, telefono, email || null, id],
    )
    return this.findById(id)
  },

  async findTecnicos() {
    const [rows] = await pool.query(
      `SELECT t.id AS tecnico_id, u.id AS usuario_id, u.nombre,
        u.email, t.cedula, t.telefono, t.especialidad, t.estado
       FROM tecnicos t
       INNER JOIN usuarios u ON u.id = t.usuario_id
       WHERE u.rol = 'TECNICO'
       ORDER BY u.nombre ASC`,
    )
    return rows
  },
}
