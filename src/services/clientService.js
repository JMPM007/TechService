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
