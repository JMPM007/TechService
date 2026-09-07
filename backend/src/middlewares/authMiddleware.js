import jwt from 'jsonwebtoken'

export function authenticateToken(req, res, next) {
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

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const userId = Number(payload.sub ?? payload.id)

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        mensaje: 'El token no contiene un usuario válido.',
      })
    }

    req.user = {
      id: userId,
      rol: payload.rol ?? null,
    }

    return next()
  } catch {
    return res.status(401).json({
      mensaje: 'La sesión no es válida o ha expirado.',
    })
  }
}