import { apiRequest } from './apiClient'

const API_BASE_URL = 'http://localhost:8000'

export const registerApi = (email, password) =>
  fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(res => res.json())

export const loginApi = (email, password) =>
  fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(res => res.json())

export const getMeApi = (token) =>
  fetch(`${API_BASE_URL}/auth/me?token=${token}`).then(res => res.json())

export const updateProfileApi = (token, name) =>
  fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  }).then(res => res.json())
