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

// ── HU-09: Buscar cliente por id ──────────────────────────────────────────
export async function buscarClientePorId(id) {
  const [rows] = await pool.execute(
    'SELECT id, usuario_id, cedula, nombres, apellidos, telefono, email, creado_en FROM clientes WHERE id = ?',
    [id],
  )
  return rows[0] ?? null
}

// ── HU-09: Verificar dependencias que bloquearían la eliminación física ───
export async function contarEquiposDelCliente(clienteId) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM equipos WHERE cliente_id = ?',
    [clienteId],
  )
  return rows[0].total
}

// ── HU-09: Eliminación física (solo cuando no tiene equipos registrados) ──
export async function eliminarCliente(id) {
  const [result] = await pool.execute(
    'DELETE FROM clientes WHERE id = ?',
    [id],
  )
  return result
}

// ── HU-09: Eliminación atómica transaccional (evita cascada concurrente) ──
export async function eliminarClienteTransaccional(id) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [clientes] = await connection.execute(
      'SELECT id, nombres, apellidos FROM clientes WHERE id = ? FOR UPDATE',
      [id],
    )
    const cliente = clientes[0]
    if (!cliente) {
      await connection.rollback()
      return { exito: false, codigo: 404, error: 'El cliente no existe o ya fue eliminado.' }
    }

    const [equipos] = await connection.execute(
      'SELECT COUNT(*) AS total FROM equipos WHERE cliente_id = ? FOR UPDATE',
      [id],
    )
    const equiposAsociados = equipos[0].total
    if (equiposAsociados > 0) {
      await connection.rollback()
      return {
        exito: false,
        codigo: 409,
        error: `No es posible eliminar al cliente porque tiene ${equiposAsociados} equipo(s) registrado(s). Primero elimina o reasigna los equipos.`,
      }
    }

    await connection.execute('DELETE FROM clientes WHERE id = ?', [id])
    await connection.commit()
    return { exito: true, cliente }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
