# Run Commands for the AI-Augmented CI/CD Pipeline

This guide outlines the exact sequence to run the entire project locally on **Windows (PowerShell)**.

Because several services (such as development servers, port-forwarding proxies, and Kubernetes watchers) run continuously in the foreground, commands are organized across **dedicated terminals** so that none of your commands are blocked.

---

## Terminal Overview & Architecture

| Terminal | Purpose | Lifecycle |
|---|---|---|
| **Terminal 1** | **Main Execution Terminal** | Runs builds, tests, container scans, Minikube setup, patches, promotion, and cleanup. |
| **Terminal 2** | **ArgoCD Web UI Proxy** | Dedicated foreground port-forward for ArgoCD (`8080:443`). |
| **Terminal 3** | **Grafana Web UI Proxy** | Dedicated foreground port-forward for Grafana (`3000:80`). |
| **Terminal 4** | **Rollout Live Watcher** | Dedicated foreground watch on Argo Rollouts (`kubectl -w`). |
| **Terminal 5** | **Control API Server** | Dedicated Node.js backend connecting React UI to Kubernetes (`:4001`). |
| **Terminal 6** | **Frontend Web Dashboard** | Dedicated Vite development server for the UI (`:5173`). |

---

# Phase 1: Local App Build, Test & Security (Terminal 1)

Open **Terminal 1 (PowerShell)** and keep it open for all main operational commands.

### 1) Allow local scripts and unblock Windows binaries
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# Run from the root of the cloned project:
$REPO = (Get-Location).Path

# Unblock downloaded CLI tools (prevents Windows Application Control / Smart App Control errors)
Get-ChildItem -Path "$env:USERPROFILE\bin\*" -ErrorAction SilentlyContinue | Unblock-File
```
*What it does:*
- Allows PowerShell scripts (`npm`, `helm`, etc.) to execute in this session.
- Removes the Windows "Mark of the Web" (`Zone.Identifier`) from tools in `~/bin/` (`minikube.exe`, `helm.exe`, `argocd.exe`).

---

### 2) Install dependencies, run lint, tests, and build
```powershell
cd $REPO\app
npm install
npm run lint
npm run test
npm run build
```
*What it does:*
- Downloads dependencies into `node_modules`.
- Runs ESLint to verify code quality.
- Runs Vitest unit tests to confirm app correctness.
- Compiles the production build into `dist/`.

---

### 3) Start Docker Desktop
Ensure **Docker Desktop** is running from the Windows Start menu. You can verify it with:
```powershell
docker info
```

---

### 4) Build the container image locally
```powershell
cd $REPO\app
docker build -t pipeline-dashboard:local .
```
*What it does:*
- Builds the production multi-stage container image containing the React app and Nginx.
- Tags it as `pipeline-dashboard:local`.

---

### 5) Scan the image for vulnerabilities with Trivy
```powershell
docker run --rm `
  -v /var/run/docker.sock:/var/run/docker.sock `
  -v trivy-cache:/root/.cache `
  aquasec/trivy:latest `
  image --severity CRITICAL,HIGH --scanners vuln pipeline-dashboard:local
```
*What it does:*
- Scans the newly built Docker image for known security CVEs.
- Verifies that zero high/critical vulnerabilities exist before deployment.

---

### 6) Generate a Software Bill of Materials (SBOM) with Syft
```powershell
docker run --rm `
  -v /var/run/docker.sock:/var/run/docker.sock `
  -v "${PWD}:/out" `
  anchore/syft:latest `
  pipeline-dashboard:local -o spdx-json=/out/sbom.spdx.json
```
*What it does:*
- Scans the image packages and generates `sbom.spdx.json` in the current folder.
- Provides supply-chain transparency and artifact tracking.

---

### 7) (Optional) Run SonarQube locally
```powershell
cd $REPO
docker compose -f .\sonarqube\docker-compose.yml up -d
```
*What it does:*
- Starts SonarQube and PostgreSQL in the background.
- UI available at `http://localhost:9000` (Default login: `admin` / `admin`).
- Scanner command (run after creating a project token in SonarQube):
  ```powershell
  docker run --rm `
    -e SONAR_HOST_URL="http://host.docker.internal:9000" `
    -e SONAR_TOKEN="<YOUR_TOKEN>" `
    -v "${PWD}:/usr/src" `
    sonarsource/sonar-scanner-cli `
    -Dsonar.projectKey=ai-cicd-pipeline `
    -Dsonar.sources=.
  ```

---

# Phase 2: Local Kubernetes Cluster & Infrastructure (Terminal 1)

### 8) Start Minikube & enable addons
```powershell
minikube start --cpus=3 --memory=3400mb --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server
```
*What it does:*
- Launches the single-node local Kubernetes cluster inside Docker.
- Enables the Nginx Ingress Controller and Metrics Server.

---

### 9) Load the local image into Minikube
```powershell
minikube image load pipeline-dashboard:local
```
*What it does:*
- Transports the locally built image into Minikube's Docker daemon so pods can use it without pushing to an external registry.

---

### 10) Install Argo Rollouts
```powershell
kubectl create namespace argo-rollouts --dry-run=client -o yaml | kubectl apply -f -
kubectl apply --server-side -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
```
*What it does:*
- Creates the `argo-rollouts` namespace.
- Installs the Argo Rollouts controller and CRDs using `--server-side` to avoid the 256KB annotation limit.

---

### 11) Install Prometheus & Grafana stack
```powershell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack -n monitoring -f $REPO\monitoring\kube-prometheus-stack-values.yaml --wait --timeout 5m
```
*What it does:*
- Deploys a trimmed Prometheus & Grafana stack tailored for laptop memory budgets (~3.4GB RAM).

---

### 12) Provision the custom application Grafana dashboard
```powershell
kubectl create configmap pipeline-dashboard-grafana --from-file="app-dashboard.json=$REPO\monitoring\grafana\dashboards\app-dashboard.json" -n monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl label configmap pipeline-dashboard-grafana -n monitoring grafana_dashboard="1" --overwrite
```
*What it does:*
- Creates a ConfigMap containing `app-dashboard.json`.
- Labels it with `grafana_dashboard=1`, triggering the Grafana sidecar to automatically import the "Pipeline Dashboard — App Metrics" board.

---

### 13) Install ArgoCD
```powershell
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply --server-side -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```
*What it does:*
- Deploys the ArgoCD GitOps engine and CRDs into the `argocd` namespace.

---

# Phase 3: Access Web UIs (Terminals 2 & 3)

### 14) Forward and Access ArgoCD UI (Terminal 2)

Open a **new PowerShell window (Terminal 2)** and run:
```powershell
kubectl -n argocd port-forward svc/argocd-server 8080:443
```
*(Leave this terminal running in the foreground).*

Now in **Terminal 1**, retrieve the initial admin password:
```powershell
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String((kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}")))
```

**Open in Browser:**
- **URL:** [https://localhost:8080](https://localhost:8080)
- **Bypass SSL:** Click **Advanced** > **Proceed to localhost (unsafe)** (or click on the page and type `thisisunsafe`).
- **Username:** `admin`
- **Password:** *(the string output from the command above)*

---

### 15) Forward and Access Grafana UI (Terminal 3)

Open a **new PowerShell window (Terminal 3)** and run:
```powershell
kubectl -n monitoring port-forward svc/monitoring-grafana 3000:80
```
*(Leave this terminal running in the foreground).*

**Open in Browser:**
- **URL:** [http://localhost:3000](http://localhost:3000)
- **Username:** `admin`
- **Password:** `admin`
- **Dashboard:** Go to **Dashboards** > **Pipeline Dashboard — App Metrics** to view live metrics (requests/sec, active connections, exporter status).

---

# Phase 4: Deploy App & Progressive Delivery (Terminals 1 & 4)

### 16) Deploy the application to the `pipeline-dev` namespace (Terminal 1)
```powershell
kubectl create namespace pipeline-dev --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n pipeline-dev -f $REPO\monitoring\servicemonitor.yaml
kubectl kustomize $REPO\k8s\overlays\dev | kubectl apply -n pipeline-dev -f -
```
*What it does:*
- Creates the `pipeline-dev` namespace.
- Registers the `ServiceMonitor` for Prometheus metric scraping.
- Deploys the baseline Argo Rollout with `pipeline-dashboard:local` and `imagePullPolicy: Never`.

Verify the pod is running:
```powershell
kubectl get pods -n pipeline-dev
```
*(Expected: `pipeline-dashboard-xxxx 2/2 Running`)*

---

### 17) Start Rollout Watcher (Terminal 4)

Open a **new PowerShell window (Terminal 4)** and run:
```powershell
kubectl -n pipeline-dev get rollout pipeline-dashboard -w
```
*(Leave this terminal open to watch revisions, canary weights, and statuses change in real-time).*

---

### 18) Test Canary Progression with Prometheus Analysis (Terminal 1)

In **Terminal 1**, trigger a valid canary update by modifying a label:
```powershell
@'
[
  {"op":"add","path":"/spec/template/metadata/labels/demo","value":"2"}
]
'@ | Set-Content -Encoding ascii $env:TEMP\canary-patch.json
kubectl -n pipeline-dev patch rollout pipeline-dashboard --type=json --patch-file $env:TEMP\canary-patch.json
```

**Observe in Terminal 4 & Terminal 1:**
- A canary pod starts at **25% weight**.
- Prometheus queries `avg(nginx_up{...}) == 1`.
- Check the AnalysisRun:
  ```powershell
  kubectl -n pipeline-dev get analysisrun
  ```
- The analysis reports `Phase: Successful` and automatically promotes the rollout through 50% to 100%!

---

### 19) Test Automatic Rollback on Metric Failure (Terminal 1)

In **Terminal 1**, deliberately break the Nginx scrape URI:
```powershell
@'
[
  {"op":"replace","path":"/spec/template/spec/containers/1/args","value":["-nginx.scrape-uri=http://127.0.0.1:8080/this-path-does-not-exist"]},
  {"op":"add","path":"/spec/template/metadata/labels/demo","value":"broken"}
]
'@ | Set-Content -Encoding ascii $env:TEMP\fail-patch.json
kubectl -n pipeline-dev patch rollout pipeline-dashboard --type=json --patch-file $env:TEMP\fail-patch.json
```

**Observe the result:**
- The canary pod boots with a broken exporter.
- Prometheus detects that `nginx_up` fails to return 1.
- Run:
  ```powershell
  kubectl -n pipeline-dev get analysisrun
  ```
- The AnalysisRun reports `Phase: Failed`.
- Argo Rollouts immediately **aborts** the rollout and restores 100% traffic to the last known stable replica with zero downtime!

---

# Phase 5: Live Control API & Frontend UI (Terminals 5 & 6)

### 20) Start the Local Control API (Terminal 5)

Open a **new PowerShell window (Terminal 5)** and run:
```powershell
cd $REPO\control-api
npm install
npm start
```
*(Server listens on `http://127.0.0.1:4001` and connects to the Minikube cluster via `kubectl`).*

---

### 21) Start the Frontend Web Dashboard (Terminal 6)

Open a **new PowerShell window (Terminal 6)** and run:
```powershell
cd $REPO\app
npm run dev
```

**Open in Browser:**
- **URL:** [http://localhost:5173](http://localhost:5173)
- Click on the **Live Cluster** tab!
- You will see the real-time rollout phase, canary percentage, active pods, and the automatic rollback banner synced directly with your cluster.

---

# Phase 6: Promotion & Cleanup (Terminal 1)

### 22) Promote dev overlay to production (Terminal 1)
```powershell
cd $REPO
node .\scripts\promote.mjs
```
*What it does:*
- Copies the verified dev image tag into `k8s/overlays/prod/kustomization.yaml`.
- Prepares the GitOps configuration for production deployment.

---

### 23) Tear down local services when done (Terminal 1)
```powershell
# Stop SonarQube containers
cd $REPO
docker compose -f .\sonarqube\docker-compose.yml down

# Stop Minikube cluster
minikube stop
```
*(You can close Terminals 2, 3, 4, 5, and 6 by pressing `Ctrl + C` in each window).*
