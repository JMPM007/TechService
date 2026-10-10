import bcrypt from 'bcryptjs'
import pool from '../config/db.js'
import {
  validatePasswordChange,
  validateProfileUpdate,
} from '../validators/profileValidators.js'

const profileColumns = 'id, nombre, email, rol, creado_en AS creadoEn'

function handleDatabaseError(res, error) {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      mensaje: 'El correo electrónico ya está registrado.',
    })
  }

  console.error(error)

  return res.status(500).json({
    mensaje: 'Ocurrió un error al procesar la solicitud.',
  })
}

export async function getMyProfile(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT ${profileColumns} FROM usuarios WHERE id = ?`,
      [req.user.id],
    )

    if (rows.length === 0) {
      return res.status(404).json({
        mensaje: 'No se encontró el usuario de la sesión.',
      })
    }

    return res.json({ usuario: rows[0] })
  } catch (error) {
    return handleDatabaseError(res, error)
  }
}

export async function updateMyProfile(req, res) {
  const validation = validateProfileUpdate(req.body)

  if (!validation.valid) {
    return res.status(400).json({ mensaje: validation.message })
  }

  const fields = Object.entries(validation.data)
  const assignments = fields.map(([field]) => `${field} = ?`).join(', ')
  const values = [...fields.map(([, value]) => value), req.user.id]

  try {
    const [result] = await pool.execute(
      `UPDATE usuarios SET ${assignments} WHERE id = ?`,
      values,
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        mensaje: 'No se encontró el usuario de la sesión.',
      })
    }

    const [rows] = await pool.execute(
      `SELECT ${profileColumns} FROM usuarios WHERE id = ?`,
      [req.user.id],
    )

    return res.json({
      mensaje: 'Datos personales actualizados correctamente.',
      usuario: rows[0],
    })
  } catch (error) {
    return handleDatabaseError(res, error)
  }
}

export async function changeMyPassword(req, res) {
  const validation = validatePasswordChange(req.body)

  if (!validation.valid) {
    return res.status(400).json({ mensaje: validation.message })
  }

  const { contrasenaActual, nuevaContrasena } = validation.data

  try {
    const [rows] = await pool.execute(
      'SELECT id, password FROM usuarios WHERE id = ?',
      [req.user.id],
    )

    if (rows.length === 0) {
      return res.status(404).json({
        mensaje: 'No se encontró el usuario de la sesión.',
      })
    }

    const usuario = rows[0]
    const passwordCorrecta = await bcrypt.compare(
      contrasenaActual,
      usuario.password,
    )

    if (!passwordCorrecta) {
      return res.status(401).json({
        mensaje: 'La contraseña actual no es correcta.',
      })
    }

    const passwordRepetida = await bcrypt.compare(
      nuevaContrasena,
      usuario.password,
    )

    if (passwordRepetida) {
      return res.status(400).json({
        mensaje: 'La nueva contraseña debe ser diferente a la actual.',
      })
    }

    const passwordHash = await bcrypt.hash(nuevaContrasena, 12)

    await pool.execute(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [passwordHash, req.user.id],
    )

    return res.json({
      mensaje: 'Contraseña actualizada correctamente.',
    })
  } catch (error) {
    return handleDatabaseError(res, error)
  }
}