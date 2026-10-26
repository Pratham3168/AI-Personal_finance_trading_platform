const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'auth_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.status = status
    this.body = body || {}
    // { fieldName: 'message' } built from the backend's 422 `errors` array
    this.fieldErrors = {}
    if (Array.isArray(this.body.errors)) {
      for (const e of this.body.errors) {
        if (e.field && !this.fieldErrors[e.field]) this.fieldErrors[e.field] = e.message
      }
    }
  }
}

export async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include', // lets the backend's httpOnly cookie work too
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Unable to reach the server. Please check your connection and try again.', 0)
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    throw new ApiError(data?.message || 'Something went wrong. Please try again.', res.status, data)
  }
  return data
}
