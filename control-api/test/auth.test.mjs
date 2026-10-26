import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { initDb, createUser, findUserByEmail, findSession, deleteSession } from '../db.mjs'
import {
  validateRegistration,
  validateLogin,
  hashPassword,
  verifyPassword,
} from '../auth.mjs'
import { app } from '../server.mjs'

describe('Authentication & Security Unit Tests (Isolated Test DB)', () => {
  let testDb

  before(() => {
    testDb = initDb(':memory:')
  })

  test('Validation: rejects missing required registration fields', () => {
    const errs = validateRegistration({ name: '', email: '', password: '', confirmPassword: '' })
    assert.ok(errs.length >= 3, 'Should produce errors for all missing fields')
    assert.ok(errs.includes('Full name is required.'))
  })

  test('Validation: rejects invalid email formats', () => {
    const invalidEmails = ['notanemail', 'user@', 'user@domain', 'user.domain.com']
    for (const email of invalidEmails) {
      const errs = validateRegistration({
        name: 'Test User',
        email,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      })
      assert.ok(errs.includes('A valid email address is required.'), `Expected error for ${email}`)
    }
  })

  test('Validation: rejects password confirmation mismatch', () => {
    const errs = validateRegistration({
      name: 'Test User',
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'MismatchPassword!',
    })
    assert.ok(errs.includes('Passwords do not match.'))
  })

  test('Validation: rejects passwords shorter than 8 characters', () => {
    const errs = validateRegistration({
      name: 'Test User',
      email: 'user@example.com',
      password: '123',
      confirmPassword: '123',
    })
    assert.ok(errs.some((e) => e.includes('at least 8 characters')))
  })

  test('Password Hashing: never stores plaintext password', async () => {
    const plain = 'SecretPass123!'
    const hashed = await hashPassword(plain)
    assert.notEqual(hashed, plain, 'Password must not equal hash')
    assert.ok(hashed.startsWith('$2'), 'Hash must be a valid bcrypt string')

    const isValid = await verifyPassword(plain, hashed)
    assert.equal(isValid, true, 'Correct password must verify against hash')

    const isInvalid = await verifyPassword('WrongPassword', hashed)
    assert.equal(isInvalid, false, 'Wrong password must fail verification')
  })

  test('Persistence: creates and retrieves user in database', async () => {
    const passwordHash = await hashPassword('SecurePassword123')
    const user = createUser(testDb, {
      name: 'Alice Dev',
      email: 'alice@example.com',
      passwordHash,
    })

    assert.ok(user.id > 0)
    assert.equal(user.email, 'alice@example.com')

    const retrieved = findUserByEmail(testDb, 'alice@example.com')
    assert.ok(retrieved)
    assert.equal(retrieved.name, 'Alice Dev')
    assert.notEqual(retrieved.password_hash, 'SecurePassword123')
  })

  test('Duplicate Registration: prevents duplicate email registration', async () => {
    const passwordHash = await hashPassword('SecurePassword123')
    assert.throws(
      () => {
        createUser(testDb, {
          name: 'Alice Clone',
          email: 'alice@example.com',
          passwordHash,
        })
      },
      (err) => err.message.includes('UNIQUE constraint failed'),
    )
  })
})

describe('Authentication HTTP Integration & Endpoint Tests', () => {
  let server
  let baseUrl

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app)
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port
        baseUrl = `http://127.0.0.1:${port}`
        resolve()
      })
    })
  })

  after(() => {
    server.close()
  })

  test('Health check endpoint is open and healthy', async () => {
    const res = await fetch(`${baseUrl}/api/health`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.ok, true)
    assert.equal(data.database, 'connected')
  })

  test('Protected endpoint rejects unauthenticated request (401)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`)
    assert.equal(res.status, 401)
    const data = await res.json()
    assert.equal(data.ok, false)
  })

  test('Protected cluster route rejects unauthenticated request (401)', async () => {
    const res = await fetch(`${baseUrl}/api/status`)
    assert.equal(res.status, 401)
  })

  let testAuthCookie = ''
  let testAuthToken = ''

  test('POST /api/auth/register creates user and returns session', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Reviewer',
        email: `bob-${Date.now()}@pipeline.local`,
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
      }),
    })

    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.ok, true)
    assert.ok(data.user.id)
    assert.ok(data.token)
    testAuthToken = data.token

    const setCookie = res.headers.get('set-cookie')
    assert.ok(setCookie && setCookie.includes('pipeline_session='))
    testAuthCookie = setCookie.split(';')[0]
  })

  test('GET /api/auth/me returns current user with valid session cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: testAuthCookie },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.ok, true)
    assert.equal(data.user.name, 'Bob Reviewer')
  })

  test('GET /api/auth/me returns current user with Bearer token header', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testAuthToken}` },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.ok, true)
    assert.equal(data.user.name, 'Bob Reviewer')
  })

  test('POST /api/auth/login succeeds with correct credentials', async () => {
    const email = `login-test-${Date.now()}@pipeline.local`
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Login Tester',
        email,
        password: 'LoginPassword123!',
        confirmPassword: 'LoginPassword123!',
      }),
    })

    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'LoginPassword123!',
      }),
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.ok, true)
    assert.equal(data.user.email, email)
  })

  test('POST /api/auth/login fails with incorrect password (401)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'bob@pipeline.local',
        password: 'IncorrectPassword',
      }),
    })

    assert.equal(res.status, 401)
    const data = await res.json()
    assert.equal(data.ok, false)
    assert.equal(data.error, 'Invalid email or password.')
  })

  test('POST /api/auth/logout invalidates session and clears cookie', async () => {
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: testAuthCookie },
    })
    assert.equal(logoutRes.status, 200)

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: testAuthCookie },
    })
    assert.equal(meRes.status, 401)
  })
})
