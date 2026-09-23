import { apiRequest } from './api'

export function getEquipmentList(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiRequest(`/equipos${query}`)
}

export function getEquipmentById(equipmentId) {
  return apiRequest(`/equipos/${equipmentId}`)
}

export function registerEquipment(data) {
  return apiRequest('/equipos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateEquipment(equipmentId, data) {
  return apiRequest(`/equipos/${equipmentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function getServiceOrders(filters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.estado) params.set('estado', filters.estado)
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest(`/ordenes${query}`)
}

export function getServiceOrder(orderId) {
  return apiRequest(`/ordenes/${orderId}`)
}

export function createServiceOrder(data) {
  return apiRequest('/ordenes/servicio', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateOrderStatus(orderId, estado, observacion = '') {
  return apiRequest(`/ordenes/${orderId}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado, observacion }),
  })
}

export function assignOrderToTechnician(orderId, tecnicoId) {
  return apiRequest(`/ordenes/${orderId}/asignar`, {
    method: 'PATCH',
    body: JSON.stringify({ tecnicoId }),
  })
}

export function getTechnicians() {
  return apiRequest('/tecnicos')
}

export function registerTechnician(data) {
  return apiRequest('/tecnicos/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateTechnicianStatus(technicianId, estado) {
  return apiRequest(`/tecnicos/${technicianId}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}
