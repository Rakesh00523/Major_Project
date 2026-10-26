// Local control and authentication API for the AI-Augmented CI/CD Pipeline.
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { getDb } from './db.mjs'
import {
  handleRegister,
  handleLogin,
  handleMe,
  handleLogout,
  authMiddleware,
} from './auth.mjs'

const NAMESPACE = 'pipeline-dev'
const ROLLOUT = 'pipeline-dashboard'
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4001

const HEALTHY_ARGS = ['-nginx.scrape-uri=http://127.0.0.1:8080/nginx_status']
const BROKEN_ARGS = ['-nginx.scrape-uri=http://127.0.0.1:8080/this-path-does-not-exist']

function kubectl(args) {
  return new Promise((resolve, reject) => {
    execFile('kubectl', args, { timeout: 15_000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message))
      resolve(stdout)
    })
  })
}

async function kubectlJson(args) {
  const out = await kubectl(args)
  return JSON.parse(out)
}

const db = getDb()
const app = express()

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true)
      }
      return callback(null, true)
    },
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())

// Public Health Check (used by container and k8s probes)
app.get('/api/health', async (_req, res) => {
  try {
    db.prepare('SELECT 1').get()
    let clusterHealthy = false
    try {
      await kubectl(['-n', NAMESPACE, 'get', 'rollout', ROLLOUT, '-o', 'name'])
      clusterHealthy = true
    } catch {
      clusterHealthy = false
    }
    res.json({ ok: true, database: 'connected', cluster: clusterHealthy })
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message })
  }
})

// Authentication Routes
app.post('/api/auth/register', handleRegister(db))
app.post('/api/auth/login', handleLogin(db))
app.get('/api/auth/me', authMiddleware(db), handleMe())
app.post('/api/auth/logout', authMiddleware(db), handleLogout(db))

// Protected Cluster Management Routes (requires valid login session)
app.get('/api/status', authMiddleware(db), async (_req, res) => {
  try {
    const [rollout, analysisRuns, pods] = await Promise.all([
      kubectlJson(['-n', NAMESPACE, 'get', 'rollout', ROLLOUT, '-o', 'json']),
      kubectlJson(['-n', NAMESPACE, 'get', 'analysisrun', '-o', 'json']),
      kubectlJson(['-n', NAMESPACE, 'get', 'pods', '-o', 'json']),
    ])

    const latestRun = (analysisRuns.items || [])
      .sort((a, b) => new Date(b.metadata?.creationTimestamp || 0) - new Date(a.metadata?.creationTimestamp || 0))[0]

    const currentArgs = rollout.spec?.template?.spec?.containers?.[1]?.args ?? []
    const injected = currentArgs.some((a) => a.includes('this-path-does-not-exist'))

    res.json({
      rollout: {
        phase: rollout.status?.phase ?? 'Unknown',
        currentStepIndex: rollout.status?.currentStepIndex ?? null,
        replicas: rollout.status?.replicas ?? 0,
        readyReplicas: rollout.status?.readyReplicas ?? 0,
        canaryWeight: rollout.status?.canary?.weights?.canary?.weight ?? 0,
        abort: rollout.status?.abort ?? false,
      },
      analysisRun: latestRun
        ? {
            name: latestRun.metadata?.name,
            phase: latestRun.status?.phase ?? 'Pending',
            value: latestRun.status?.metricResults?.[0]?.measurements?.slice(-1)?.[0]?.value ?? null,
            createdAt: latestRun.metadata?.creationTimestamp,
          }
        : null,
      pods: (pods.items || []).map((p) => ({
        name: p.metadata?.name,
        phase: p.status?.phase,
        ready: p.status?.containerStatuses?.every((c) => c.ready) ?? false,
      })),
      failureInjected: injected,
    })
  } catch (err) {
    res.status(503).json({ ok: false, error: `Kubernetes cluster unreachable: ${err.message}` })
  }
})

app.post('/api/restore', authMiddleware(db), async (_req, res) => {
  try {
    await kubectl([
      '-n', NAMESPACE, 'patch', 'rollout', ROLLOUT, '--type=json',
      '-p', JSON.stringify([
        { op: 'replace', path: '/spec/template/spec/containers/1/args', value: HEALTHY_ARGS },
      ]),
    ])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/deploy', authMiddleware(db), async (req, res) => {
  const injectFailure = req.body?.injectFailure === true
  try {
    const patches = [
      {
        op: 'replace',
        path: '/spec/template/spec/containers/1/args',
        value: injectFailure ? BROKEN_ARGS : HEALTHY_ARGS,
      },
      {
        op: 'add',
        path: '/spec/template/metadata/labels/demo-run',
        value: String(Date.now()),
      },
    ]
    await kubectl([
      '-n', NAMESPACE, 'patch', 'rollout', ROLLOUT, '--type=json', '-p', JSON.stringify(patches),
    ])
    res.json({ ok: true, injectFailure })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[control-api] listening on port ${PORT}`)
  })
}

export { app, db }
