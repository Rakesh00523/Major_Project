# Run commands for the AI-Augmented CI/CD Pipeline

This file contains the commands in the correct order to run the project locally and explains what each command does.

> Use these commands in PowerShell on Windows.

---

## 1) Allow local scripts to run for this session

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

What it does:
- Temporarily allows PowerShell scripts to run in this terminal session only
- Fixes the Windows execution policy problem that blocks `npm`

---

## 2) Go to the app folder

```powershell
cd C:\Users\dhara\OneDrive\Desktop\ai-cicd-pipeline\app
```

What it does:
- Moves into the folder that contains the actual React app
- This is where the Node project lives

---

## 3) Install frontend dependencies

```powershell
npm install
```

What it does:
- Reads the app's `package.json`
- Downloads all required Node packages
- Creates the `node_modules` folder

---

## 4) Run the app locally

```powershell
npm run dev
```

What it does:
- Starts the Vite development server
- Launches the dashboard locally
- Lets you access the web app in the browser without Kubernetes

---

## 5) Run lint checks

```powershell
npm run lint
```

What it does:
- Runs static code checks on the frontend
- Helps catch issues before merging
- Matches the CI workflow in `.github/workflows/ci.yml`

---

## 6) Run unit tests

```powershell
npm run test
```

What it does:
- Runs the app's Vitest test suite
- Verifies application behavior
- Helps check whether the app still works after code changes

---

## 7) Run production build

```powershell
npm run build
```

What it does:
- Builds a production version of the app
- Checks that the project compiles successfully
- Validates the application before deployment

---

## 8) Start Docker Desktop

Start Docker Desktop manually from the Start menu if it is not already running.

What it does:
- Starts the Docker engine
- Allows Docker commands and container-based workflows to run

---

## 9) Start SonarQube locally

```powershell
cd C:\Users\dhara\OneDrive\Desktop\ai-cicd-pipeline
docker compose -f .\sonarqube\docker-compose.yml up -d
```

What it does:
- Reads the compose file for SonarQube
- Starts the SonarQube service and PostgreSQL database
- Runs in the background using detached mode (`-d`)

---

## 10) Open SonarQube in the browser

```text
http://localhost:9000
```

Login:
- username: `admin`
- password: `admin`

What it does:
- Opens the SonarQube dashboard
- Shows code quality results and findings

---

## 11) Build the Docker image locally

```powershell
cd C:\Users\dhara\OneDrive\Desktop\ai-cicd-pipeline\app
docker build -t pipeline-dashboard:local .
```

What it does:
- Builds the app's container image from the Dockerfile
- Creates a local image named `pipeline-dashboard:local`

---

## 12) Run the app as a container locally

```powershell
docker run --rm -p 8080:8080 pipeline-dashboard:local
```

What it does:
- Starts the built app image as a container
- Exposes it on port `8080`
- Lets you test the deployed runtime container behavior

---

## 13) Scan the image for vulnerabilities with Trivy

```powershell
trivy image --severity CRITICAL,HIGH --scanners vuln pipeline-dashboard:local
```

What it does:
- Scans the built Docker image for vulnerabilities
- Checks for known CVEs in the container contents
- Matches the security scanning phase in the GitHub Actions CD pipeline

---

## 14) Generate an SBOM

```powershell
syft pipeline-dashboard:local -o spdx-json > sbom.spdx.json
```

What it does:
- Lists all software packages inside the image
- Outputs an SPDX JSON file
- Helps with software supply-chain transparency and vulnerability tracking

---

## 15) Start Minikube

```powershell
minikube start --cpus=3 --memory=3400mb --driver=docker
```

What it does:
- Starts a local Kubernetes cluster on your machine
- Uses Docker as the Minikube driver
- Provides the runtime environment for testing actual rollout behavior

---

## 16) Enable ingress

```powershell
minikube addons enable ingress
```

What it does:
- Enables ingress support in the local cluster
- Helps route traffic for local application testing

---

## 17) Install Argo Rollouts

```powershell
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
```

What it does:
- Creates the namespace for Rollouts
- Installs the Argo Rollouts controller and CRDs
- Enables canary deployment and automatic rollback behavior

---

## 18) Install Prometheus and Grafana

```powershell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
kubectl create namespace monitoring
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring -f C:\Users\dhara\OneDrive\Desktop\ai-cicd-pipeline\monitoring\kube-prometheus-stack-values.yaml --wait --timeout 5m
```

What it does:
- Installs Prometheus and Grafana
- Sets up the metrics stack used by the project
- Allows health checking and monitoring of the rollout

---

## 19) Install ArgoCD

```powershell
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

What it does:
- Installs ArgoCD in the cluster
- Enables GitOps syncing from the repo into Kubernetes
- Allows the dev/prod deployment state to be managed declaratively

---

## 20) Access ArgoCD UI

```powershell
kubectl -n argocd port-forward svc/argocd-server 8080:443
```

Then open:

```text
https://localhost:8080
```

What it does:
- Forwards ArgoCD to your local machine
- Lets you inspect the GitOps application state

---

## 21) Access Grafana UI

```powershell
kubectl -n monitoring port-forward svc/monitoring-grafana 3000:80
```

Then open:

```text
http://localhost:3000
```

What it does:
- Forwards Grafana to your local machine
- Lets you inspect metrics and dashboards

---

## 22) Load the local image into Minikube

```powershell
minikube image load pipeline-dashboard:local
```

What it does:
- Loads the locally created container image into the Minikube environment
- Allows the cluster to deploy the image without needing a remote registry

---

## 23) Deploy the app to the dev namespace

```powershell
kubectl create namespace pipeline-dev
kubectl apply -n pipeline-dev -f C:\Users\dhara\OneDrive\Desktop\ai-cicd-pipeline\monitoring\servicemonitor.yaml
kubectl kustomize C:\Users\dhara\OneDrive\Desktop\ai-cicd-pipeline\k8s\overlays\dev | kubectl apply -n pipeline-dev -f -
```

What it does:
- Creates the namespace for the application
- Applies the ServiceMonitor for Prometheus scraping
- Deploys the dev Kubernetes configuration
- Starts the app in the local cluster

---

## 24) Watch the rollout and analysis status

```powershell
kubectl -n pipeline-dev get rollout -w
kubectl -n pipeline-dev get analysisrun -w
```

What it does:
- Shows the status of the Argo Rollout
- Displays canary progression and Prometheus health analysis
- Lets you observe incremental rollout behavior

---

## 25) Trigger a real failure to see automatic rollback

```powershell
kubectl -n pipeline-dev patch rollout pipeline-dashboard --type=json -p='[
  {"op":"replace","path":"/spec/template/spec/containers/1/args","value":["-nginx.scrape-uri=http://127.0.0.1:8080/this-path-does-not-exist"]},
  {"op":"add","path":"/spec/template/metadata/labels/demo","value":"broken"}
]'
```

What it does:
- Breaks the health metric used by the rollout
- Simulates a failing canary deployment
- Verifies that the canary is automatically rolled back when Prometheus analysis fails

---

## 26) Start the local control API

```powershell
cd C:\Users\dhara\OneDrive\Desktop\ai-cicd-pipeline\control-api
npm install
npm start
```

What it does:
- Installs the dependencies for the local control API
- Starts the Node server that communicates with Kubernetes
- Enables the dashboard’s “Live Cluster” tab

---

## 27) Promote dev to prod manually

```powershell
cd C:\Users\dhara\OneDrive\Desktop\ai-cicd-pipeline
node .\scripts\promote.mjs
```

What it does:
- Copies the verified dev tag into the production overlay
- Prepares the production deployment for promotion
- This is deliberately a manual step rather than automatic rollout

---

## 28) Stop SonarQube when you are done

```powershell
cd C:\Users\dhara\OneDrive\Desktop\ai-cicd-pipeline
docker compose -f .\sonarqube\docker-compose.yml down
```

What it does:
- Stops the SonarQube containers
- Removes the local stack cleanly
- Useful when you want to restart or clean up the environment

---

## Quick summary

These commands together do the following:
- install and run the frontend app
- run lint, tests, and build checks
- start SonarQube for code quality analysis
- build the Docker image
- scan it for CVEs with Trivy
- generate an SBOM
- start Minikube and install monitoring tools
- deploy the app with Argo Rollouts
- show how the canary rollout and automatic rollback work
- run the local GitOps + live cluster interaction layer

This is the full local pipeline lifecycle for the project.
