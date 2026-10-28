import assert from 'node:assert/strict'
import test from 'node:test'
import {
  validatePasswordChange,
  validateProfileUpdate,
} from '../src/validators/profileValidators.js'

const passwordValido = {
  contrasenaActual: 'Anterior123',
  nuevaContrasena: 'Nueva1234',
  confirmacionContrasena: 'Nueva1234',
}

// ---------- validateProfileUpdate ----------

test('perfil: rechaza un cuerpo ausente o que no es un objeto', () => {
  assert.equal(validateProfileUpdate(null).valid, false)
  assert.equal(validateProfileUpdate(undefined).valid, false)
  assert.equal(validateProfileUpdate('texto').valid, false)
})

test('perfil: rechaza un nombre demasiado corto', () => {
  assert.equal(validateProfileUpdate({ nombre: 'A' }).valid, false)
})

test('perfil: rechaza un nombre de más de 100 caracteres', () => {
  assert.equal(validateProfileUpdate({ nombre: 'a'.repeat(101) }).valid, false)
})

test('perfil: rechaza un nombre que no es texto', () => {
  assert.equal(validateProfileUpdate({ nombre: 12345 }).valid, false)
})

test('perfil: rechaza un correo de más de 100 caracteres', () => {
  const correoLargo = `${'a'.repeat(95)}@x.com`
  assert.equal(validateProfileUpdate({ email: correoLargo }).valid, false)
})

test('perfil: rechaza un correo que no es texto', () => {
  assert.equal(validateProfileUpdate({ email: 42 }).valid, false)
})

test('perfil: rechaza un objeto sin ningún dato para actualizar', () => {
  assert.equal(validateProfileUpdate({}).valid, false)
  assert.equal(validateProfileUpdate({ otroCampo: 'x' }).valid, false)
})

test('perfil: acepta actualizar solo el nombre', () => {
  const result = validateProfileUpdate({ nombre: ' Luis ' })
  assert.equal(result.valid, true)
  assert.deepEqual(result.data, { nombre: 'Luis' })
})

test('perfil: acepta actualizar solo el correo', () => {
  const result = validateProfileUpdate({ email: ' Luis@Correo.com ' })
  assert.equal(result.valid, true)
  assert.deepEqual(result.data, { email: 'luis@correo.com' })
})

// ---------- validatePasswordChange ----------

test('contraseña: rechaza un cuerpo ausente o que no es un objeto', () => {
  assert.equal(validatePasswordChange(null).valid, false)
  assert.equal(validatePasswordChange(undefined).valid, false)
  assert.equal(validatePasswordChange('texto').valid, false)
})

test('contraseña: rechaza campos faltantes', () => {
  assert.equal(validatePasswordChange({ nuevaContrasena: 'Nueva1234' }).valid, false)
})

test('contraseña: rechaza campos vacíos o solo con espacios', () => {
  const result = validatePasswordChange({ ...passwordValido, contrasenaActual: '   ' })
  assert.equal(result.valid, false)
})

test('contraseña: rechaza una nueva contraseña de menos de 8 caracteres', () => {
  const result = validatePasswordChange({
    ...passwordValido,
    nuevaContrasena: 'Ab1',
    confirmacionContrasena: 'Ab1',
  })
  assert.equal(result.valid, false)
})

test('contraseña: rechaza una nueva contraseña de más de 72 bytes', () => {
  const larga = 'a'.repeat(73)
  const result = validatePasswordChange({
    ...passwordValido,
    nuevaContrasena: larga,
    confirmacionContrasena: larga,
  })
  assert.equal(result.valid, false)
})

test('contraseña: devuelve solo la actual y la nueva cuando es válida', () => {
  const result = validatePasswordChange(passwordValido)
  assert.equal(result.valid, true)
  assert.deepEqual(result.data, {
    contrasenaActual: 'Anterior123',
    nuevaContrasena: 'Nueva1234',
  })
})