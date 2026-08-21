// Updates the app image tag in a Kustomize overlay's JSON6902 patch and
// writes the file back in place. This is the GitOps "commit" step: CI
// never talks to the cluster, it only edits the manifest that ArgoCD
// watches.
//
// We patch the image directly (rather than using kustomize's `images:`
// transformer) because that transformer doesn't recognize the custom
// `Rollout` kind (argoproj.io/v1alpha1) the app is deployed as — see the
// comment in k8s/overlays/*/kustomization.yaml.
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

// Matches the `value:` line immediately following the containers/0/image
// path op, regardless of the current tag.
const IMAGE_PATCH_RE = /(path: \/spec\/template\/spec\/containers\/0\/image\n\s*value: )(\S+)/

const updated = original.replace(IMAGE_PATCH_RE, (_match, prefix, currentValue) => {
  const [repo] = currentValue.split(':')
  return `${prefix}${repo}:${IMAGE_TAG}`
})

if (updated === original) {
  console.error(`[bump-image-tag] No image patch found in ${overlayPath} — nothing changed.`)
  process.exit(1)
}

writeFileSync(overlayPath, updated)
console.log(`[bump-image-tag] ${OVERLAY} overlay image tag -> ${IMAGE_TAG}`)
