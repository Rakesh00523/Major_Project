# Runbook — running everything locally

Every command below was actually run against a real Minikube cluster while
building this project (Docker Desktop capped at ~3.7GB) — not just written
and hoped to work. Section 5 in particular reproduces a live canary
promotion and a live automatic rollback.

Install `minikube` and `helm` first if you don't have them:
`winget install Kubernetes.minikube` and `winget install Helm.Helm` on
Windows.

## 1. App: lint, test, build

```bash
cd app
npm install
npm run lint
npm run test
npm run build
```

## 2. SonarQube (self-hosted, persistent)

```bash
docker compose -f sonarqube/docker-compose.yml up -d
# wait ~60s for first boot, then open http://localhost:9000 (admin/admin)
```

Run a scan against it once you have `sonar-scanner` installed:

```bash
cd app
sonar-scanner -Dsonar.host.url=http://localhost:9000 -Dsonar.token=<token you generate in the UI>
```

## 3. Build & scan the container image

```bash
cd app
docker build -t pipeline-dashboard:local .
docker run --rm -p 8080:8080 pipeline-dashboard:local   # open http://localhost:8080

trivy image --severity CRITICAL,HIGH --scanners vuln pipeline-dashboard:local
syft pipeline-dashboard:local -o spdx-json > sbom.spdx.json
```

Cosign's real signing flow is keyless via GitHub OIDC and only works inside
GitHub Actions. To validate the sign/verify/attest mechanics locally, spin
up a throwaway registry and key pair (see `docs/SECURITY.md` for why this
is a stand-in for the real flow, not a replacement):

```bash
docker run -d -p 5000:5000 --name local-registry registry:2
docker tag pipeline-dashboard:local localhost:5000/pipeline-dashboard:local
docker push localhost:5000/pipeline-dashboard:local

cosign generate-key-pair
cosign sign --key cosign.key --yes --allow-http-registry localhost:5000/pipeline-dashboard@<digest>
cosign verify --key cosign.pub --allow-http-registry localhost:5000/pipeline-dashboard@<digest>
```

## 4. Minikube cluster + Argo Rollouts + ArgoCD + monitoring

Order matters: Argo Rollouts' CRDs must exist before you apply
`k8s/base/rollout.yaml`, and the monitoring stack should be up before the
app so its ServiceMonitor has something to register against.

```bash
docker info | grep -i memory   # size minikube to fit what you actually have
minikube start --cpus=3 --memory=3400mb --driver=docker
minikube addons enable ingress

# Argo Rollouts (canary steps + Prometheus-gated promotion/rollback)
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

# Prometheus + Grafana (trimmed for a laptop-sized cluster)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
kubectl create namespace monitoring
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring -f monitoring/kube-prometheus-stack-values.yaml --wait --timeout 5m

# ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

**Watch for this on a slow/contended machine**: applying ArgoCD's full
manifest in one shot can start the `applicationset-controller` before its
own CRD has finished registering, crashlooping it with `no matches for
kind "ApplicationSet"`. It's cosmetic (this project doesn't use
ApplicationSets) and self-resolves — `kubectl -n argocd delete pod
argocd-applicationset-controller-<hash>` once the CRDs are settled clears
it immediately.

Access the UIs:

```bash
kubectl -n argocd port-forward svc/argocd-server 8080:443
# https://localhost:8080 — admin / kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

kubectl -n monitoring port-forward svc/monitoring-grafana 3000:80
# http://localhost:3000 — admin/admin (per the Helm values)
```

**Important GitOps constraint**: `argocd/applications/*.yaml` point at a
`repoURL` on GitHub. ArgoCD can only sync from a Git remote it can reach —
local-only commits are invisible to it. Update `repoURL` to your actual
repo once it's pushed, then `kubectl apply -f argocd/applications/`.

## 5. Deploy the app and watch the canary (no registry needed, for local testing)

Without a pushed image in GHCR yet, load the locally-built image straight
into Minikube and point the Rollout at it directly — this is exactly how
the canary + auto-rollback behavior below was verified:

```bash
minikube image load pipeline-dashboard:local
kubectl create namespace pipeline-dev
kubectl apply -n pipeline-dev -f monitoring/servicemonitor.yaml
kubectl kustomize k8s/overlays/dev | kubectl apply -n pipeline-dev -f -

kubectl -n pipeline-dev patch rollout pipeline-dashboard --type=json -p='[
  {"op":"replace","path":"/spec/template/spec/containers/0/image","value":"pipeline-dashboard:local"},
  {"op":"add","path":"/spec/template/spec/containers/0/imagePullPolicy","value":"Never"}
]'
```

The **first** rollout skips canary steps entirely — there's no previous
stable version to canary against, so it goes straight to fully available.
To see the canary + analysis gate for real, change the pod template again
(any label change works) and watch it:

```bash
kubectl -n pipeline-dev patch rollout pipeline-dashboard --type=json \
  -p='[{"op":"add","path":"/spec/template/metadata/labels/demo","value":"2"}]'
kubectl -n pipeline-dev get rollout pipeline-dashboard -w
kubectl -n pipeline-dev get analysisrun
```

A healthy rollout's AnalysisRun reports `Value: [1]` and `Phase:
Successful`, and the Rollout promotes 25% → 50% → 100% automatically.

**To see the automatic rollback**, break the exporter's scrape path (not
the app itself — this proves the *custom* health signal catches something
Kubernetes's own readiness probe wouldn't):

```bash
kubectl -n pipeline-dev patch rollout pipeline-dashboard --type=json -p='[
  {"op":"replace","path":"/spec/template/spec/containers/1/args","value":["-nginx.scrape-uri=http://127.0.0.1:8080/this-path-does-not-exist"]},
  {"op":"add","path":"/spec/template/metadata/labels/demo","value":"3-broken"}
]'
kubectl -n pipeline-dev get analysisrun -w
```

The AnalysisRun reports `Value: [0.5]` (average of the healthy stable pod
at 1 and the broken canary at 0), then `Phase: Failed`, and the Rollout
controller emits `RolloutAborted ... failed (3) > failureLimit (2)` —
the canary is torn down and the stable version keeps serving, with zero
manual intervention. Restore the working scrape-uri arg to return to a
clean state.

## 5b. Drive the same demo from the dashboard's "Live cluster" tab

`control-api/` is a small local Node server that runs exactly the kubectl
commands above on your behalf, so the Pipeline Control page's buttons can
trigger the real thing instead of a client-side animation:

```bash
cd control-api
npm install
npm start   # listens on 127.0.0.1:4001, localhost only
```

Then open the app, go to **Pipeline Control**, and switch to the **Live
cluster** tab — it polls real `kubectl` status every 3s. "Deploy for real"
triggers an actual new Rollout revision; "Inject real failure" reproduces
the broken-canary demo above end to end, with the UI showing the real
`Progressing -> Paused -> Degraded` phase transitions and the real
AnalysisRun value as they happen. If `control-api` isn't running (or
Minikube is stopped), the tab says so and the page still works fine via
the Demo simulation tab.

## 6. Promote dev → prod

```bash
node scripts/promote.mjs
git add k8s/overlays/prod/kustomization.yaml
git commit -m "chore(gitops): promote <tag> to prod"
git push
argocd app sync pipeline-dashboard-prod   # or click "Sync" in the ArgoCD UI
```

## 7. Load the Grafana dashboard

```bash
kubectl create configmap pipeline-dashboard-grafana-dashboard \
  --from-file=app-dashboard.json=monitoring/grafana/dashboards/app-dashboard.json \
  -n monitoring
kubectl label configmap pipeline-dashboard-grafana-dashboard grafana_dashboard=1 -n monitoring
```

## Secrets you need to add on GitHub (once the repo is pushed)

| Secret | Where to get it | Cost |
|---|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey | Free |

`GITHUB_TOKEN` is provided automatically by GitHub Actions — nothing to
add. Gitleaks needs no secret at all for the free open-source scan.

## What's designed but not deployed locally

See "What's live vs. designed-only" in `docs/ARCHITECTURE.md` — Loki
(centralized logging) and admission-time Cosign signature verification
were left undeployed to keep the ~3.7GB Docker Desktop budget focused on
Rollouts + Prometheus + ArgoCD actually running.
