const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const tokenPattern = /^[a-f0-9]{64}$/

// Política de contraseña de HU-04: 8 a 72 bytes (límite de bcrypt),
// con al menos una mayúscula, una minúscula y un número.
export function validatePasswordPolicy(password) {
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return 'La contraseña debe tener entre 8 y 72 caracteres.'
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos una mayúscula, una minúscula y un número.'
  }
  return null
}

export function isValidResetToken(token) {
  return typeof token === 'string' && tokenPattern.test(token)
}

export function validateForgotPassword(body) {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!emailPattern.test(email) || email.length > 100) {
    return { valid: false, message: 'Ingresa un correo electrónico válido.' }
  }

  return { valid: true, data: { email } }
}

export function validateResetPassword(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, message: 'Debes enviar los datos para restablecer la contraseña.' }
  }

  const { token, nuevaContrasena, confirmacionContrasena } = body

  if (!isValidResetToken(token)) {
    return { valid: false, message: 'El enlace no es válido o ha expirado.' }
  }
  if (typeof nuevaContrasena !== 'string' || typeof confirmacionContrasena !== 'string'
    || !nuevaContrasena || !confirmacionContrasena) {
    return { valid: false, message: 'Completa todos los campos de contraseña.' }
  }

  const policyError = validatePasswordPolicy(nuevaContrasena)
  if (policyError) {
    return { valid: false, message: policyError }
  }
  if (nuevaContrasena !== confirmacionContrasena) {
    return { valid: false, message: 'La confirmación de contraseña no coincide.' }
  }

  return { valid: true, data: { token, nuevaContrasena } }
}
