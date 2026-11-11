import { vi } from 'vitest'

// Crea un objeto res de Express falso para probar controladores sin levantar el servidor.
export function mockResponse() {
  const res = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  res.send = vi.fn(() => res)
  return res
}

export function mockRequest({ params = {}, body = {}, query = {}, headers = {}, user } = {}) {
  return { params, body, query, headers, user }
}
