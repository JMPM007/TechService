import { apiRequest } from './api'

export function getReceiptOrderData(orderId) {
  return apiRequest(`/ordenes/${orderId}/recepcion/datos`)
}

export function createReceipt(orderId, data) {
  return apiRequest(`/ordenes/${orderId}/recepcion/comprobante`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getReceipt(orderId) {
  return apiRequest(`/ordenes/${orderId}/recepcion/comprobante`)
}