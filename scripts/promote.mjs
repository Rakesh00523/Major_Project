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

const IMAGE_PATCH_RE = /(path: \/spec\/template\/spec\/containers\/0\/image\n\s*value: )(\S+)/

const devMatch = readFileSync(devPath, 'utf8').match(IMAGE_PATCH_RE)
if (!devMatch) {
  console.error('[promote] Could not find the image patch in the dev overlay.')
  process.exit(1)
}
const devTag = devMatch[2].split(':')[1]

const prodContent = readFileSync(prodPath, 'utf8')
const updated = prodContent.replace(IMAGE_PATCH_RE, (_match, prefix, currentValue) => {
  const [repo] = currentValue.split(':')
  return `${prefix}${repo}:${devTag}`
})

if (updated === prodContent) {
  console.error('[promote] Could not find the image patch in the prod overlay.')
  process.exit(1)
}

writeFileSync(prodPath, updated)
console.log(`[promote] prod overlay image tag -> ${devTag} (promoted from dev)`)
console.log('[promote] Commit and push this change, then run: argocd app sync pipeline-dashboard-prod')
