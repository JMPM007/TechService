import crypto from 'node:crypto'
import process from 'node:process'

export const DEFAULT_TOKEN_TTL_MINUTES = 30
export const MAX_REQUESTS_PER_WINDOW = 3
export const REQUEST_WINDOW_MINUTES = 15

// El token viaja solo en el enlace del correo; en la base de datos se guarda su hash.
export function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex')
  return { token, tokenHash: hashResetToken(token) }
}

export function getTokenTtlMinutes(env = process.env) {
  const minutes = Number(env.PASSWORD_RESET_TTL_MINUTES)
  return Number.isInteger(minutes) && minutes > 0 && minutes <= 1440
    ? minutes
    : DEFAULT_TOKEN_TTL_MINUTES
}

export function buildResetUrl(token, env = process.env) {
  const baseUrl = (env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')
  return `${baseUrl}/restablecer-contrasena?token=${token}`
}
