import { apiRequest } from './apiClient'

export const registerApi = (input) =>
  apiRequest('/api/auth/register', { method: 'POST', body: input })

export const loginApi = (input) => apiRequest('/api/auth/login', { method: 'POST', body: input })

export const getMeApi = (token) => apiRequest('/api/auth/me', { token })

export const updateProfileApi = (token, name) =>
  apiRequest('/api/auth/profile', { method: 'PUT', token, body: { name } })
