import pool from '../config/db.js'

// Las fechas se calculan con NOW() de MySQL para no depender de la zona horaria del servidor Node.

export async function contarSolicitudesRecientes(usuarioId, minutos) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM password_reset_tokens
     WHERE usuario_id = ? AND creado_en > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [usuarioId, minutos],
  )
  return Number(rows[0].total)
}

// Crea un token nuevo e invalida los anteriores del usuario que no se hayan usado.
export async function crearTokenRecuperacion(usuarioId, tokenHash, minutosVigencia) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await connection.execute(
      'UPDATE password_reset_tokens SET usado_en = NOW() WHERE usuario_id = ? AND usado_en IS NULL',
      [usuarioId],
    )
    await connection.execute(
      `INSERT INTO password_reset_tokens (usuario_id, token_hash, expira_en)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [usuarioId, tokenHash, minutosVigencia],
    )
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function buscarTokenVigente(tokenHash) {
  const [rows] = await pool.execute(
    `SELECT t.id, t.usuario_id AS usuarioId, u.password
     FROM password_reset_tokens t
     INNER JOIN usuarios u ON u.id = t.usuario_id
     WHERE t.token_hash = ? AND t.usado_en IS NULL AND t.expira_en > NOW() AND u.activo = 1`,
    [tokenHash],
  )
  return rows[0] ?? null
}

// Marca el token como usado y actualiza la contraseña en una sola transacción.
// Devuelve false si otro request consumió el token o expiró entre la validación y este punto.
export async function consumirTokenYActualizarContrasena(tokenHash, passwordHash) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute(
      `SELECT id, usuario_id AS usuarioId FROM password_reset_tokens
       WHERE token_hash = ? AND usado_en IS NULL AND expira_en > NOW()
       FOR UPDATE`,
      [tokenHash],
    )
    const token = rows[0]
    if (!token) {
      await connection.rollback()
      return false
    }

    await connection.execute(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [passwordHash, token.usuarioId],
    )
    await connection.execute(
      'UPDATE password_reset_tokens SET usado_en = NOW() WHERE usuario_id = ? AND usado_en IS NULL',
      [token.usuarioId],
    )
    await connection.commit()
    return true
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
