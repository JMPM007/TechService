/**
 * Pruebas del controlador de recuperación de contraseña (HU-04).
 * El modelo y el servicio de correo se simulan: no se toca la base de datos ni se envían correos.
 */
import bcrypt from 'bcryptjs'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  MENSAJE_SOLICITUD,
  MENSAJE_TOKEN_INVALIDO,
  requestPasswordReset,
  resetPassword,
  verifyResetToken,
} from '../src/controllers/passwordResetController.js'
import { findUserByEmail } from '../src/models/userModel.js'
import {
  buscarTokenVigente,
  consumirTokenYActualizarContrasena,
  contarSolicitudesRecientes,
  crearTokenRecuperacion,
} from '../src/models/passwordResetModel.js'
import { sendPasswordResetEmail } from '../src/services/mailService.js'
import { hashResetToken } from '../src/utils/passwordResetToken.js'
import { mockRequest, mockResponse } from './helpers/http.js'

vi.mock('../src/models/userModel.js', () => ({
  findUserByEmail: vi.fn(),
}))

vi.mock('../src/models/passwordResetModel.js', () => ({
  buscarTokenVigente: vi.fn(),
  consumirTokenYActualizarContrasena: vi.fn(),
  contarSolicitudesRecientes: vi.fn(),
  crearTokenRecuperacion: vi.fn(),
}))

vi.mock('../src/services/mailService.js', () => ({
  sendPasswordResetEmail: vi.fn(),
}))

const tokenValido = 'b'.repeat(64)
const usuario = { id: 7, nombre: 'Ana', email: 'ana@example.com', activo: 1 }
const cuerpoValido = { token: tokenValido, nuevaContrasena: 'Nueva1234', confirmacionContrasena: 'Nueva1234' }

let res

beforeEach(() => {
  res = mockResponse()
  sendPasswordResetEmail.mockResolvedValue()
  contarSolicitudesRecientes.mockResolvedValue(0)
  crearTokenRecuperacion.mockResolvedValue()
})

describe('requestPasswordReset', () => {
  test('responde 400 si la solicitud no trae un correo válido', async () => {
    await requestPasswordReset(mockRequest({ body: { email: 'no-es-correo' } }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(findUserByEmail).not.toHaveBeenCalled()
  })

  test('con un correo registrado guarda el hash del token y envía el enlace', async () => {
    findUserByEmail.mockResolvedValue(usuario)

    await requestPasswordReset(mockRequest({ body: { email: 'ANA@example.com' } }), res)

    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ mensaje: MENSAJE_SOLICITUD })
    expect(findUserByEmail).toHaveBeenCalledWith('ana@example.com')

    const [usuarioId, tokenHash, minutos] = crearTokenRecuperacion.mock.calls[0]
    expect(usuarioId).toBe(7)
    expect(minutos).toBe(30)

    const correo = sendPasswordResetEmail.mock.calls[0][0]
    const tokenEnviado = new URL(correo.resetUrl).searchParams.get('token')
    expect(correo.to).toBe('ana@example.com')
    expect(hashResetToken(tokenEnviado)).toBe(tokenHash)
    expect(tokenEnviado).not.toBe(tokenHash)
  })

  test('con un correo no registrado responde igual y no crea token', async () => {
    findUserByEmail.mockResolvedValue(undefined)

    await requestPasswordReset(mockRequest({ body: { email: 'nadie@example.com' } }), res)

    expect(res.json).toHaveBeenCalledWith({ mensaje: MENSAJE_SOLICITUD })
    expect(crearTokenRecuperacion).not.toHaveBeenCalled()
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  test('no envía enlaces a cuentas desactivadas', async () => {
    findUserByEmail.mockResolvedValue({ ...usuario, activo: 0 })

    await requestPasswordReset(mockRequest({ body: { email: 'ana@example.com' } }), res)

    expect(res.json).toHaveBeenCalledWith({ mensaje: MENSAJE_SOLICITUD })
    expect(crearTokenRecuperacion).not.toHaveBeenCalled()
  })

  test('limita las solicitudes repetidas sin revelarlo en la respuesta', async () => {
    findUserByEmail.mockResolvedValue(usuario)
    contarSolicitudesRecientes.mockResolvedValue(3)

    await requestPasswordReset(mockRequest({ body: { email: 'ana@example.com' } }), res)

    expect(res.json).toHaveBeenCalledWith({ mensaje: MENSAJE_SOLICITUD })
    expect(crearTokenRecuperacion).not.toHaveBeenCalled()
  })

  test('un fallo al enviar el correo no cambia la respuesta al usuario', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    findUserByEmail.mockResolvedValue(usuario)
    sendPasswordResetEmail.mockRejectedValue(new Error('SMTP caído'))

    await requestPasswordReset(mockRequest({ body: { email: 'ana@example.com' } }), res)
    await new Promise((resolve) => setImmediate(resolve))

    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ mensaje: MENSAJE_SOLICITUD })
  })
})

describe('verifyResetToken', () => {
  test('acepta un token vigente', async () => {
    buscarTokenVigente.mockResolvedValue({ id: 1, usuarioId: 7 })

    await verifyResetToken(mockRequest({ params: { token: tokenValido } }), res)

    expect(res.json).toHaveBeenCalledWith({ valido: true })
    expect(buscarTokenVigente).toHaveBeenCalledWith(hashResetToken(tokenValido))
  })

  test.each([
    ['vencido o ya usado', tokenValido],
    ['mal formado', 'mal-formado'],
  ])('rechaza un token %s', async (_caso, token) => {
    buscarTokenVigente.mockResolvedValue(null)

    await verifyResetToken(mockRequest({ params: { token } }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ valido: false, mensaje: MENSAJE_TOKEN_INVALIDO })
  })
})

describe('resetPassword', () => {
  test('guarda la nueva contraseña con hash y consume el token', async () => {
    buscarTokenVigente.mockResolvedValue({ id: 1, usuarioId: 7, password: await bcrypt.hash('Anterior123', 4) })
    consumirTokenYActualizarContrasena.mockResolvedValue(true)

    await resetPassword(mockRequest({ body: cuerpoValido }), res)

    expect(res.status).not.toHaveBeenCalled()
    const [tokenHash, passwordHash] = consumirTokenYActualizarContrasena.mock.calls[0]
    expect(tokenHash).toBe(hashResetToken(tokenValido))
    expect(passwordHash).not.toBe('Nueva1234')
    expect(await bcrypt.compare('Nueva1234', passwordHash)).toBe(true)
  })

  test('no permite reutilizar la contraseña actual', async () => {
    buscarTokenVigente.mockResolvedValue({ id: 1, usuarioId: 7, password: await bcrypt.hash('Anterior123', 4) })

    await resetPassword(mockRequest({
      body: { token: tokenValido, nuevaContrasena: 'Anterior123', confirmacionContrasena: 'Anterior123' },
    }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(consumirTokenYActualizarContrasena).not.toHaveBeenCalled()
  })

  test('rechaza un token ya usado o vencido', async () => {
    buscarTokenVigente.mockResolvedValue(null)

    await resetPassword(mockRequest({ body: cuerpoValido }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: MENSAJE_TOKEN_INVALIDO })
    expect(consumirTokenYActualizarContrasena).not.toHaveBeenCalled()
  })

  test('si otro request consumió el token primero, responde como token inválido', async () => {
    buscarTokenVigente.mockResolvedValue({ id: 1, usuarioId: 7, password: await bcrypt.hash('Anterior123', 4) })
    consumirTokenYActualizarContrasena.mockResolvedValue(false)

    await resetPassword(mockRequest({ body: cuerpoValido }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ mensaje: MENSAJE_TOKEN_INVALIDO })
  })
})
