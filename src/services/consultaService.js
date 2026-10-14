import { apiRequest } from './api'

export function getOrderByCode(code) {
    return apiRequest(`/consultas/ordenes/${encodeURIComponent(code)}`)
}

export function getOrdersDashboard() {
    return apiRequest('/consultas/dashboard')
}

export function searchGlobal(term) {
    return apiRequest(`/consultas/buscar?q=${encodeURIComponent(term)}`)
}