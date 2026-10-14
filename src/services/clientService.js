import { apiRequest, publicApiRequest } from './api'

export function getClients(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiRequest(`/clientes${query}`)
}

export function registerClient(data) {
  return publicApiRequest('/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * HU-09 — Eliminar cliente por id.
 * @param {number} id
 */
export function deleteClient(id) {
  return apiRequest(`/clientes/${id}`, { method: 'DELETE' })
}
