/**
 * Pruebas del controlador de recuperación de contraseña (HU-04).
 * El modelo y el servicio de correo se simulan: no se toca la base de datos ni se envían correos.
 */
import assert from 'node:assert/strict'
import { beforeEach, mock, test } from 'node:test'
import bcrypt from 'bcryptjs'
import { hashResetToken } from '../src/utils/passwordResetToken.js'

const userModel = {
  findUserByEmail: mock.fn(),
}
const passwordResetModel = {
  buscarTokenVigente: mock.fn(),
  consumirTokenYActualizarContrasena: mock.fn(),
  contarSolicitudesRecientes: mock.fn(),
  crearTokenRecuperacion: mock.fn(),
}
const mailService = {
  sendPasswordResetEmail: mock.fn(),
}

mock.module(new URL('../src/models/userModel.js', import.meta.url).href, { namedExports: userModel })
mock.module(new URL('../src/models/passwordResetModel.js', import.meta.url).href, { namedExports: passwordResetModel })
mock.module(new URL('../src/services/mailService.js', import.meta.url).href, { namedExports: mailService })

const {
  MENSAJE_SOLICITUD,
  MENSAJE_TOKEN_INVALIDO,
  requestPasswordReset,
  resetPassword,
  verifyResetToken,
} = await import('../src/controllers/passwordResetController.js')

const tokenValido = 'b'.repeat(64)
const usuario = { id: 7, nombre: 'Ana', email: 'ana@example.com', activo: 1 }

function mockResponse() {
  const res = { statusCode: 200, body: undefined }
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (body) => { res.body = body; return res }
  return res
}

beforeEach(() => {
  for (const fn of [
    ...Object.values(userModel),
    ...Object.values(passwordResetModel),
    ...Object.values(mailService),
  ]) {
    fn.mock.resetCalls()
    fn.mock.restore()
  }
  mailService.sendPasswordResetEmail.mock.mockImplementation(async () => {})
  passwordResetModel.contarSolicitudesRecientes.mock.mockImplementation(async () => 0)
  passwordResetModel.crearTokenRecuperacion.mock.mockImplementation(async () => {})
})

test('HU-04: responde 400 si la solicitud no trae un correo válido', async () => {
  const res = mockResponse()
  await requestPasswordReset({ body: { email: 'no-es-correo' } }, res)

  assert.equal(res.statusCode, 400)
  assert.equal(userModel.findUserByEmail.mock.callCount(), 0)
})

test('HU-04: con un correo registrado guarda el hash del token y envía el enlace', async () => {
  userModel.findUserByEmail.mock.mockImplementation(async () => usuario)
  const res = mockResponse()

  await requestPasswordReset({ body: { email: 'ANA@example.com' } }, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.mensaje, MENSAJE_SOLICITUD)
  assert.equal(userModel.findUserByEmail.mock.calls[0].arguments[0], 'ana@example.com')

  const [usuarioId, tokenHash, minutos] = passwordResetModel.crearTokenRecuperacion.mock.calls[0].arguments
  assert.equal(usuarioId, 7)
  assert.equal(minutos, 30)

  const correo = mailService.sendPasswordResetEmail.mock.calls[0].arguments[0]
  const tokenEnviado = new URL(correo.resetUrl).searchParams.get('token')
  assert.equal(correo.to, 'ana@example.com')
  assert.equal(hashResetToken(tokenEnviado), tokenHash, 'en BD debe quedar el hash del token enviado')
  assert.notEqual(tokenEnviado, tokenHash)
})

test('HU-04: con un correo no registrado responde igual y no crea token', async () => {
  userModel.findUserByEmail.mock.mockImplementation(async () => undefined)
  const res = mockResponse()

  await requestPasswordReset({ body: { email: 'nadie@example.com' } }, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.mensaje, MENSAJE_SOLICITUD)
  assert.equal(passwordResetModel.crearTokenRecuperacion.mock.callCount(), 0)
  assert.equal(mailService.sendPasswordResetEmail.mock.callCount(), 0)
})

test('HU-04: no envía enlaces a cuentas desactivadas', async () => {
  userModel.findUserByEmail.mock.mockImplementation(async () => ({ ...usuario, activo: 0 }))
  const res = mockResponse()

  await requestPasswordReset({ body: { email: 'ana@example.com' } }, res)

  assert.equal(res.body.mensaje, MENSAJE_SOLICITUD)
  assert.equal(passwordResetModel.crearTokenRecuperacion.mock.callCount(), 0)
})

test('HU-04: limita las solicitudes repetidas sin revelarlo en la respuesta', async () => {
  userModel.findUserByEmail.mock.mockImplementation(async () => usuario)
  passwordResetModel.contarSolicitudesRecientes.mock.mockImplementation(async () => 3)
  const res = mockResponse()

  await requestPasswordReset({ body: { email: 'ana@example.com' } }, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.mensaje, MENSAJE_SOLICITUD)
  assert.equal(passwordResetModel.crearTokenRecuperacion.mock.callCount(), 0)
})

test('HU-04: un fallo al enviar el correo no cambia la respuesta al usuario', async (t) => {
  t.mock.method(console, 'error', () => {})
  userModel.findUserByEmail.mock.mockImplementation(async () => usuario)
  mailService.sendPasswordResetEmail.mock.mockImplementation(async () => { throw new Error('SMTP caído') })
  const res = mockResponse()

  await requestPasswordReset({ body: { email: 'ana@example.com' } }, res)
  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.mensaje, MENSAJE_SOLICITUD)
})

test('HU-04: la validación del enlace acepta un token vigente', async () => {
  passwordResetModel.buscarTokenVigente.mock.mockImplementation(async () => ({ id: 1, usuarioId: 7 }))
  const res = mockResponse()

  await verifyResetToken({ params: { token: tokenValido } }, res)

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { valido: true })
  assert.equal(passwordResetModel.buscarTokenVigente.mock.calls[0].arguments[0], hashResetToken(tokenValido))
})

test('HU-04: la validación del enlace rechaza tokens expirados, usados o mal formados', async () => {
  passwordResetModel.buscarTokenVigente.mock.mockImplementation(async () => null)

  for (const token of [tokenValido, 'mal-formado']) {
    const res = mockResponse()
    await verifyResetToken({ params: { token } }, res)
    assert.equal(res.statusCode, 400)
    assert.equal(res.body.mensaje, MENSAJE_TOKEN_INVALIDO)
  }
})

test('HU-04: restablece la contraseña guardándola con hash y consumiendo el token', async () => {
  const passwordActual = await bcrypt.hash('Anterior123', 4)
  passwordResetModel.buscarTokenVigente.mock.mockImplementation(async () => ({ id: 1, usuarioId: 7, password: passwordActual }))
  passwordResetModel.consumirTokenYActualizarContrasena.mock.mockImplementation(async () => true)
  const res = mockResponse()

  await resetPassword({
    body: { token: tokenValido, nuevaContrasena: 'Nueva1234', confirmacionContrasena: 'Nueva1234' },
  }, res)

  assert.equal(res.statusCode, 200)
  const [tokenHash, passwordHash] = passwordResetModel.consumirTokenYActualizarContrasena.mock.calls[0].arguments
  assert.equal(tokenHash, hashResetToken(tokenValido))
  assert.notEqual(passwordHash, 'Nueva1234')
  assert.equal(await bcrypt.compare('Nueva1234', passwordHash), true)
})

test('HU-04: no permite reutilizar la contraseña actual', async () => {
  const passwordActual = await bcrypt.hash('Anterior123', 4)
  passwordResetModel.buscarTokenVigente.mock.mockImplementation(async () => ({ id: 1, usuarioId: 7, password: passwordActual }))
  const res = mockResponse()

  await resetPassword({
    body: { token: tokenValido, nuevaContrasena: 'Anterior123', confirmacionContrasena: 'Anterior123' },
  }, res)

  assert.equal(res.statusCode, 400)
  assert.equal(passwordResetModel.consumirTokenYActualizarContrasena.mock.callCount(), 0)
})

test('HU-04: rechaza el restablecimiento con un token ya usado o expirado', async () => {
  passwordResetModel.buscarTokenVigente.mock.mockImplementation(async () => null)
  const res = mockResponse()

  await resetPassword({
    body: { token: tokenValido, nuevaContrasena: 'Nueva1234', confirmacionContrasena: 'Nueva1234' },
  }, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.mensaje, MENSAJE_TOKEN_INVALIDO)
  assert.equal(passwordResetModel.consumirTokenYActualizarContrasena.mock.callCount(), 0)
})

test('HU-04: si otro request consumió el token primero, responde como token inválido', async () => {
  const passwordActual = await bcrypt.hash('Anterior123', 4)
  passwordResetModel.buscarTokenVigente.mock.mockImplementation(async () => ({ id: 1, usuarioId: 7, password: passwordActual }))
  passwordResetModel.consumirTokenYActualizarContrasena.mock.mockImplementation(async () => false)
  const res = mockResponse()

  await resetPassword({
    body: { token: tokenValido, nuevaContrasena: 'Nueva1234', confirmacionContrasena: 'Nueva1234' },
  }, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.mensaje, MENSAJE_TOKEN_INVALIDO)
})
