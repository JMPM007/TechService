const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('techservice_token')

  if (!token) {
    throw new ApiError('Debes iniciar sesión para realizar esta acción.', 401)
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)

  if (options.body) {
    headers.set('Content-Type', 'application/json')
  }

  let response

  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers,
    })
  } catch {
    throw new ApiError('No fue posible conectar con el servidor.', 0)
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      body?.mensaje ?? 'No fue posible procesar la solicitud.',
      response.status,
    )
  }

  return body
}