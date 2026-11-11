/**
 * Pruebas unitarias de las reglas de HU-04: política de contraseña, validación
 * de solicitudes y generación del token temporal.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isValidResetToken,
  validateForgotPassword,
  validatePasswordPolicy,
  validateResetPassword,
} from '../src/validators/passwordResetValidators.js'
import {
  buildResetUrl,
  DEFAULT_TOKEN_TTL_MINUTES,
  generateResetToken,
  getTokenTtlMinutes,
  hashResetToken,
} from '../src/utils/passwordResetToken.js'

const tokenValido = 'a'.repeat(64)

test('HU-04: la política acepta una contraseña con mayúscula, minúscula y número', () => {
  assert.equal(validatePasswordPolicy('Segura123'), null)
})

test('HU-04: la política rechaza contraseñas cortas, largas o sin variedad de caracteres', () => {
  for (const password of ['Corta1', 'A1' + 'a'.repeat(71), 'sinmayuscula1', 'SINMINUSCULA1', 'SinNumeros', undefined]) {
    assert.notEqual(validatePasswordPolicy(password), null, `debería rechazar ${password}`)
  }
})

test('HU-04: normaliza el correo de la solicitud de recuperación', () => {
  const result = validateForgotPassword({ email: '  Ana@Example.COM ' })
  assert.deepEqual(result, { valid: true, data: { email: 'ana@example.com' } })
})

test('HU-04: rechaza una solicitud sin correo válido', () => {
  assert.equal(validateForgotPassword({ email: 'correo-invalido' }).valid, false)
  assert.equal(validateForgotPassword({}).valid, false)
  assert.equal(validateForgotPassword(undefined).valid, false)
})

test('HU-04: acepta un restablecimiento válido', () => {
  const result = validateResetPassword({
    token: tokenValido,
    nuevaContrasena: 'Nueva1234',
    confirmacionContrasena: 'Nueva1234',
  })
  assert.deepEqual(result, { valid: true, data: { token: tokenValido, nuevaContrasena: 'Nueva1234' } })
})

test('HU-04: rechaza un restablecimiento con token mal formado', () => {
  const result = validateResetPassword({
    token: 'token-inventado',
    nuevaContrasena: 'Nueva1234',
    confirmacionContrasena: 'Nueva1234',
  })
  assert.equal(result.valid, false)
})

test('HU-04: rechaza contraseñas que no coinciden o que no cumplen la política', () => {
  assert.equal(validateResetPassword({
    token: tokenValido, nuevaContrasena: 'Nueva1234', confirmacionContrasena: 'Otra1234',
  }).valid, false)
  assert.equal(validateResetPassword({
    token: tokenValido, nuevaContrasena: 'debil', confirmacionContrasena: 'debil',
  }).valid, false)
  assert.equal(validateResetPassword({ token: tokenValido }).valid, false)
})

test('HU-04: genera tokens aleatorios de 64 caracteres hexadecimales y guarda solo su hash', () => {
  const primero = generateResetToken()
  const segundo = generateResetToken()

  assert.equal(isValidResetToken(primero.token), true)
  assert.notEqual(primero.token, segundo.token)
  assert.equal(primero.tokenHash, hashResetToken(primero.token))
  assert.notEqual(primero.tokenHash, primero.token)
})

test('HU-04: la vigencia del token es configurable y vuelve a 30 minutos si el valor es inválido', () => {
  assert.equal(getTokenTtlMinutes({}), DEFAULT_TOKEN_TTL_MINUTES)
  assert.equal(getTokenTtlMinutes({ PASSWORD_RESET_TTL_MINUTES: '15' }), 15)
  assert.equal(getTokenTtlMinutes({ PASSWORD_RESET_TTL_MINUTES: '-5' }), DEFAULT_TOKEN_TTL_MINUTES)
  assert.equal(getTokenTtlMinutes({ PASSWORD_RESET_TTL_MINUTES: 'abc' }), DEFAULT_TOKEN_TTL_MINUTES)
})

test('HU-04: arma el enlace de restablecimiento con la URL del frontend', () => {
  assert.equal(
    buildResetUrl(tokenValido, { FRONTEND_URL: 'https://techservice.app/' }),
    `https://techservice.app/restablecer-contrasena?token=${tokenValido}`,
  )
  assert.equal(
    buildResetUrl(tokenValido, {}),
    `http://localhost:5173/restablecer-contrasena?token=${tokenValido}`,
  )
})
