import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultDbPath = path.join(__dirname, 'data', 'pipeline.db')

export function initDb(dbPath = process.env.DB_PATH || defaultDbPath) {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Create tables if they do not exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `)

  return db
}

let defaultDb = null
export function getDb() {
  if (!defaultDb) {
    defaultDb = initDb()
  }
  return defaultDb
}

export function createUser(db, { name, email, passwordHash }) {
  const stmt = db.prepare(`
    INSERT INTO users (name, email, password_hash)
    VALUES (?, ?, ?)
  `)
  const info = stmt.run(name.trim(), email.trim().toLowerCase(), passwordHash)
  return {
    id: Number(info.lastInsertRowid),
    name: name.trim(),
    email: email.trim().toLowerCase(),
  }
}

export function findUserByEmail(db, email) {
  const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`)
  return stmt.get(email.trim().toLowerCase())
}

export function findUserById(db, id) {
  const stmt = db.prepare(`SELECT id, name, email, created_at FROM users WHERE id = ?`)
  return stmt.get(id)
}

export function createSession(db, userId, ttlDays = 7) {
  const sessionId = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + ttlDays * 24 * 60 * 60 * 1000
  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `)
  stmt.run(sessionId, userId, expiresAt)
  return { sessionId, expiresAt }
}

export function findSession(db, sessionId) {
  if (!sessionId) return null
  const stmt = db.prepare(`
    SELECT s.id, s.user_id, s.expires_at, u.name, u.email, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > ?
  `)
  return stmt.get(sessionId, Date.now())
}

export function deleteSession(db, sessionId) {
  if (!sessionId) return
  const stmt = db.prepare(`DELETE FROM sessions WHERE id = ?`)
  stmt.run(sessionId)
}

export function cleanExpiredSessions(db) {
  const stmt = db.prepare(`DELETE FROM sessions WHERE expires_at <= ?`)
  return stmt.run(Date.now()).changes
}
