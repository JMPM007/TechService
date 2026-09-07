import { apiRequest } from './api'

export async function getMyProfile() {
  const response = await apiRequest('/perfil/me')
  return response.usuario
}

export async function updateMyProfile(data) {
  const response = await apiRequest('/perfil/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  return response.usuario
}

export function changeMyPassword(data) {
  return apiRequest('/perfil/me/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}