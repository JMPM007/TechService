/**
 * userService.js
 * Servicios de administración de usuarios para HU-03 y HU-05.
 */
import { apiRequest } from './api'

/**
 * HU-03 — Listar usuarios con filtros opcionales.
 * @param {object} filtros
 * @param {string} [filtros.rol]    - ADMIN | TECNICO | CLIENTE | ''
 * @param {string} [filtros.activo] - '1' | '0' | ''
 */
export function getUsers({ rol = '', activo = '' } = {}) {
  const params = new URLSearchParams()
  if (rol)    params.set('rol', rol)
  if (activo !== '') params.set('activo', activo)
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest(`/usuarios${query}`)
}

/**
 * HU-05 — Obtener usuario por id.
 * @param {number} id
 */
export function getUser(id) {
  return apiRequest(`/usuarios/${id}`)
}

/**
 * HU-05 — Editar nombre, email o rol de un usuario.
 * @param {number} id
 * @param {object} data - { nombre?, email?, rol? }
 */
export function updateUser(id, data) {
  return apiRequest(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * HU-05 — Activar o desactivar un usuario.
 * @param {number} id
 * @param {boolean} activo
 */
export function setUserStatus(id, activo) {
  return apiRequest(`/usuarios/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ activo: activo ? 1 : 0 }),
  })
}
