import { useState } from 'react'

const AUTH_STORAGE_KEY = 'mindi_auth'

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const loadAuth = () => parseJson(localStorage.getItem(AUTH_STORAGE_KEY), { token: '', user: null })

export const useAuth = () => {
  const initialAuth = loadAuth()
  const [token, setToken] = useState(initialAuth.token || '')
  const [currentUser, setCurrentUser] = useState(initialAuth.user || null)
  const [loading, setLoading] = useState(false)

  const updateAuth = (newToken, newUser) => {
    setToken(newToken)
    setCurrentUser(newUser)
    if (newToken && newUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: newToken, user: newUser }))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }

  // Backend API URL (FastAPI on port 8000)
  const API_BASE = 'http://localhost:8000'

  const login = async ({ email, password }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const rawPassword = String(password || '')

    if (!normalizedEmail || !rawPassword) {
      return { ok: false, error: 'Please enter email and password' }
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: rawPassword })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { ok: false, error: errorData.error || 'Login failed' }
      }

      const data = await response.json()
      
      // Store JWT token and user info
      const jwtToken = data.token
      updateAuth(jwtToken, {
        id: data.user_id,
        email: data.email,
        createdAt: new Date().toISOString()
      })

      return { ok: true }
    } catch (error) {
      return { ok: false, error: 'Network error: ' + error.message }
    } finally {
      setLoading(false)
    }
  }

  const register = async ({ email, password, confirmPassword }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const rawPassword = String(password || '')

    if (!normalizedEmail || !rawPassword) {
      return { ok: false, error: 'Please enter email and password' }
    }
    if (rawPassword !== String(confirmPassword || '')) {
      return { ok: false, error: 'Password confirmation does not match' }
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: rawPassword })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { ok: false, error: errorData.error || 'Registration failed' }
      }

      const data = await response.json()
      
      // Automatically log them in after registration
      // For now, we need to call login to get JWT token
      return login({ email: normalizedEmail, password: rawPassword })
    } catch (error) {
      return { ok: false, error: 'Network error: ' + error.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    updateAuth('', null)
    return { ok: true }
  }

  return {
    token,
    currentUser,
    isAuthenticated: !!token && !!currentUser,
    loading,
    login,
    register,
    logout,
  }
}
