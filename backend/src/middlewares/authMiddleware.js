import jwt from 'jsonwebtoken'
import { findUserAuthStatus } from '../models/userModel.js'

export async function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization

  if (!authorization) {
    return res.status(401).json({
      mensaje: 'Debes iniciar sesión para acceder a este recurso.',
    })
  }

  const [scheme, token] = authorization.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      mensaje: 'El token de autenticación no es válido.',
    })
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      mensaje: 'JWT_SECRET no está configurado en el servidor.',
    })
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({
      mensaje: 'La sesión no es válida o ha expirado.',
    })
  }

  const userId = Number(payload.sub ?? payload.id)
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(401).json({
      mensaje: 'El token no contiene un usuario válido.',
    })
  }

  try {
    const dbUser = await findUserAuthStatus(userId)
    if (!dbUser || Number(dbUser.activo) === 0) {
      return res.status(403).json({
        mensaje: 'Esta cuenta ha sido desactivada o ya no existe.',
      })
    }

    req.user = {
      id: userId,
      rol: dbUser.rol,
    }

    return next()
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      mensaje: 'No fue posible validar la sesión.',
    })
  }
}

export const verifyToken = authenticateToken

export function authorizeRoles(...rolesPermitidos) {
  const roles = rolesPermitidos.flat()

  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({
        mensaje: 'No tienes permisos para realizar esta acción.',
      })
    }

    return next()
  }
}