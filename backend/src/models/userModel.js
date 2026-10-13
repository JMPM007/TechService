import pool from '../config/db.js'

export const ROLES_VALIDOS = ['ADMIN', 'TECNICO', 'CLIENTE']

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
    'SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE email = ?',
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

export async function listarUsuarios({ rol = '', activo = '' } = {}) {
  const conditions = []
  const params = []

  if (rol && ROLES_VALIDOS.includes(rol)) {
    conditions.push('rol = ?')
    params.push(rol)
  }

  if (activo === '1' || activo === '0') {
    conditions.push('activo = ?')
    params.push(Number(activo))
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const [rows] = await pool.query(
    `SELECT id, nombre, email, rol, activo, creado_en AS creadoEn
     FROM usuarios
     ${where}
     ORDER BY nombre ASC`,
    params,
  )

  return rows
}

export async function findUserById(id) {
  const [rows] = await pool.execute(
    'SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?',
    [id],
  )
  return rows[0] ?? null
}

async function cambiarEstadoUsuarioTransaccionalUnaVez(id, nuevoEstado) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [adminRows] = await connection.execute(
      "SELECT id FROM usuarios WHERE rol = 'ADMIN' AND activo = 1 ORDER BY id FOR UPDATE",
    )
    const [rows] = await connection.execute(
      'SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE',
      [id],
    )
    const usuario = rows[0]
    if (!usuario) {
      await connection.rollback()
      return { exito: false, codigo: 404, mensaje: 'Usuario no encontrado.' }
    }

    if (Number(usuario.activo) === nuevoEstado) {
      await connection.rollback()
      return {
        exito: false,
        codigo: 409,
        mensaje: `El usuario ya se encuentra ${nuevoEstado ? 'activo' : 'inactivo'}.`,
      }
    }

    if (nuevoEstado === 0 && usuario.rol === 'ADMIN' && adminRows.length <= 1) {
      await connection.rollback()
      return {
        exito: false,
        codigo: 409,
        mensaje: 'No es posible desactivar al único administrador activo del sistema.',
      }
    }

    await connection.execute(
      'UPDATE usuarios SET activo = ? WHERE id = ?',
      [nuevoEstado, id],
    )
    await connection.commit()

    const [actualizado] = await connection.execute(
      'SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?',
      [id],
    )
    return { exito: true, usuario: actualizado[0] }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function cambiarEstadoUsuarioTransaccional(id, nuevoEstado) {
  for (let intento = 0; intento < 3; intento += 1) {
    try {
      return await cambiarEstadoUsuarioTransaccionalUnaVez(id, nuevoEstado)
    } catch (error) {
      if (error.code !== 'ER_LOCK_DEADLOCK' && error.errno !== 1213) throw error
      if (intento === 2) throw error
    }
  }
}

async function editarUsuarioTransaccionalUnaVez(id, { nombre, email, rol }) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [adminRows] = await connection.execute(
      "SELECT id FROM usuarios WHERE rol = 'ADMIN' AND activo = 1 ORDER BY id FOR UPDATE",
    )
    const [rows] = await connection.execute(
      'SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE',
      [id],
    )
    const usuario = rows[0]
    if (!usuario) {
      await connection.rollback()
      return { exito: false, codigo: 404, mensaje: 'Usuario no encontrado.' }
    }

    if (rol !== undefined && rol !== 'ADMIN' && usuario.rol === 'ADMIN' && Number(usuario.activo) === 1
      && adminRows.length <= 1) {
      await connection.rollback()
      return {
        exito: false,
        codigo: 409,
        mensaje: 'No es posible degradar el rol del único administrador activo del sistema.',
      }
    }

    const fields = []
    const params = []
    if (nombre !== undefined) { fields.push('nombre = ?'); params.push(nombre) }
    if (email !== undefined) { fields.push('email = ?'); params.push(email) }
    if (rol !== undefined) { fields.push('rol = ?'); params.push(rol) }

    params.push(id)
    await connection.execute(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
      params,
    )
    await connection.commit()

    const [actualizado] = await connection.execute(
      'SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?',
      [id],
    )
    return { exito: true, usuario: actualizado[0] }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function editarUsuarioTransaccional(id, datos) {
  for (let intento = 0; intento < 3; intento += 1) {
    try {
      return await editarUsuarioTransaccionalUnaVez(id, datos)
    } catch (error) {
      if (error.code !== 'ER_LOCK_DEADLOCK' && error.errno !== 1213) throw error
      if (intento === 2) throw error
    }
  }
}