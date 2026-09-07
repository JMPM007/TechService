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