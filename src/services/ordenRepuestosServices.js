import { apiRequest } from './api'

export async function agregarRepuestoAOrdenService(orden_id, repuesto_id, cantidad) {
  return apiRequest('/ordenes-repuestos', {
    method: 'POST',
    body: JSON.stringify({
      orden_id: Number(orden_id),
      repuesto_id: Number(repuesto_id),
      cantidad: Number(cantidad),
    }),
  })
}
