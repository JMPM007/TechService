const apiUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function request(path, options = {}, requireToken = true) {
  const headers = new Headers(options.headers)
  const token = localStorage.getItem('techservice_token') || localStorage.getItem('token')

  if (requireToken) {
    if (!token) {
      throw new ApiError('Debes iniciar sesión para realizar esta acción.', 401)
    }
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response
  try {
    response = await fetch(`${apiUrl}${path}`, { ...options, headers })
  } catch (error) {
    throw new ApiError('No fue posible conectar con el servidor.', 0, error)
  }

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const details = Array.isArray(body?.detalles) ? ` ${body.detalles.join(' ')}` : ''
    const message = body?.mensaje ?? body?.error ?? 'No fue posible procesar la solicitud.'
    throw new ApiError(`${message}${details}`, response.status, body)
  }

  return body
}

export function apiRequest(path, options = {}) {
  return request(path, options)
}

export function publicApiRequest(path, options = {}) {
  return request(path, options, false)
}

export const api = {
  getEquipos(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    return apiRequest(`/equipos${query}`)
  },

  getEquipoById(id) {
    return apiRequest(`/equipos/${id}`)
  },

  getEquipoBySerie(serie) {
    return apiRequest(`/equipos/serie/${encodeURIComponent(serie)}`)
  },

  updateEquipo(id, equipoData) {
    return apiRequest(`/equipos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(equipoData),
    })
  },

  createEquipo(equipoData) {
    return apiRequest('/equipos', {
      method: 'POST',
      body: JSON.stringify(equipoData),
    })
  },

  getOrdenes({ search = '', estado = '' } = {}) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (estado) params.set('estado', estado)
    const query = params.toString() ? `?${params}` : ''
    return apiRequest(`/ordenes${query}`)
  },

  getOrdenById(id) {
    return apiRequest(`/ordenes/${id}`)
  },

  createOrden(orderData) {
    return apiRequest('/ordenes/servicio', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  },

  getClientes(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    return apiRequest(`/clientes${query}`)
  },

  getTecnicos() {
    return apiRequest('/clientes/tecnicos')
  },
}
