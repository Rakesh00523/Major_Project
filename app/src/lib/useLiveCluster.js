import { useCallback, useEffect, useRef, useState } from 'react'

const API_BASE = 'http://127.0.0.1:4001/api'
const POLL_MS = 3000

// Talks to control-api/server.mjs, a tiny local Node server that shells
// out to kubectl against the real Minikube cluster (see that file's
// comments for exactly what it runs). If it isn't running, `available`
// stays false and the Pipeline Control page falls back to the labeled
// demo simulation instead of ever showing fake data as if it were live.
export function useLiveCluster() {
  const [available, setAvailable] = useState(null) // null = checking
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) })
      setAvailable(res.ok)
      return res.ok
    } catch {
      setAvailable(false)
      return false
    }
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/status`, { signal: AbortSignal.timeout(4000) })
      if (!res.ok) throw new Error(`status ${res.status}`)
      setStatus(await res.json())
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    checkHealth()
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
        headers: { 'Content-Type': 'application/json' },
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
      await fetch(`${API_BASE}/restore`, { method: 'POST' })
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
