import assert from 'node:assert/strict'
import test from 'node:test'
import {
  validatePasswordChange,
  validateProfileUpdate,
} from '../src/validators/profileValidators.js'

test('normaliza correctamente un perfil válido', () => {
  const result = validateProfileUpdate({
    nombre: ' Ana Torres ',
    email: 'ANA@EXAMPLE.COM ',
  })

  assert.equal(result.valid, true)
  assert.deepEqual(result.data, {
    nombre: 'Ana Torres',
    email: 'ana@example.com',
  })
})

test('rechaza un correo inválido', () => {
  const result = validateProfileUpdate({ email: 'correo-invalido' })

  assert.equal(result.valid, false)
})

test('rechaza payloads inválidos o sin campos útiles para perfil', () => {
  const noBody = validateProfileUpdate(null)
  const emptyBody = validateProfileUpdate({})
  const blankName = validateProfileUpdate({ nombre: ' ' })

  assert.equal(noBody.valid, false)
  assert.equal(emptyBody.valid, false)
  assert.equal(blankName.valid, false)
})

test('rechaza nombre o correo con longitudes inválidas', () => {
  const longName = validateProfileUpdate({ nombre: 'A'.repeat(101) })
  const longEmail = validateProfileUpdate({ email: `${'a'.repeat(101)}@mail.com` })

  assert.equal(longName.valid, false)
  assert.equal(longEmail.valid, false)
})

test('acepta una contraseña válida', () => {
  const result = validatePasswordChange({
    contrasenaActual: 'Anterior123',
    nuevaContrasena: 'Nueva1234',
    confirmacionContrasena: 'Nueva1234',
  })

  assert.equal(result.valid, true)
})

test('rechaza contraseñas que no coinciden', () => {
  const result = validatePasswordChange({
    contrasenaActual: 'Anterior123',
    nuevaContrasena: 'Nueva1234',
    confirmacionContrasena: 'Otra1234',
  })

  assert.equal(result.valid, false)
})

test('rechaza datos inválidos al cambiar contraseña', () => {
  const noBody = validatePasswordChange(undefined)
  const missingValues = validatePasswordChange({
    contrasenaActual: 'Anterior123',
    nuevaContrasena: '',
    confirmacionContrasena: 'Nueva1234',
  })
  const shortPassword = validatePasswordChange({
    contrasenaActual: 'Anterior123',
    nuevaContrasena: '1234567',
    confirmacionContrasena: '1234567',
  })
  const tooLongPassword = validatePasswordChange({
    contrasenaActual: 'Anterior123',
    nuevaContrasena: 'ñ'.repeat(80),
    confirmacionContrasena: 'ñ'.repeat(80),
  })

  assert.equal(noBody.valid, false)
  assert.equal(missingValues.valid, false)
  assert.equal(shortPassword.valid, false)
  assert.equal(tooLongPassword.valid, false)
})