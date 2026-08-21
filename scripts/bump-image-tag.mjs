// Updates the `newTag` for the app image in a Kustomize overlay and writes
// the file back in place. This is the GitOps "commit" step: CI never talks
// to the cluster, it only edits the manifest that ArgoCD watches.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const { IMAGE_TAG, OVERLAY = 'dev' } = process.env

if (!IMAGE_TAG) {
  console.error('[bump-image-tag] IMAGE_TAG env var is required.')
  process.exit(1)
}

const overlayPath = path.join(repoRoot, 'k8s', 'overlays', OVERLAY, 'kustomization.yaml')
const original = readFileSync(overlayPath, 'utf8')

const updated = original.replace(/newTag:\s*.*/, `newTag: ${IMAGE_TAG}`)

if (updated === original) {
  console.error(`[bump-image-tag] No "newTag:" line found in ${overlayPath} — nothing changed.`)
  process.exit(1)
}

writeFileSync(overlayPath, updated)
console.log(`[bump-image-tag] ${OVERLAY} overlay image tag -> ${IMAGE_TAG}`)
