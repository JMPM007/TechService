import pool from '../config/db.js'

export async function buscarClientePorCedulaOEmail(cedula, email) {
  const [rows] = await pool.query(
    'SELECT * FROM clientes WHERE cedula = ? OR email = ? LIMIT 1',
    [cedula, email],
  )
  return rows[0] || null
}

export async function crearCliente({ cedula, nombres, apellidos, telefono, email, usuario_id }) {
  const [result] = await pool.query(
    'INSERT INTO clientes (usuario_id, cedula, nombres, apellidos, telefono, email) VALUES (?, ?, ?, ?, ?, ?)',
    [usuario_id || null, cedula, nombres, apellidos, telefono, email],
  )
  return { id: result.insertId, usuario_id: usuario_id || null, cedula, nombres, apellidos, telefono, email }
}

export async function buscarClientePorUsuarioId(usuario_id) {
  const [rows] = await pool.query(
    'SELECT * FROM clientes WHERE usuario_id = ? LIMIT 1',
    [usuario_id],
  )
  return rows[0] || null
}

export async function listarClientes(search = '') {
  const term = search.trim()
  const params = []
  let query = `
    SELECT id, usuario_id, cedula, nombres, apellidos, telefono, email, creado_en
    FROM clientes
  `
  if (term) {
    const value = `%${term}%`
    query += `
      WHERE cedula LIKE ? OR nombres LIKE ? OR apellidos LIKE ? OR email LIKE ?
    `
    params.push(value, value, value, value)
  }
  query += ' ORDER BY nombres ASC, apellidos ASC'
  const [rows] = await pool.query(query, params)
  return rows
}
