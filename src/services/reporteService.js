import { apiRequest } from './api'

export function getManagementReport(desde, hasta) {
  const params = new URLSearchParams({ desde, hasta })
  return apiRequest(`/reportes/gestion?${params}`)
}
