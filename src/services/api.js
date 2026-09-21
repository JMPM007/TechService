const BASE_URL = "/api"

async function handleResponse(response) {
  const data = await response.json()
  if (!response.ok) {
    const errorMsg = data.error || data.detalles?.join(", ") || "Error en la petición"
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}

export const api = {
  // Equipos
  async getEquipos(search = "") {
    const url = search ? `${BASE_URL}/equipos?search=${encodeURIComponent(search)}` : `${BASE_URL}/equipos`
    const res = await fetch(url)
    return handleResponse(res)
  },

  async getEquipoById(id) {
    const res = await fetch(`${BASE_URL}/equipos/${id}`)
    return handleResponse(res)
  },

  async getEquipoBySerie(serie) {
    const res = await fetch(`${BASE_URL}/equipos/serie/${encodeURIComponent(serie)}`)
    return handleResponse(res)
  },

  async updateEquipo(id, equipoData) {
    const res = await fetch(`${BASE_URL}/equipos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(equipoData)
    })
    return handleResponse(res)
  },

  async createEquipo(equipoData) {
    const res = await fetch(`${BASE_URL}/equipos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(equipoData)
    })
    return handleResponse(res)
  },

  // Órdenes de servicio
  async getOrdenes({ search = "", estado = "" } = {}) {
    const params = new URLSearchParams()
    if (search) params.append("search", search)
    if (estado) params.append("estado", estado)
    const queryString = params.toString() ? `?${params.toString()}` : ""
    const res = await fetch(`${BASE_URL}/ordenes${queryString}`)
    return handleResponse(res)
  },

  async getOrdenById(id) {
    const res = await fetch(`${BASE_URL}/ordenes/${id}`)
    return handleResponse(res)
  },

  async createOrden(ordenData) {
    const res = await fetch(`${BASE_URL}/ordenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ordenData)
    })
    return handleResponse(res)
  },

  // Clientes y Técnicos
  async getClientes() {
    const res = await fetch(`${BASE_URL}/clientes`)
    return handleResponse(res)
  },

  async getTecnicos() {
    const res = await fetch(`${BASE_URL}/clientes/tecnicos`)
    return handleResponse(res)
  }
}
