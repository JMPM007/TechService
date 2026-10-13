import pool from '../config/db.js'

export async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ?',
    [email],
  )

  return rows[0]
}

export async function createUser({ nombre, email, password, rol }) {
  const [result] = await pool.execute(
    'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
    [nombre, email, password, rol],
  )

  return result.insertId
}