# Portable Deployment Guide: Running on a New System

This guide provides step-by-step instructions to run the **AI-Augmented CI/CD Pipeline** on any new or clean machine (Windows, macOS, or Linux).

---

## 1. System Requirements

- **RAM:** Minimum 8 GB (16 GB recommended). Minikube alone needs ~3.4 GB.
- **CPU:** 4+ cores (Minikube requires at least 3 virtual CPUs).
- **Disk:** At least 20 GB free space for Docker images and container layers.
- **Virtualization:** Hardware virtualization (VT-x / AMD-V) enabled in BIOS/UEFI.

---

## 2. Install Required Tools

Run the command for your operating system:

### Windows (PowerShell as Administrator)
Using Windows Package Manager (`winget`):
```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Docker.DockerDesktop -e
winget install --id Kubernetes.minikube -e
winget install --id Kubernetes.kubectl -e
winget install --id Helm.Helm -e
```
*(Restart your terminal after installation so all tools are added to your `PATH`).*

### macOS (Terminal)
Using Homebrew:
```bash
brew install git node docker minikube kubectl helm
```

### Linux (Ubuntu/Debian)
```bash
# Node.js, Git, Docker
sudo apt update && sudo apt install -y git curl apt-transport-https ca-certificates docker.io
sudo usermod -aG docker $USER && newgrp docker

# Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# kubectl, minikube, helm
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && sudo install kubectl /usr/local/bin/
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && sudo install minikube-linux-amd64 /usr/local/bin/minikube
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

---

## 3. Docker Configuration

1. Launch **Docker Desktop**.
2. Go to **Settings** > **Resources**:
   - Ensure at least **4 GB RAM** and **3 CPUs** are allocated to Docker.
   - On Windows: ensure **Use the WSL 2 based engine** is checked.
3. In **Settings** > **Kubernetes**:
   - Make sure Kubernetes in Docker Desktop is **disabled** (Minikube provides its own cluster; running both creates port conflicts).

---

## 4. Get the Code & Prepare the Environment

Open **PowerShell** (Windows) or Terminal (Linux/macOS):

```powershell
# Clone or move the repository
git clone <YOUR_REPO_URL>
cd ai-cicd-pipeline

# Set execution policy (Windows only)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Store repository path dynamically
$REPO = (Get-Location).Path
```

---

## 5. Execution Workflow (Terminal by Terminal)

Follow the execution order organized across dedicated terminals to avoid foreground processes blocking your work:

### Terminal 1: Build, Scan & Infrastructure Setup
Run in your main terminal:

```powershell
# 1. Install frontend and run tests
cd $REPO\app
npm install
npm run lint
npm run test
npm run build

# 2. Build local Docker image
docker build -t pipeline-dashboard:local .

# 3. Security scans (Trivy CVE scan & Syft SBOM)
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v trivy-cache:/root/.cache aquasec/trivy:latest image --severity CRITICAL,HIGH --scanners vuln pipeline-dashboard:local
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v "${PWD}:/out" anchore/syft:latest pipeline-dashboard:local -o spdx-json=/out/sbom.spdx.json

# 4. Start Minikube & addons
minikube start --cpus=3 --memory=3400mb --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server

# 5. Load the image into Minikube
minikube image load pipeline-dashboard:local

# 6. Install Argo Rollouts
kubectl create namespace argo-rollouts --dry-run=client -o yaml | kubectl apply -f -
kubectl apply --server-side -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

# 7. Install Prometheus & Grafana stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack -n monitoring -f $REPO\monitoring\kube-prometheus-stack-values.yaml --wait --timeout 5m

# 8. Load Custom Grafana Dashboard
kubectl create configmap pipeline-dashboard-grafana --from-file="app-dashboard.json=$REPO\monitoring\grafana\dashboards\app-dashboard.json" -n monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl label configmap pipeline-dashboard-grafana -n monitoring grafana_dashboard="1" --overwrite

# 9. Install ArgoCD
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply --server-side -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 10. Deploy the Application to Dev namespace
kubectl create namespace pipeline-dev --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n pipeline-dev -f $REPO\monitoring\servicemonitor.yaml
kubectl kustomize $REPO\k8s\overlays\dev | kubectl apply -n pipeline-dev -f -
```

---

### Terminal 2: ArgoCD UI Proxy
Open a new terminal:
```powershell
kubectl -n argocd port-forward svc/argocd-server 8080:443
```
- **URL:** [https://localhost:8080](https://localhost:8080)
- **Bypass SSL warning:** Click **Advanced** > **Proceed to localhost (unsafe)** (or type `thisisunsafe`).
- **Username:** `admin`
- **Password retrieval (run in Terminal 1):**
  ```powershell
  [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String((kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}")))
  ```

---

### Terminal 3: Grafana UI Proxy
Open a new terminal:
```powershell
kubectl -n monitoring port-forward svc/monitoring-grafana 3000:80
```
- **URL:** [http://localhost:3000](http://localhost:3000)
- **Credentials:** `admin` / `admin`
- Go to **Dashboards** > **Pipeline Dashboard — App Metrics** to view live metrics.

---

### Terminal 4: Argo Rollouts Live Watcher
Open a new terminal:
```powershell
kubectl -n pipeline-dev get rollout pipeline-dashboard -w
```
*(Watches live canary steps, promotions, and rollbacks).*

---

### Terminal 5: Local Control API
Open a new terminal:
```powershell
cd $REPO\control-api
npm install
npm start
```
*(Listens on port 4001, providing live cluster data to the React UI).*

---

### Terminal 6: Frontend Web Dashboard
Open a new terminal:
```powershell
cd $REPO\app
npm run dev
```
- **URL:** [http://localhost:5173](http://localhost:5173)
- Navigate to the **Live Cluster** tab under **Pipeline Control** to see real-time cluster sync, canary progression, and rollback triggers!

---

## 6. Testing Canary & Automatic Rollback on the New System

In **Terminal 1**:

### Trigger a Healthy Canary Update:
```powershell
@'
[
  {"op":"add","path":"/spec/template/metadata/labels/demo","value":"2"}
]
'@ | Set-Content -Encoding ascii $env:TEMP\canary-patch.json
kubectl -n pipeline-dev patch rollout pipeline-dashboard --type=json --patch-file $env:TEMP\canary-patch.json
```
*(Prometheus verifies `nginx_up == 1` and automatically promotes the rollout).*

### Trigger an Automatic Rollback:
```powershell
@'
[
  {"op":"replace","path":"/spec/template/spec/containers/1/args","value":["-nginx.scrape-uri=http://127.0.0.1:8080/this-path-does-not-exist"]},
  {"op":"add","path":"/spec/template/metadata/labels/demo","value":"broken"}
]
'@ | Set-Content -Encoding ascii $env:TEMP\fail-patch.json
kubectl -n pipeline-dev patch rollout pipeline-dashboard --type=json --patch-file $env:TEMP\fail-patch.json
```
*(Prometheus detects `nginx_up` failure, marks AnalysisRun Failed, and Argo Rollouts aborts and restores healthy pods automatically).*

---

## 7. Promotion & Teardown

In **Terminal 1**:
```powershell
# Promote dev tag to production overlay
cd $REPO
node .\scripts\promote.mjs

# When done, stop Minikube
minikube stop
```
