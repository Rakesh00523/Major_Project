# Review Demonstration Guide: AI-Augmented CI/CD Pipeline & Real Authentication

This document is your exact step-by-step presentation script for your project review. Follow these steps in order to demonstrate every working capability cleanly and professionally.

---

## Part 1: Architecture & Working Features Overview

| Component | Status | Technology | Verification |
|---|---|---|---|
| **Frontend Dashboard** | **Real & Working** | React 19, Vite 8, Tailwind v4, Lucide | 20 unit/component tests pass |
| **Authentication Backend** | **Real & Working** | Node.js Express, better-sqlite3, bcryptjs, cookie-parser | 16 backend unit/integration tests pass |
| **User Persistence** | **Real & Working** | SQLite (`control-api/data/pipeline.db`), WAL mode, ACID transactions | Verified persistent across server restarts |
| **Protected Views** | **Real & Working** | React `ProtectedRoute` + HTTP-only cookie sessions | Unauthenticated visits redirect to `/login` |
| **Automated Pipeline** | **Real & Working** | `npm run pipeline` (`scripts/local-pipeline.mjs`) | 1-command runs 14 stages and updates dashboard |
| **GitHub Actions CI/CD** | **Real & Working** | `.github/workflows/ci.yml` & `cd.yml` | Automatic `push`, `pull_request`, and `workflow_dispatch` triggers |
| **Security Gates** | **Real & Working** | Gitleaks (secrets), Trivy (CVEs), Syft (SPDX SBOM), Cosign (signing) | Automated gates with failure halting |
| **Docker Deployment** | **Real & Working** | Multi-stage Dockerfile + `docker-compose.yml` | Healthcheck verified at `/healthz` |
| **Kubernetes GitOps** | **Optional Path** | Minikube, Kustomize, ArgoCD, Argo Rollouts, Prometheus | Fully preserved in `k8s/`, `argocd/`, `monitoring/` |

---

## Part 2: Step-by-Step Live Demonstration Script

### Step 1: Start the Backend & Frontend (Local Demo)

Open two terminals:

**Terminal A (Backend Auth API):**
```powershell
cd control-api
npm start
# Server listens on port 4001: [control-api] listening on port 4001
```

**Terminal B (Frontend Application):**
```powershell
cd app
npm run dev
# Vite runs at http://localhost:5173
```

Open your browser to: **`http://localhost:5173`**

---

### Step 2: Demonstrate Route Protection
1. Navigate directly to `http://localhost:5173/dashboard` or `http://localhost:5173/pipeline-control` in an incognito window.
2. **What your reviewer sees:** The application instantly intercepts the request and redirects to `/login`. Unauthenticated users cannot access dashboard telemetry or controls.

---

### Step 3: Demonstrate Real User Registration
1. On the login screen, click **"Create an account"** (or go to `http://localhost:5173/register`).
2. Try submitting empty fields:
   - Notice the inline validation indicators: *"Full name is required"*, *"Email address is required"*.
3. Try typing mismatched passwords or a password shorter than 8 characters:
   - Notice the real-time validation: *"Password must be at least 8 characters long"*, *"Passwords do not match"*.
4. Enter real details:
   - **Full Name:** `Alex Reviewer`
   - **Email:** `alex@pipeline.local`
   - **Password:** `ReviewerPass2026!`
   - **Confirm Password:** `ReviewerPass2026!`
5. Toggle the **eye icon** to demonstrate masked password input.
6. Click **"Create account"**:
   - The backend hashes the password using **salted bcrypt (10 rounds)**, creates a real user record in SQLite, issues a secure HTTP-only cookie, and redirects into the dashboard.

---

### Step 4: Demonstrate Dashboard & Profile Telemetry
1. Once logged in, look at the bottom-left sidebar:
   - Notice your real user profile: **Alex Reviewer** (`alex@pipeline.local`).
2. Topbar displays your user initial **"A"**.
3. Browse the tabs:
   - **Dashboard**: Live commit telemetry, recent pipeline runs, stage duration charts.
   - **Security**: Trivy vulnerability gates, Syft SBOM summary, SLO tracking.
   - **Code Reviews**: Gemini AI pull request review history and deployment risk scoring.

---

### Step 5: Demonstrate Sign Out & Invalid Login Handling
1. In the sidebar, click the **Log Out icon**:
   - The backend deletes the session from the database, clears the cookie, and redirects to `/login`.
2. Try logging in with the wrong password:
   - **Email:** `alex@pipeline.local`
   - **Password:** `WrongPassword123!`
3. Click **"Sign in"**:
   - Notice the safe, generic error: *"Invalid email or password"*. (Zero email enumeration leakage).
4. Enter the correct password: `ReviewerPass2026!`:
   - Instant successful login back into the dashboard.

---

### Step 6: Demonstrate 1-Command Automated CI/CD Pipeline
In your terminal, run from the project root:
```powershell
npm run pipeline
```

**What your reviewer sees:**
The engine executes without requiring anyone to type commands across multiple terminals:
1. **Source & Git Checkout**: Inspects commit SHA (`8ba3460`) and branch (`main`).
2. **Dependency Detection**: Verifies React frontend and Express/SQLite backend.
3. **Dependency Integrity**: Checks npm dependencies.
4. **Linting**: Runs oxlint and confirms zero errors.
5. **Backend Authentication Tests**: Runs `node:test` suite (16 tests pass in ~1.1s).
6. **Frontend Component Tests**: Runs Vitest suite (20 tests pass in ~3.8s).
7. **Secret Scanning**: Verifies Gitleaks integration.
8. **AI Review Gate**: Verifies Gemini review readiness.
9. **Docker Multi-Stage Build**: Builds image and checks `/healthz`.
10. **Dashboard Update**: Automatically writes execution timestamp, duration, and status to `app/src/data/pipeline-status.json`.

---

### Step 7: Demonstrate Full Automated Test Suite
From the root terminal, run:
```powershell
npm test
```
**Result:** 36 automated tests pass in ~7 seconds (16 backend authentication tests + 20 frontend component tests).

---

## Part 3: What is Real vs Optional / Simulated

1. **Real & Fully Verified**:
   - Express + SQLite authentication backend with session tables and bcrypt hashing.
   - Login and Register frontend pages with form validation and show/hide password.
   - Protected dashboard routes and automatic unauthenticated redirection.
   - 36 automated unit, integration, and security tests.
   - 1-command local automated pipeline script (`npm run pipeline`).
   - GitHub Actions automated triggers on `push`, `pull_request`, and `workflow_dispatch`.
   - Multi-stage Dockerfile and unified `docker-compose.yml`.

2. **Optional Integrations (Require external credentials or services)**:
   - **Live Gemini PR Review**: Enabled automatically when `GEMINI_API_KEY` is added to repository secrets.
   - **SonarQube Quality Gate**: Requires Docker Desktop running with `sonarqube/docker-compose.yml`.
   - **Minikube / Argo Rollouts**: Optional Kubernetes progressive canary path (see `docs/DEPLOYMENT_GUIDE_NEW_SYSTEM.md`).
