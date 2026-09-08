const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function validateProfileUpdate(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, message: 'Debes enviar datos para actualizar.' }
  }

  const data = {}

  if (Object.hasOwn(body, 'nombre')) {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : ''

    if (nombre.length < 2 || nombre.length > 100) {
      return {
        valid: false,
        message: 'El nombre debe tener entre 2 y 100 caracteres.',
      }
    }

    data.nombre = nombre
  }

  if (Object.hasOwn(body, 'email')) {
    const email = typeof body.email === 'string'
      ? body.email.trim().toLowerCase()
      : ''

    if (!emailPattern.test(email) || email.length > 100) {
      return {
        valid: false,
        message: 'Ingresa un correo electrónico válido.',
      }
    }

    data.email = email
  }

  if (Object.keys(data).length === 0) {
    return {
      valid: false,
      message: 'Debes enviar al menos un dato para actualizar.',
    }
  }

  return { valid: true, data }
}

export function validatePasswordChange(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, message: 'Debes enviar los datos de contraseña.' }
  }

  const {
    contrasenaActual,
    nuevaContrasena,
    confirmacionContrasena,
  } = body

  if (![contrasenaActual, nuevaContrasena, confirmacionContrasena].every(isNonEmptyString)) {
    return {
      valid: false,
      message: 'Completa todos los campos de contraseña.',
    }
  }

  if (
    nuevaContrasena.length < 8
    || Buffer.byteLength(nuevaContrasena, 'utf8') > 72
  ) {
    return {
      valid: false,
      message: 'La nueva contraseña debe tener entre 8 y 72 caracteres.',
    }
  }

  if (nuevaContrasena !== confirmacionContrasena) {
    return {
      valid: false,
      message: 'La confirmación de contraseña no coincide.',
    }
  }

  return {
    valid: true,
    data: { contrasenaActual, nuevaContrasena },
  }
}