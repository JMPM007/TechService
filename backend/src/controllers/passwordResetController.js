import bcrypt from 'bcryptjs'
import { findUserByEmail } from '../models/userModel.js'
import {
  buscarTokenVigente,
  consumirTokenYActualizarContrasena,
  contarSolicitudesRecientes,
  crearTokenRecuperacion,
} from '../models/passwordResetModel.js'
import { sendPasswordResetEmail } from '../services/mailService.js'
import {
  buildResetUrl,
  generateResetToken,
  getTokenTtlMinutes,
  hashResetToken,
  MAX_REQUESTS_PER_WINDOW,
  REQUEST_WINDOW_MINUTES,
} from '../utils/passwordResetToken.js'
import {
  isValidResetToken,
  validateForgotPassword,
  validateResetPassword,
} from '../validators/passwordResetValidators.js'

// Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados.
export const MENSAJE_SOLICITUD =
  'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.'
export const MENSAJE_TOKEN_INVALIDO = 'El enlace no es válido o ha expirado. Solicita uno nuevo.'

export async function requestPasswordReset(req, res) {
  const validation = validateForgotPassword(req.body)
  if (!validation.valid) {
    return res.status(400).json({ mensaje: validation.message })
  }

  try {
    const user = await findUserByEmail(validation.data.email)
    const puedeRecuperar = user && Number(user.activo) !== 0
      && await contarSolicitudesRecientes(user.id, REQUEST_WINDOW_MINUTES) < MAX_REQUESTS_PER_WINDOW

    if (puedeRecuperar) {
      const { token, tokenHash } = generateResetToken()
      const minutosVigencia = getTokenTtlMinutes()
      await crearTokenRecuperacion(user.id, tokenHash, minutosVigencia)

      // El correo se envía sin esperar la respuesta para que el tiempo de respuesta
      // no delate si la cuenta existe.
      sendPasswordResetEmail({
        to: user.email,
        nombre: user.nombre,
        resetUrl: buildResetUrl(token),
        minutosVigencia,
      }).catch((error) => {
        console.error('No fue posible enviar el correo de recuperación:', error.message)
      })
    }

    return res.json({ mensaje: MENSAJE_SOLICITUD })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible procesar la solicitud. Inténtalo nuevamente.' })
  }
}

export async function verifyResetToken(req, res) {
  const { token } = req.params
  if (!isValidResetToken(token)) {
    return res.status(400).json({ valido: false, mensaje: MENSAJE_TOKEN_INVALIDO })
  }

  try {
    const registro = await buscarTokenVigente(hashResetToken(token))
    if (!registro) {
      return res.status(400).json({ valido: false, mensaje: MENSAJE_TOKEN_INVALIDO })
    }
    return res.json({ valido: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible validar el enlace. Inténtalo nuevamente.' })
  }
}

export async function resetPassword(req, res) {
  const validation = validateResetPassword(req.body)
  if (!validation.valid) {
    return res.status(400).json({ mensaje: validation.message })
  }

  const { token, nuevaContrasena } = validation.data
  const tokenHash = hashResetToken(token)

  try {
    const registro = await buscarTokenVigente(tokenHash)
    if (!registro) {
      return res.status(400).json({ mensaje: MENSAJE_TOKEN_INVALIDO })
    }
    if (await bcrypt.compare(nuevaContrasena, registro.password)) {
      return res.status(400).json({ mensaje: 'La nueva contraseña debe ser diferente a la actual.' })
    }

    const passwordHash = await bcrypt.hash(nuevaContrasena, 12)
    const actualizado = await consumirTokenYActualizarContrasena(tokenHash, passwordHash)
    if (!actualizado) {
      return res.status(400).json({ mensaje: MENSAJE_TOKEN_INVALIDO })
    }

    return res.json({ mensaje: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'No fue posible restablecer la contraseña. Inténtalo nuevamente.' })
  }
}
