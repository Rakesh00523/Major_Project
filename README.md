# AI-Augmented CI/CD Pipeline

An open-source, zero-cost **AI-augmented DevSecOps & GitOps platform**:
code moves from pull request to production through AI-assisted risk
analysis, secret and vulnerability scanning, supply-chain-signed images,
progressive canary delivery with automatic rollback, and observability
against measurable reliability objectives.

The demo application — a **Pipeline Dashboard** — is a modern React SPA
that visualizes this very pipeline: build history, AI risk scores, security
posture, live canary rollout state, and DORA/SLO metrics, across six pages
(Dashboard, Deployments, Pull Requests, AI Insights, Security, Settings).

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design and a
diagram of the end-to-end flow, and [`docs/RUNBOOK.md`](docs/RUNBOOK.md) for
the exact commands that were used to verify all of this against a real
local Kubernetes cluster — including a live canary promotion and a live
automatic rollback.

## What's here

| Path | Purpose |
|---|---|
| [`app/`](app) | The Pipeline Dashboard (React + Vite + Tailwind) |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Gitleaks, lint, test, AI risk review (Gemini), SonarQube gate |
| [`.github/workflows/cd.yml`](.github/workflows/cd.yml) | Docker build, Trivy, Syft, Cosign, GitOps bump |
| [`scripts/`](scripts) | AI review bot, GitOps image-tag bump/promote scripts |
| [`sonarqube/`](sonarqube) | Self-hosted SonarQube via Docker Compose |
| [`k8s/`](k8s) | Kustomize base (Argo Rollouts `Rollout` + `AnalysisTemplate`) + dev/prod overlays |
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
Minikube, Argo Rollouts, ArgoCD, and the Prometheus/Grafana stack locally.

## The six differentiators

1. **AI Release Intelligence** — Gemini returns a structured risk score,
   reasons, suggested tests, and a deploy recommendation, not just prose
   (`scripts/ai-review.mjs`, `/pull-requests`, `/ai-insights`).
2. **End-to-end DevSecOps** — Gitleaks → lint/test → AI review → SonarQube
   → Trivy → Syft → Cosign, each one capable of blocking the pipeline.
3. **Progressive delivery** — Argo Rollouts canary steps
   (25% → analysis → 50% → 100%) instead of an instant Deployment swap.
4. **Self-healing** — a failing Prometheus-backed analysis aborts the
   rollout and reverts automatically; verified live, see the runbook.
5. **Real-time observability** — Prometheus + Grafana, plus explicit SLOs
   (availability, HTTP success, P95 latency, error budget) and DORA
   metrics (deployment frequency, lead time, change failure rate, MTTR).
6. **A real control-center dashboard** — the pipeline's own data, not
   placeholder numbers, rendered across six pages.

## Zero-cost, by design

Every tool here is free to run at this scale: GitHub Actions (free
minutes), GHCR (free registry), Gemini free-tier API, self-hosted
SonarQube, open-source Gitleaks/Trivy/Syft/Cosign/Argo Rollouts/ArgoCD, and
Minikube. The only accounts you need are a free GitHub repo and a free
Gemini API key — see the runbook for exactly where.
