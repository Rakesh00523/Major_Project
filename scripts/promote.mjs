// Promotes the image tag currently running in the dev overlay to the prod
// overlay. Run manually (or from a manually-triggered workflow) once dev
// has been verified — production deploys are an explicit decision, not an
// automatic side effect of merging to main.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const devPath = path.join(repoRoot, 'k8s', 'overlays', 'dev', 'kustomization.yaml')
const prodPath = path.join(repoRoot, 'k8s', 'overlays', 'prod', 'kustomization.yaml')

const devTagMatch = readFileSync(devPath, 'utf8').match(/newTag:\s*(\S+)/)
if (!devTagMatch) {
  console.error('[promote] Could not find newTag in the dev overlay.')
  process.exit(1)
}
const devTag = devTagMatch[1]

const prodContent = readFileSync(prodPath, 'utf8')
const updated = prodContent.replace(/newTag:\s*.*/, `newTag: ${devTag}`)
writeFileSync(prodPath, updated)

console.log(`[promote] prod overlay image tag -> ${devTag} (promoted from dev)`)
console.log('[promote] Commit and push this change, then run: argocd app sync pipeline-dashboard-prod')
