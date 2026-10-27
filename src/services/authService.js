import { API_URL } from './api.js'

const AUTH_URL = `${API_URL}/usuarios`


export const registerUser = async (userData) => {
  const response = await fetch(`${AUTH_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  return response.json();
};


export const loginUser = async (credentials) => {
  const response = await fetch(`${AUTH_URL}/login`,{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  return response.json();
};


export const getProfile = async (token) => {
  const response = await fetch(`${AUTH_URL}/perfil`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};