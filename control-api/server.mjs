// Local control API for the Pipeline Control page's "Live cluster" mode.
//
// This talks to the REAL Minikube cluster via kubectl -- the same exact
// commands that were run manually and verified earlier tonight (see
// docs/RUNBOOK.md section 5). It intentionally binds to 127.0.0.1 only:
// this is a local demo tool that can execute cluster-admin commands, not
// a service meant to ever be reachable from the network.
//
// Scope, honestly: only the deploy/canary/rollback mechanism is wired up
// here, because that's the part that genuinely lives in the cluster. The
// CI-side stages (lint, test, Trivy, SBOM, Cosign, GitOps bump) only ever
// run in GitHub Actions and aren't something a local button can trigger
// for real -- the Pipeline Control page still shows those as verified
// history/simulation, and only labels this part "live".
import express from 'express'
import cors from 'cors'
import { execFile } from 'node:child_process'

const NAMESPACE = 'pipeline-dev'
const ROLLOUT = 'pipeline-dashboard'
const PORT = 4001

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

const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:8081'] }))
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  try {
    await kubectl(['-n', NAMESPACE, 'get', 'rollout', ROLLOUT, '-o', 'name'])
    res.json({ ok: true })
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message })
  }
})

app.get('/api/status', async (_req, res) => {
  try {
    const [rollout, analysisRuns, pods] = await Promise.all([
      kubectlJson(['-n', NAMESPACE, 'get', 'rollout', ROLLOUT, '-o', 'json']),
      kubectlJson(['-n', NAMESPACE, 'get', 'analysisrun', '-o', 'json']),
      kubectlJson(['-n', NAMESPACE, 'get', 'pods', '-o', 'json']),
    ])

    const latestRun = analysisRuns.items
      .sort((a, b) => new Date(b.metadata.creationTimestamp) - new Date(a.metadata.creationTimestamp))[0]

    const currentArgs = rollout.spec.template.spec.containers[1]?.args ?? []
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
            name: latestRun.metadata.name,
            phase: latestRun.status?.phase ?? 'Pending',
            value: latestRun.status?.metricResults?.[0]?.measurements?.slice(-1)?.[0]?.value ?? null,
            createdAt: latestRun.metadata.creationTimestamp,
          }
        : null,
      pods: pods.items.map((p) => ({
        name: p.metadata.name,
        phase: p.status.phase,
        ready: p.status.containerStatuses?.every((c) => c.ready) ?? false,
      })),
      failureInjected: injected,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/restore', async (_req, res) => {
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

app.post('/api/deploy', async (req, res) => {
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

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[control-api] listening on http://127.0.0.1:${PORT} (localhost only)`)
})
