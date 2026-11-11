/**
 * Pruebas unitarias del middleware de autenticación y autorización por rol (HU-32).
 * jsonwebtoken firma tokens reales con el JWT_SECRET de pruebas; el modelo de
 * usuarios se simula para no consultar la base de datos.
 */
import jwt from 'jsonwebtoken'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { authenticateToken, authorizeRoles } from '../src/middlewares/authMiddleware.js'
import { findUserAuthStatus } from '../src/models/userModel.js'
import { mockRequest, mockResponse } from './helpers/http.js'

vi.mock('../src/models/userModel.js', () => ({
  findUserAuthStatus: vi.fn(),
}))

function requestConToken(token) {
  return mockRequest({ headers: { authorization: `Bearer ${token}` } })
}

function firmar(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET)
}

describe('authenticateToken', () => {
  let res
  let next

  beforeEach(() => {
    res = mockResponse()
    next = vi.fn()
  })

  test('responde 401 cuando no se envía el encabezado Authorization', async () => {
    await authenticateToken(mockRequest(), res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  test('responde 401 cuando el esquema no es Bearer', async () => {
    await authenticateToken(mockRequest({ headers: { authorization: 'Basic abc' } }), res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'El token de autenticación no es válido.' })
  })

  test('responde 500 cuando JWT_SECRET no está configurado', async () => {
    vi.stubEnv('JWT_SECRET', '')

    await authenticateToken(requestConToken('cualquiera'), res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    vi.unstubAllEnvs()
  })

  test('responde 401 cuando el token está firmado con otra clave', async () => {
    const token = jwt.sign({ sub: 1 }, 'otra-clave')

    await authenticateToken(requestConToken(token), res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'La sesión no es válida o ha expirado.' })
  })

  test('responde 401 cuando el token no contiene un id de usuario válido', async () => {
    await authenticateToken(requestConToken(firmar({ sub: 'abc' })), res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(findUserAuthStatus).not.toHaveBeenCalled()
  })

  test('responde 403 cuando la cuenta está desactivada', async () => {
    findUserAuthStatus.mockResolvedValue({ rol: 'TECNICO', activo: 0 })

    await authenticateToken(requestConToken(firmar({ sub: 4 })), res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  test('responde 403 cuando el usuario ya no existe', async () => {
    findUserAuthStatus.mockResolvedValue(null)

    await authenticateToken(requestConToken(firmar({ sub: 4 })), res, next)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  test('adjunta el usuario a req y continúa cuando el token y la cuenta son válidos', async () => {
    findUserAuthStatus.mockResolvedValue({ rol: 'ADMIN', activo: 1 })
    const req = requestConToken(firmar({ id: 9 }))

    await authenticateToken(req, res, next)

    expect(findUserAuthStatus).toHaveBeenCalledWith(9)
    expect(req.user).toEqual({ id: 9, rol: 'ADMIN' })
    expect(next).toHaveBeenCalledOnce()
  })

  test('responde 500 cuando falla la consulta del usuario', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    findUserAuthStatus.mockRejectedValue(new Error('BD caída'))

    await authenticateToken(requestConToken(firmar({ sub: 4 })), res, next)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('authorizeRoles', () => {
  test('permite el acceso cuando el rol del usuario está autorizado', () => {
    const next = vi.fn()

    authorizeRoles('ADMIN', 'TECNICO')(mockRequest({ user: { id: 1, rol: 'TECNICO' } }), mockResponse(), next)

    expect(next).toHaveBeenCalledOnce()
  })

  test('acepta los roles como arreglo', () => {
    const next = vi.fn()

    authorizeRoles(['ADMIN'])(mockRequest({ user: { id: 1, rol: 'ADMIN' } }), mockResponse(), next)

    expect(next).toHaveBeenCalledOnce()
  })

  test('responde 403 cuando el rol no está autorizado', () => {
    const res = mockResponse()
    const next = vi.fn()

    authorizeRoles('ADMIN')(mockRequest({ user: { id: 2, rol: 'CLIENTE' } }), res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  test('responde 403 cuando la petición no está autenticada', () => {
    const res = mockResponse()

    authorizeRoles('ADMIN')(mockRequest(), res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(403)
  })
})
