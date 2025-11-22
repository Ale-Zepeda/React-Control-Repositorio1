const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  let data = null
  try {
    data = await res.json()
  } catch (_) {
    data = null
  }
  if (!res.ok) {
    const err = new Error((data && (data.error || data.message)) || `HTTP ${res.status}`)
    err.status = res.status
    err.details = data
    throw err
  }
  return data
}
