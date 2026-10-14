import pool from '../config/db.js'

// Roles válidos del sistema
export const ROLES_VALIDOS = ['ADMIN', 'TECNICO', 'CLIENTE']

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

// ── HU-03: Listar usuarios con filtros opcionales de rol y estado ──────────
/**
 * @param {object} filtros
 * @param {string} [filtros.rol]    - Valor del ENUM: ADMIN | TECNICO | CLIENTE
 * @param {string} [filtros.activo] - '1' activos, '0' inactivos, '' todos
 */
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

// ── HU-05: Buscar usuario por id (sin exponer password) ───────────────────
export async function findUserById(id) {
  const [rows] = await pool.execute(
    'SELECT id, nombre, email, rol, activo, creado_en AS creadoEn FROM usuarios WHERE id = ?',
    [id],
  )
  return rows[0] ?? null
}

// ── HU-05: Actualizar nombre, email o rol de un usuario ───────────────────
export async function updateUser(id, { nombre, email, rol }) {
  const fields = []
  const params = []

  if (nombre !== undefined) { fields.push('nombre = ?'); params.push(nombre) }
  if (email !== undefined)  { fields.push('email = ?');  params.push(email) }
  if (rol !== undefined)    { fields.push('rol = ?');    params.push(rol) }

  if (fields.length === 0) return null

  params.push(id)
  const [result] = await pool.execute(
    `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
    params,
  )
  return result
}

// ── HU-05: Desactivar (baja lógica) un usuario ────────────────────────────
export async function desactivarUsuario(id) {
  const [result] = await pool.execute(
    'UPDATE usuarios SET activo = 0 WHERE id = ?',
    [id],
  )
  return result
}

// ── HU-05: Reactivar un usuario ───────────────────────────────────────────
export async function activarUsuario(id) {
  const [result] = await pool.execute(
    'UPDATE usuarios SET activo = 1 WHERE id = ?',
    [id],
  )
  return result
}

// ── HU-05: Conteo de admins activos (protección del último admin) ─────────
export async function contarAdminsActivos() {
  const [rows] = await pool.execute(
    "SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'ADMIN' AND activo = 1",
  )
  return rows[0].total
}

// ── Verificación rápida de estado y rol para authMiddleware ────────────────
export async function findUserAuthStatus(id) {
  const [rows] = await pool.execute(
    'SELECT id, rol, activo FROM usuarios WHERE id = ?',
    [id],
  )
  return rows[0] ?? null
}

// ── Mutación atómica de estado (protege al último admin bajo concurrencia) ─
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

    if (usuario.activo === nuevoEstado) {
      await connection.rollback()
      return {
        exito: false,
        codigo: 409,
        mensaje: `El usuario ya se encuentra ${nuevoEstado ? 'activo' : 'inactivo'}.`,
      }
    }

    // Si se va a desactivar a un administrador, validar conteo con bloqueo
    if (nuevoEstado === 0 && usuario.rol === 'ADMIN') {
      if (adminRows.length <= 1) {
        await connection.rollback()
        return {
          exito: false,
          codigo: 409,
          mensaje: 'No es posible desactivar al único administrador activo del sistema.',
        }
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

// ── Mutación atómica de edición (protege contra degradar al último admin) ─
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

    // Si el usuario es ADMIN activo y se le cambia a un rol que no es ADMIN:
    if (rol !== undefined && rol !== 'ADMIN' && usuario.rol === 'ADMIN' && Number(usuario.activo) === 1) {
      if (adminRows.length <= 1) {
        await connection.rollback()
        return {
          exito: false,
          codigo: 409,
          mensaje: 'No es posible degradar el rol del único administrador activo del sistema.',
        }
      }
    }

    const fields = []
    const params = []
    if (nombre !== undefined) { fields.push('nombre = ?'); params.push(nombre) }
    if (email !== undefined)  { fields.push('email = ?');  params.push(email) }
    if (rol !== undefined)    { fields.push('rol = ?');    params.push(rol) }

    if (fields.length > 0) {
      params.push(id)
      await connection.execute(
        `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
        params,
      )
    }

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