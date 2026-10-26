/* oxlint-disable react/only-export-components, react/set-state-in-effect */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getAuthToken, setAuthToken, getAuthHeaders } from './authStorage'

export { getAuthToken, setAuthToken, getAuthHeaders }

const AuthContext = createContext(null)

// In development, target the control-api backend port dynamically matching current hostname
const API_BASE =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `${window.location.protocol}//${window.location.hostname}:4001/api/auth`
    : '/api/auth'

async function parseResponse(res) {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error(
      `Unable to reach authentication server (status ${res.status}). Verify control-api is running on port 4001`,
    )
  }
}

export function AuthProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser && typeof initialUser === 'object' ? initialUser : null)
  const [loading, setLoading] = useState(initialUser === null)
  const [error, setError] = useState(null)

  const checkAuth = useCallback(async () => {
    if (initialUser !== null) return
    try {
      const res = await fetch(`${API_BASE}/me`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await parseResponse(res)
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [initialUser])

  useEffect(() => {
    let isSubscribed = true
    checkAuth().catch(() => {
      if (isSubscribed) setUser(null)
    })
    return () => {
      isSubscribed = false
    }
  }, [checkAuth])

  const login = async (email, password, rememberMe = false) => {
    setError(null)
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ email, password, rememberMe }),
    })
    const data = await parseResponse(res)
    if (!res.ok || !data.ok) {
      const errMsg = data.error || 'Failed to sign in. Please verify your credentials.'
      setError(errMsg)
      throw new Error(errMsg)
    }
    if (data.token) {
      setAuthToken(data.token)
    }
    setUser(data.user)
    return data.user
  }

  const register = async ({ name, email, password, confirmPassword }) => {
    setError(null)
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    })
    const data = await parseResponse(res)
    if (!res.ok || !data.ok) {
      const errMsg = data.error || (data.errors ? data.errors[0] : 'Registration failed.')
      setError(errMsg)
      throw new Error(errMsg)
    }
    if (data.token) {
      setAuthToken(data.token)
    }
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setAuthToken(null)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        checkAuth,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
