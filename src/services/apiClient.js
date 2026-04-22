const resolveApiBaseUrl = () => {
  const normalizeBase = (value) =>
    String(value || '')
      .trim()
      .replace(/\/+$/, '')
      .replace(/\/api\/chat$/i, '')
      .replace(/\/api$/i, '')

  const apiBase = normalizeBase(import.meta.env.VITE_API_BASE_URL)
  const apiUrl = normalizeBase(import.meta.env.VITE_API_URL)

  if (apiBase && apiUrl) {
    const host = window.location.hostname
    const isLocalHost = host === 'localhost' || host === '127.0.0.1'
    const baseIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(apiBase)

    if (isLocalHost) {
      return baseIsLocal ? apiBase : apiUrl
    }

    return baseIsLocal ? apiUrl : apiBase
  }

  if (apiBase) return apiBase
  if (apiUrl) return apiUrl
  return 'http://localhost:4000'
}

const API_BASE_URL = resolveApiBaseUrl()

const buildUrl = (path, query) => {
  const url = new URL(`${API_BASE_URL}${path}`)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url.toString()
}

export const apiRequest = async (path, { method = 'GET', token, body, query } = {}) => {
  let response

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error('Cannot connect to API server. Run npm run server')
  }

  if (response.status === 204) {
    return null
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed')
  }

  return payload
}
