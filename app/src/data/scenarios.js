// Demo-mode scenario definitions for the Pipeline Control page. Every
// scenario replays the REAL stage sequence and REAL timings this project
// verified tonight (see src/data/pipeline-status.json's repoOverview and
// selfHealing sections, and docs/RUNBOOK.md for how each was produced).
// Clicking "Run" here does not reach the live cluster — it's a labeled
// simulation, because this is a static frontend with no backend able to
// safely execute privileged cluster commands from a browser click.

const BASE_STAGES = [
  { key: 'commit', label: 'Commit pushed to main', realSeconds: 0 },
  { key: 'lint', label: 'Lint', realSeconds: 1, tool: 'oxlint' },
  { key: 'test', label: 'Unit tests', realSeconds: 8, tool: 'Vitest' },
  { key: 'ai_review', label: 'AI risk review', realSeconds: 3, tool: 'Gemini' },
  { key: 'sonar', label: 'SonarQube quality gate', realSeconds: 5, tool: 'SonarQube' },
  { key: 'trivy', label: 'Trivy vulnerability scan', realSeconds: 15, tool: 'Trivy' },
  { key: 'sbom', label: 'SBOM generation', realSeconds: 3, tool: 'Syft' },
  { key: 'cosign', label: 'Image signing', realSeconds: 2, tool: 'Cosign' },
  { key: 'gitops', label: 'GitOps manifest bump', realSeconds: 1, tool: 'scripts/bump-image-tag.mjs' },
  { key: 'argocd', label: 'ArgoCD sync', realSeconds: 3, tool: 'ArgoCD' },
  { key: 'canary25', label: 'Canary at 25% traffic', realSeconds: 0, tool: 'Argo Rollouts' },
  { key: 'prometheus1', label: 'Prometheus analysis', realSeconds: 15, tool: 'Prometheus' },
  { key: 'canary50', label: 'Canary at 50% traffic', realSeconds: 0, tool: 'Argo Rollouts' },
  { key: 'prometheus2', label: 'Prometheus analysis', realSeconds: 15, tool: 'Prometheus' },
  { key: 'promote', label: 'Promoted to 100%', realSeconds: 0, tool: 'Argo Rollouts' },
]

function stagesUpTo(key) {
  const idx = BASE_STAGES.findIndex((s) => s.key === key)
  return BASE_STAGES.slice(0, idx + 1)
}

export const SCENARIOS = {
  successful_deployment: {
    label: 'Successful deployment',
    description: 'Every gate passes. This is the real path e7350c7 took tonight.',
    outcome: 'success',
    steps: BASE_STAGES,
    readiness: {
      lint: true, test: true, sonar: true, trivy: true, sbom: true, cosign: true, gitops: true, canary: true,
    },
  },
  test_failure: {
    label: 'CI failure — unit test',
    description: 'A test fails before the image is even built. Nothing downstream runs.',
    outcome: 'blocked',
    failAt: 'test',
    steps: [...stagesUpTo('lint'), { key: 'test', label: 'Unit tests', realSeconds: 8, tool: 'Vitest', fails: true }],
    readiness: { lint: true, test: false, sonar: null, trivy: null, sbom: null, cosign: null, gitops: null, canary: null },
    blockedReason: '2 of 47 unit tests failed',
    blockedActions: ['Image build', 'Security scan', 'GitOps deployment'],
  },
  security_failure: {
    label: 'Security gate — critical vulnerability',
    description: 'The image builds, but Trivy finds a CRITICAL CVE. The gate blocks promotion.',
    outcome: 'blocked',
    failAt: 'trivy',
    steps: [
      ...stagesUpTo('sonar'),
      { key: 'trivy', label: 'Trivy vulnerability scan', realSeconds: 15, tool: 'Trivy', fails: true },
    ],
    readiness: { lint: true, test: true, sonar: true, trivy: false, sbom: null, cosign: null, gitops: null, canary: null },
    blockedReason: 'CRITICAL: 1 finding (simulated CVE in a base image package)',
    blockedActions: ['Image promotion', 'GitOps deployment', 'Production rollout'],
  },
  canary_failure: {
    label: 'Canary failure — automatic rollback',
    description: 'Everything passes until the canary itself degrades. Argo Rollouts catches it and rolls back automatically — this is the real mechanism verified tonight (AnalysisRun value 0.5, phase Failed).',
    outcome: 'rolled_back',
    failAt: 'prometheus1',
    steps: [
      ...stagesUpTo('canary25'),
      { key: 'prometheus1', label: 'Prometheus analysis', realSeconds: 15, tool: 'Prometheus', fails: true },
      { key: 'abort', label: 'Argo Rollouts aborts the rollout', realSeconds: 0, tool: 'Argo Rollouts' },
      { key: 'rollback', label: 'Traffic reverted to stable version', realSeconds: 0, tool: 'Argo Rollouts' },
    ],
    readiness: { lint: true, test: true, sonar: true, trivy: true, sbom: true, cosign: true, gitops: true, canary: false },
    blockedReason: 'Canary health check failed: exporter-up averaged 0.5 (failed 3 > failureLimit 2)',
    blockedActions: ['Promotion to 50%/100%'],
    recovered: true,
  },
}

export const READINESS_LABELS = [
  { key: 'lint', label: 'Lint' },
  { key: 'test', label: 'Unit tests' },
  { key: 'sonar', label: 'Code quality (SonarQube)' },
  { key: 'trivy', label: 'Vulnerability scan (Trivy)' },
  { key: 'sbom', label: 'SBOM generated' },
  { key: 'cosign', label: 'Image signed (Cosign)' },
  { key: 'gitops', label: 'GitOps manifest updated' },
  { key: 'canary', label: 'Canary healthy' },
]
