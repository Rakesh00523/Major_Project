# AI-Augmented CI/CD Pipeline

A fully open-source, zero-cost CI/CD pipeline that combines AI-assisted code
review, automated testing, software-supply-chain security, GitOps-based
Kubernetes deployment, and observability into one unified DevOps ecosystem.

The demo application — a **Pipeline Dashboard** — is a modern React SPA that
visualizes this very pipeline: build history, security scan results, and
per-environment deployment status.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design and a
diagram of the end-to-end flow.

## What's here

| Path | Purpose |
|---|---|
| [`app/`](app) | The Pipeline Dashboard (React + Vite + Tailwind) |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Lint, test, AI review (Gemini), SonarQube gate |
| [`.github/workflows/cd.yml`](.github/workflows/cd.yml) | Docker build, Trivy, Syft, Cosign, GitOps bump |
| [`scripts/`](scripts) | AI review bot, GitOps image-tag bump/promote scripts |
| [`sonarqube/`](sonarqube) | Self-hosted SonarQube via Docker Compose |
| [`k8s/`](k8s) | Kustomize base + dev/prod overlays |
| [`argocd/`](argocd) | ArgoCD `Application` manifests (GitOps) |
| [`monitoring/`](monitoring) | Prometheus/Grafana Helm values, ServiceMonitor, dashboard |
| [`docs/`](docs) | Architecture, security model, and full runbook |

## Quick start

```bash
cd app
npm install
npm run dev
```

Then see [`docs/RUNBOOK.md`](docs/RUNBOOK.md) for standing up SonarQube,
Minikube, ArgoCD, and the Prometheus/Grafana stack locally.

## Zero-cost, by design

Every tool in this pipeline is free to run at this scale: GitHub Actions
(free minutes), GHCR (free registry), Gemini free-tier API, self-hosted
SonarQube, open-source Trivy/Syft/Cosign, ArgoCD, and Minikube. The only
account you need to create is a free GitHub repo and a free Gemini API key —
see the runbook for exactly where.
