# Runbook — running everything locally

This assumes Docker Desktop, `kubectl`, `minikube`, and `helm` are installed
(minikube/helm: `winget install Kubernetes.minikube` and
`winget install Helm.Helm` on Windows).

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

## 3. Build & inspect the container image

```bash
cd app
docker build -t pipeline-dashboard:local .
docker run --rm -p 8080:8080 pipeline-dashboard:local
# open http://localhost:8080
```

## 4. Minikube cluster + ArgoCD

```bash
minikube start --cpus=4 --memory=6g
minikube addons enable ingress

kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD pods to be ready, then port-forward the UI:
kubectl -n argocd port-forward svc/argocd-server 8080:443
# open https://localhost:8080 — user "admin", password from:
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

**Important**: ArgoCD's `Application` manifests in `argocd/applications/`
point at a `repoURL` on GitHub. They only work once this repo is pushed to a
real GitHub remote — update `repoURL` to your actual repo, then:

```bash
kubectl apply -f argocd/applications/app-dev.yaml
kubectl apply -f argocd/applications/app-prod.yaml
```

Until then, you can still deploy the manifests directly for local testing:

```bash
kubectl create namespace pipeline-dev
kustomize build k8s/overlays/dev | kubectl apply -n pipeline-dev -f -
kubectl -n pipeline-dev port-forward svc/pipeline-dashboard 8081:80
# open http://localhost:8081
```

## 5. Promote dev → prod

```bash
node scripts/promote.mjs
git add k8s/overlays/prod/kustomization.yaml
git commit -m "chore(gitops): promote <tag> to prod"
git push
argocd app sync pipeline-dashboard-prod   # or click "Sync" in the ArgoCD UI
```

## 6. Monitoring (Prometheus + Grafana)

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

kubectl create namespace monitoring
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring -f monitoring/kube-prometheus-stack-values.yaml

# Load the app's ServiceMonitor (repeat -n for each namespace running the app)
kubectl apply -n pipeline-dev -f monitoring/servicemonitor.yaml

# Load the sample Grafana dashboard via the sidecar's configmap convention
kubectl create configmap pipeline-dashboard-grafana-dashboard \
  --from-file=app-dashboard.json=monitoring/grafana/dashboards/app-dashboard.json \
  -n monitoring
kubectl label configmap pipeline-dashboard-grafana-dashboard grafana_dashboard=1 -n monitoring

# Grafana UI
kubectl -n monitoring port-forward svc/monitoring-grafana 3000:80
# open http://localhost:3000 (admin/admin, per the Helm values)
```

## Secrets you need to add on GitHub (once the repo is pushed)

| Secret | Where to get it | Cost |
|---|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey | Free |

`GITHUB_TOKEN` is provided automatically by GitHub Actions — nothing to add.
