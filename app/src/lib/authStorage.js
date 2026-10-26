export function getAuthToken() {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('pipeline_token')
}

export function setAuthToken(token) {
  if (typeof window === 'undefined') return
  if (token) {
    sessionStorage.setItem('pipeline_token', token)
  } else {
    sessionStorage.removeItem('pipeline_token')
  }
}

export function getAuthHeaders() {
  const token = getAuthToken()
  const headers = { Accept: 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}
