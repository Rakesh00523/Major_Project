/* oxlint-disable react/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from 'react'
import { getAuthHeaders } from './authStorage'

const API_BASE =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `${window.location.protocol}//${window.location.hostname}:4001/api`
    : '/api'

const POLL_MS = 3000

// Talks to control-api/server.mjs, a local Node server that connects to
// Minikube via kubectl. Authenticates with credentials and bearer session token.
export function useLiveCluster() {
  const [available, setAvailable] = useState(null) // null = checking
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, {
        credentials: 'include',
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000),
      })
      if (!res.ok) {
        setAvailable(false)
        return false
      }
      const data = await res.json()
      const isReady = Boolean(data.ok && data.cluster !== false)
      setAvailable(isReady)
      return isReady
    } catch {
      setAvailable(false)
      return false
    }
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/status`, {
        credentials: 'include',
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `status ${res.status}`)
      }
      setStatus(await res.json())
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    let isSubscribed = true
    checkHealth().then((ok) => {
      if (isSubscribed) setAvailable(ok)
    })
    return () => {
      isSubscribed = false
    }
  }, [checkHealth])

  function startPolling() {
    stopPolling()
    fetchStatus()
    pollRef.current = setInterval(fetchStatus, POLL_MS)
  }

  function stopPolling() {
    clearInterval(pollRef.current)
  }

  async function deploy(injectFailure) {
    setBusy(true)
    try {
      const res = await fetch(`${API_BASE}/deploy`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ injectFailure }),
      })
      if (!res.ok) throw new Error(`deploy failed: ${res.status}`)
      startPolling()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function restore() {
    setBusy(true)
    try {
      const res = await fetch(`${API_BASE}/restore`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error(`restore failed: ${res.status}`)
      await fetchStatus()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => stopPolling, [])

  return { available, status, busy, error, deploy, restore, startPolling, stopPolling, checkHealth }
}
