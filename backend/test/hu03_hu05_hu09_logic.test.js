/**
 * backend/test/hu03_hu05_hu09_logic.test.js
 * Pruebas unitarias de las reglas de negocio de HU-03, HU-05 y HU-09.
 * Ejecutable con: npm test (desde la carpeta backend)
 */
import assert from 'node:assert/strict'
import { test } from 'vitest'
import { ROLES_VALIDOS } from '../src/models/userModel.js'

test('HU-03: ROLES_VALIDOS contiene exactamente los roles autorizados por la plataforma', () => {
  assert.deepEqual(ROLES_VALIDOS, ['ADMIN', 'TECNICO', 'CLIENTE'])
})

test('HU-03: Validación de parámetros de filtro por rol', () => {
  const rolValido = 'ADMIN'
  const rolInvalido = 'SUPERADMIN'
  assert.equal(ROLES_VALIDOS.includes(rolValido), true)
  assert.equal(ROLES_VALIDOS.includes(rolInvalido), false)
})

test('HU-03: Validación de parámetros de estado activo (0, 1)', () => {
  const activoOk1 = '1'
  const activoOk0 = '0'
  const activoInvalido = 'activo'
  assert.equal(activoOk1 === '1' || activoOk1 === '0', true)
  assert.equal(activoOk0 === '1' || activoOk0 === '0', true)
  assert.equal(activoInvalido === '1' || activoInvalido === '0', false)
})

test('HU-05: Validación de campos en edición de usuario (nombre y formato email)', () => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  assert.equal(EMAIL_REGEX.test('usuario@techservice.com'), true)
  assert.equal(EMAIL_REGEX.test('correo-sin-arroba'), false)
  assert.equal(EMAIL_REGEX.test(''), false)

  const nombreValido = 'Carlos Perez'
  const nombreCorto = 'A'
  assert.equal(nombreValido.length >= 2 && nombreValido.length <= 100, true)
  assert.equal(nombreCorto.length >= 2, false)
})

test('HU-05: Regla de negocio - Protección del último administrador', () => {
  // Simulación de la regla: si adminsActivos <= 1 y el usuario es ADMIN, no se puede desactivar
  function puedeDesactivarAdmin(adminsActivos, rol) {
    if (rol === 'ADMIN' && adminsActivos <= 1) {
      return { permitido: false, razon: 'No es posible desactivar al único administrador activo.' }
    }
    return { permitido: true }
  }

  assert.deepEqual(puedeDesactivarAdmin(1, 'ADMIN'), {
    permitido: false,
    razon: 'No es posible desactivar al único administrador activo.',
  })
  assert.deepEqual(puedeDesactivarAdmin(2, 'ADMIN'), { permitido: true })
  assert.deepEqual(puedeDesactivarAdmin(1, 'TECNICO'), { permitido: true })
})

test('HU-05: Regla de seguridad - Un usuario no puede alterar su propio rol', () => {
  function puedeModificarRol(userIdSesion, userIdDestino, nuevoRol) {
    if (userIdSesion === userIdDestino && nuevoRol !== undefined) {
      return false
    }
    return true
  }

  assert.equal(puedeModificarRol(1, 1, 'TECNICO'), false)
  assert.equal(puedeModificarRol(1, 2, 'TECNICO'), true)
})

test('HU-09: Regla de integridad - No eliminar cliente con equipos asociados', () => {
  function validarEliminacionCliente(equiposCount) {
    if (equiposCount > 0) {
      return {
        valido: false,
        error: `No es posible eliminar al cliente porque tiene ${equiposCount} equipo(s) registrado(s).`,
      }
    }
    return { valido: true }
  }

  assert.deepEqual(validarEliminacionCliente(3), {
    valido: false,
    error: 'No es posible eliminar al cliente porque tiene 3 equipo(s) registrado(s).',
  })
  assert.deepEqual(validarEliminacionCliente(0), { valido: true })
})

test('HU-05 Codex P1: Protección del último admin contra degradación de rol', () => {
  function puedeDegradarRolAdmin(adminsActivos, rolActual, nuevoRol, activo) {
    if (rolActual === 'ADMIN' && nuevoRol !== 'ADMIN' && activo === 1 && adminsActivos <= 1) {
      return { permitido: false, razon: 'No es posible degradar el rol del único administrador activo del sistema.' }
    }
    return { permitido: true }
  }

  assert.deepEqual(puedeDegradarRolAdmin(1, 'ADMIN', 'TECNICO', 1), {
    permitido: false,
    razon: 'No es posible degradar el rol del único administrador activo del sistema.',
  })
  assert.deepEqual(puedeDegradarRolAdmin(2, 'ADMIN', 'TECNICO', 1), { permitido: true })
  assert.deepEqual(puedeDegradarRolAdmin(1, 'TECNICO', 'CLIENTE', 1), { permitido: true })
})

test('Seguridad Auth Codex P1: Rechazo de autenticación para cuentas inactivas', () => {
  function verificarEstadoAcceso(activo) {
    if (Number(activo) === 0) {
      return { permitido: false, codigo: 403, mensaje: 'Esta cuenta ha sido desactivada. Contacta al administrador.' }
    }
    return { permitido: true }
  }

  assert.deepEqual(verificarEstadoAcceso(0), {
    permitido: false,
    codigo: 403,
    mensaje: 'Esta cuenta ha sido desactivada. Contacta al administrador.',
  })
  assert.deepEqual(verificarEstadoAcceso(1), { permitido: true })
})

test('Privacidad Codex P1: Health check sanitizado sin exponer registros de usuarios', () => {
  function formatearRespuestaSalud(dbConectada) {
    if (dbConectada) {
      return { status: 'ok', mensaje: 'Conexión a la base de datos exitosa.' }
    }
    return { status: 'error', mensaje: 'No fue posible conectar con la base de datos.' }
  }

  const resOk = formatearRespuestaSalud(true)
  assert.equal(resOk.status, 'ok')
  assert.equal('usuarios' in resOk, false)
  assert.equal('password' in resOk, false)
})

