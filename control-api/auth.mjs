import bcrypt from 'bcryptjs'
import {
  createUser,
  findUserByEmail,
  findUserById,
  createSession,
  findSession,
  deleteSession,
} from './db.mjs'

const SALT_ROUNDS = 10
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

// In-memory rate limiting for brute force mitigation
const failedAttempts = new Map() // key: ip or email -> { count, lockedUntil }
const MAX_ATTEMPTS = 5
const LOCK_TIME_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(key) {
  const record = failedAttempts.get(key)
  if (!record) return { allowed: true }
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const remainingMin = Math.ceil((record.lockedUntil - Date.now()) / 60000)
    return {
      allowed: false,
      message: `Too many failed attempts. Account temporarily locked. Please try again in ${remainingMin} minute(s).`,
    }
  }
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    failedAttempts.delete(key)
    return { allowed: true }
  }
  return { allowed: true }
}

function recordFailedAttempt(key) {
  const record = failedAttempts.get(key) || { count: 0, lockedUntil: null }
  record.count += 1
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCK_TIME_MS
  }
  failedAttempts.set(key, record)
}

function clearFailedAttempts(key) {
  failedAttempts.delete(key)
}

export function validateRegistration({ name, email, password, confirmPassword }) {
  const errors = []
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Full name is required.')
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.')
  }
  if (!password || typeof password !== 'string') {
    errors.push('Password is required.')
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`)
  }
  if (password !== confirmPassword) {
    errors.push('Passwords do not match.')
  }
  return errors
}

export function validateLogin({ email, password }) {
  const errors = []
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Valid email is required.')
  }
  if (!password || typeof password !== 'string') {
    errors.push('Password is required.')
  }
  return errors
}

export function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS)
}

export function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash)
}

export function authMiddleware(db) {
  return (req, res, next) => {
    let sessionId = req.cookies?.pipeline_session

    if (!sessionId && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ')
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        sessionId = parts[1]
      }
    }

    if (!sessionId) {
      return res.status(401).json({ ok: false, error: 'Authentication required. Please sign in.' })
    }

    const session = findSession(db, sessionId)
    if (!session) {
      res.clearCookie('pipeline_session')
      return res.status(401).json({ ok: false, error: 'Session expired or invalid. Please sign in again.' })
    }

    req.user = {
      id: session.user_id,
      name: session.name,
      email: session.email,
      createdAt: session.created_at,
    }
    req.sessionId = sessionId
    next()
  }
}

export function handleRegister(db) {
  return async (req, res) => {
    try {
      const { name, email, password, confirmPassword } = req.body || {}
      const errors = validateRegistration({ name, email, password, confirmPassword })
      if (errors.length > 0) {
        return res.status(400).json({ ok: false, errors, error: errors[0] })
      }

      const existing = findUserByEmail(db, email)
      if (existing) {
        return res.status(409).json({
          ok: false,
          error: 'An account with this email address already exists.',
        })
      }

      const passwordHash = await hashPassword(password)
      const user = createUser(db, { name, email, passwordHash })
      const { sessionId } = createSession(db, user.id)

      res.cookie('pipeline_session', sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })

      return res.status(201).json({
        ok: true,
        message: 'Account created successfully.',
        user: { id: user.id, name: user.name, email: user.email },
        token: sessionId,
      })
    } catch (err) {
      console.error('[auth] registration error:', err.message)
      return res.status(500).json({ ok: false, error: 'Internal server error during registration.' })
    }
  }
}

export function handleLogin(db) {
  return async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body || {}
      const ip = req.ip || req.connection?.remoteAddress || 'unknown'
      const rateLimitKey = `${ip}:${email || ''}`

      const rateCheck = checkRateLimit(rateLimitKey)
      if (!rateCheck.allowed) {
        return res.status(429).json({ ok: false, error: rateCheck.message })
      }

      const errors = validateLogin({ email, password })
      if (errors.length > 0) {
        return res.status(400).json({ ok: false, errors, error: errors[0] })
      }

      const user = findUserByEmail(db, email)
      if (!user) {
        recordFailedAttempt(rateLimitKey)
        return res.status(401).json({ ok: false, error: 'Invalid email or password.' })
      }

      const isValid = await verifyPassword(password, user.password_hash)
      if (!isValid) {
        recordFailedAttempt(rateLimitKey)
        return res.status(401).json({ ok: false, error: 'Invalid email or password.' })
      }

      clearFailedAttempts(rateLimitKey)
      const ttlDays = rememberMe ? 30 : 7
      const { sessionId } = createSession(db, user.id, ttlDays)

      res.cookie('pipeline_session', sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: ttlDays * 24 * 60 * 60 * 1000,
      })

      return res.json({
        ok: true,
        message: 'Signed in successfully.',
        user: { id: user.id, name: user.name, email: user.email },
        token: sessionId,
      })
    } catch (err) {
      console.error('[auth] login error:', err.message)
      return res.status(500).json({ ok: false, error: 'Internal server error during authentication.' })
    }
  }
}

export function handleMe() {
  return (req, res) => {
    return res.json({
      ok: true,
      user: req.user,
    })
  }
}

export function handleLogout(db) {
  return (req, res) => {
    if (req.sessionId) {
      deleteSession(db, req.sessionId)
    }
    res.clearCookie('pipeline_session')
    return res.json({ ok: true, message: 'Signed out successfully.' })
  }
}
