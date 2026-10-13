import pool from '../config/db.js'

export async function createClientUser({ nombre, email, password }) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const [userResult] = await connection.execute(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, password, 'CLIENTE'],
    )
    const userId = userResult.insertId
    const [clientResult] = await connection.execute(
      `INSERT INTO clientes
        (usuario_id, cedula, nombres, apellidos, telefono, email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, `USR-${userId}`, nombre, 'Por completar', 'No proporcionado', email],
    )
    await connection.commit()
    return { id: userId, clienteId: clientResult.insertId }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

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