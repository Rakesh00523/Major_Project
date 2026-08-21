# How to run this project

This is a practical setup guide. For an explanation of *what this project
is and why it exists*, read [`README.md`](README.md) first — that's
written for people with zero CI/CD background. This file is just the
commands.

There are two levels of setup. **Do Level 1 first** — it's all you need
to see and demo the whole dashboard.

---

## Level 1: Just the dashboard (2 minutes, no Docker needed)

**Requirements**: [Node.js](https://nodejs.org) 20 or newer.

```bash
cd app
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). Sign in with
anything (it's a demo login — no real password check). You now have the
full dashboard: real data from this project's actual build, the Pipeline
Control page's Demo Simulation scenarios, Security, AI Insights,
everything. **This is enough for a full demo or walkthrough.**

To also run the tests / lint / production build:

```bash
npm run lint
npm run test
npm run build
```

---

## Level 2: The real Kubernetes pipeline (optional, ~20-30 minutes)

Only do this if you want the **Live Cluster tab** in Pipeline Control to
actually work — i.e. real buttons that hit a real local Kubernetes
cluster, not just the simulation.

### Requirements

- Docker Desktop (with at least ~3.5GB of memory allocated — check via
  Docker Desktop → Settings → Resources)
- `kubectl`, `minikube`, `helm` — on Windows: `winget install
  Kubernetes.minikube` and `winget install Helm.Helm`

### Setup

Full, exact, **already-tested** commands are in
[`docs/RUNBOOK.md`](docs/RUNBOOK.md) — follow it top to bottom the first
time. Short version once you're comfortable:

```bash
# 1. Start the cluster
minikube start --cpus=3 --memory=3400mb --driver=docker
minikube addons enable ingress

# 2. Install the pipeline's infrastructure
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
kubectl create namespace monitoring
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring -f monitoring/kube-prometheus-stack-values.yaml --wait --timeout 5m

kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Build and deploy the app into the cluster
cd app
docker build -t pipeline-dashboard:local .
cd ..
minikube image load pipeline-dashboard:local
kubectl create namespace pipeline-dev
kubectl apply -n pipeline-dev -f monitoring/servicemonitor.yaml
kubectl kustomize k8s/overlays/dev | kubectl apply -n pipeline-dev -f -
kubectl -n pipeline-dev patch rollout pipeline-dashboard --type=json -p='[
  {"op":"replace","path":"/spec/template/spec/containers/0/image","value":"pipeline-dashboard:local"},
  {"op":"add","path":"/spec/template/spec/containers/0/imagePullPolicy","value":"Never"}
]'

# 4. Start the control API (this is what makes the Live Cluster tab work)
cd control-api
npm install
npm start
```

Then in the app, go to **Pipeline Control → Live Cluster**. If it says
"unavailable," it means step 4 above isn't running, or Minikube isn't up
— everything else in the app still works fine without it.

### Known gotchas (we hit these, they're not your fault)

- **"Docker Desktop has only NMB memory but you specified..."** — Docker
  Desktop's memory allocation is smaller than what you asked minikube for.
  Run `docker info | grep -i memory` and lower `--memory` to fit.
- **A pod (especially Grafana) restarts a few times right after
  install** — normal under CPU load while everything's pulling images at
  once. It settles within a couple minutes. If it doesn't, see
  `docs/RUNBOOK.md`'s "known gotchas" notes for the exact fix we applied.
- **`kubectl apply` on the ArgoCD manifest is slow / one component
  crashloops with "no matches for kind ApplicationSet"** — a one-time
  timing issue applying a huge combined manifest. Not used by this
  project anyway; ignore it or `kubectl -n argocd delete pod
  <applicationset-controller-pod-name>` once things settle.

---

## Project map

| Folder | Purpose |
|---|---|
| `app/` | The dashboard (React) — this is Level 1 |
| `control-api/` | Small local server enabling the Live Cluster tab — this is Level 2 |
| `.github/workflows/` | The actual CI/CD pipeline definitions for GitHub Actions |
| `k8s/`, `argocd/`, `monitoring/` | Kubernetes/ArgoCD/Prometheus configuration used in Level 2 |
| `scripts/` | Helper scripts (AI review bot, deployment promotion) |
| `docs/` | Full technical docs: architecture, security model, complete runbook |

If something in Level 2 doesn't match what's here exactly, `docs/RUNBOOK.md`
is the source of truth — it was written by running every command for real
against a live cluster, not from memory.
