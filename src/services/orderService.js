import { apiRequest } from './api'

export async function getOrderHistory(orderId) {
  const response = await apiRequest(`/ordenes/${orderId}/historial`)
  return response.historial
}

export async function getEquipment(equipmentId) {
  const response = await apiRequest(`/equipos/${equipmentId}`)
  return response.equipo
}

export function getOrderDiagnosis(orderId) {
  return apiRequest(`/ordenes/${orderId}/diagnostico`)
}

export function createOrderDiagnosis(orderId, data) {
  return apiRequest(`/ordenes/${orderId}/diagnostico`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function createNewDiagnosis(equipoId, data) {
  return apiRequest('/ordenes/diagnostico', {
    method: 'POST',
    body: JSON.stringify({ equipoId, ...data }),
  })
}

export function updateOrderDiagnosis(orderId, data) {
  return apiRequest(`/ordenes/${orderId}/diagnostico`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function getOrderQuote(orderId) {
  return apiRequest(`/ordenes/${orderId}/cotizacion`)
}

export function createOrderQuote(orderId, conceptos) {
  return apiRequest(`/ordenes/${orderId}/cotizacion`, {
    method: 'POST',
    body: JSON.stringify({ conceptos }),
  })
}

export function updateOrderQuoteConcepts(orderId, conceptos) {
  return apiRequest(`/ordenes/${orderId}/cotizacion/conceptos`, {
    method: 'PUT',
    body: JSON.stringify({ conceptos }),
  })
}

export function updateOrderQuoteStatus(orderId, estado) {
  return apiRequest(`/ordenes/${orderId}/cotizacion/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}
