import { useState } from 'react'

const AUTH_STORAGE_KEY = 'mindi_auth'
const USERS_STORAGE_KEY = 'mindi_users'

const createId = () =>
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const loadUsers = () => parseJson(localStorage.getItem(USERS_STORAGE_KEY), [])

const saveUsers = (users) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

const loadAuth = () => parseJson(localStorage.getItem(AUTH_STORAGE_KEY), { token: '', user: null })

export const useAuth = () => {
  const initialAuth = loadAuth()
  const [token, setToken] = useState(initialAuth.token || '')
  const [currentUser, setCurrentUser] = useState(initialAuth.user || null)

  const updateAuth = (newToken, newUser) => {
    setToken(newToken)
    setCurrentUser(newUser)
    if (newToken && newUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: newToken, user: newUser }))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }

  const login = async ({ email, password }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const rawPassword = String(password || '')

    if (!normalizedEmail || !rawPassword) {
      return { ok: false, error: 'Please enter email and password' }
    }

    const users = loadUsers()
    const found = users.find(
      (user) => user.email === normalizedEmail && user.password === rawPassword,
    )

    if (!found) {
      return { ok: false, error: 'Invalid email or password' }
    }

    updateAuth(createId(), {
      id: found.id,
      email: found.email,
      createdAt: found.createdAt,
    })

    return { ok: true }
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

    const users = loadUsers()
    if (users.some((user) => user.email === normalizedEmail)) {
      return { ok: false, error: 'Email already exists' }
    }

    const now = new Date().toISOString()
    const id = createId()

    saveUsers([
      ...users,
      {
        id,
        email: normalizedEmail,
        password: rawPassword,
        createdAt: now,
      },
    ])

    updateAuth(createId(), {
      id,
      email: normalizedEmail,
      createdAt: now,
    })

    return { ok: true }
  }

  const logout = () => {
    updateAuth('', null)
  }

  return {
    token,
    isAuthenticated: Boolean(token && currentUser),
    currentUser,
    login,
    register,
    logout,
  }
}
