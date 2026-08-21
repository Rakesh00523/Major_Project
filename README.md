# AI-Augmented CI/CD Pipeline

Welcome. This document assumes you know **nothing** about CI/CD, Kubernetes,
or this project — by the end, you should understand what we built, why,
and exactly what happens when you click around the dashboard.

---

## Part 1: What even is "CI/CD"?

Imagine you're on a team writing code for an app. Every time someone
changes the code, a few dangerous things could go wrong before it reaches
real users:

- The change could contain a bug
- It could accidentally introduce a security hole
- It could break something else that was working fine
- It could just be bad code that's hard to maintain

**CI/CD** ("Continuous Integration / Continuous Deployment") is the
industry term for **automating the safety checks and the shipping
process**, so a human doesn't have to manually babysit every single
change. Think of it like a factory assembly line with quality control
stations:

```
Code change → [test it] → [scan it for security issues] → [package it] →
[sign it so it can't be tampered with] → [ship it carefully] → [watch it
in production] → [undo automatically if something's wrong]
```

Every step in brackets above is something a computer does automatically,
every single time, without anyone needing to remember to do it.

**This project is a real, working example of that entire pipeline** — plus
a dashboard (a website) that lets you see and interact with it, so you
don't have to read raw logs and config files to understand what's
happening.

---

## Part 2: What we actually built

Two things, that work together:

### 1. The demo application — "Pipeline Dashboard"

A React web app (what you see in the browser). This is intentionally the
demo/product that the pipeline builds and ships — it's also, cleverly,
**a dashboard that visualizes the very pipeline shipping it**. So the app
being deployed and the tool for watching the deployment are the same
project.

### 2. The actual CI/CD pipeline

A real, working set of tools wired together — not just described in a
document, but installed and tested against a real Kubernetes cluster.
Here's every tool, and what it's for, in plain terms:

| Tool | What it actually does | Why it matters |
|---|---|---|
| **GitHub Actions** | Runs automatically whenever code changes | The "conveyor belt" that kicks everything off |
| **Gitleaks** | Scans for accidentally-committed passwords/API keys | A leaked secret is one of the most common real security disasters |
| **Vitest** | Runs automated tests | Catches "this change broke something" before a human does |
| **Google Gemini (AI)** | Reads the code change and scores how risky it is | Not just "looks fine" — gives a 0-100 risk score, lists *why*, and suggests what to test |
| **SonarQube** | Checks code quality (not bugs — style/maintainability) | Keeps the codebase from rotting over time |
| **Trivy** | Scans the built app for known security vulnerabilities | Finds "this software you're using has a known hole" |
| **Syft** | Lists every single software package inside the built app (an "SBOM") | If a vulnerability is announced tomorrow, you can instantly check "do we use that?" |
| **Cosign** | Digitally signs the built app | Proves the app that gets deployed is exactly what the pipeline built — nobody swapped it |
| **Docker** | Packages the app into a portable container | The actual "box" that gets shipped and run anywhere |
| **Kubernetes** | Runs the app on a server (we used a local one, "Minikube") | The actual computer(s) the app lives on in production |
| **ArgoCD** | Watches a Git repo and keeps the live app in sync with it ("GitOps") | You update a config file, not manually SSH into a server |
| **Argo Rollouts** | Deploys new versions *gradually* (25% of traffic → 50% → 100%) instead of all-at-once | If the new version is broken, only a fraction of users ever see it |
| **Prometheus** | Continuously monitors whether the running app is healthy | The "vital signs monitor" |
| **Grafana** | Turns Prometheus's raw numbers into readable graphs | The "hospital monitor screen" |

**The single most important idea in this whole project**: Argo Rollouts +
Prometheus work together so that **a bad deployment gets detected and
automatically undone, with no human needing to notice or act**. We didn't
just build this and hope — we broke it on purpose and watched it heal
itself. More on that below.

---

## Part 3: The dashboard, page by page

Open the app (`npm run dev` in `app/`, or visit whatever URL your teammate
gives you) and sign in — **the login is a demo, type literally anything
and hit Sign in.** There's no real password check.

### 🔑 A rule that applies to the whole dashboard

Every number you see is either:
1. **Real** — something that genuinely happened while we built this (a real commit, a real security scan, a real automatic rollback we triggered and watched happen), or
2. **Clearly labeled as a simulation** — a "what if this happened" walkthrough that never touches the real infrastructure.

Nothing is presented as real when it isn't. If you ever wonder "is this
number actually true," the answer is: yes, unless the page explicitly says
"simulation" or "demo."

### Dashboard (home page)

The overview. Shows:
- **Repository overview** — real stats: how many real commits went into this project tonight (8), how many were AI-reviewed, and little "gauge" dials showing how long each pipeline stage actually took (lint: 1 second, tests: 8 seconds, security scan: 15 seconds, etc. — all real measured times)
- **Latest build / success rate / avg pipeline duration / SBOM package count** — real numbers computed from the real commit history
- **A search box** — type a commit hash or a word from a commit message (try "grafana" or "docker") and the "Recent pipeline runs" list below filters live, no need to press Enter
- **AI code review preview** — the most recent AI risk assessment
- **Recent pipeline runs** — the actual 8 real commits that went into building this project tonight, with their real messages and real durations

### 🚀 Pipeline Control — the interactive part

This is the page that answers "okay, but what can I actually *do* here?"
It has **two tabs**:

**Demo Simulation tab** — pick a scenario from the dropdown and click "Run
scenario." It animates through the pipeline stages (fast, for watchability)
and lands on a **Release Readiness gate**: green "SAFE TO PROMOTE" or red
"NOT SAFE TO PROMOTE" with the specific reason. Four scenarios:
- ✅ **Successful deployment** — everything passes (this is literally the real path our actual commit took)
- 🧪 **Unit test failure** — stops immediately, nothing downstream even runs
- 🔐 **Security gate failure** — a simulated CRITICAL vulnerability blocks the release
- 🔄 **Canary failure → automatic rollback** — the flagship scenario. Everything passes until the very last health check, which fails — then you watch the system detect it and roll itself back, automatically

This is **simulated** — it replays real data and real timing, but clicking
these buttons does not touch any real server.

**Live Cluster tab** — this one *is* real. If you (or a teammate) started
`control-api` (see Part 4), this tab talks to an actual local Kubernetes
cluster via real `kubectl` commands:
- **"Deploy for real"** triggers an actual new deployment on the real cluster and shows real status, polled every 3 seconds
- **"Inject real failure"** actually breaks the running app's health-check on purpose, and you watch — in real time — the monitoring system detect it and the deployment system automatically roll it back
- **"Restore healthy"** fixes it back

If the Live Cluster tab says "unavailable," that's fine — it just means
nobody's got the local cluster running right now; the Demo Simulation tab
still works perfectly and needs nothing extra.

### Deployments

Shows each environment (`dev` and `prod`) and its current state — is it
in sync, is it healthy, what version is running, and (for the canary
mechanism) what percentage of traffic is currently on the new version.
Also shows **DORA metrics** — four numbers the industry uses to measure
how good a team's delivery process is (how often you deploy, how fast
a change gets to production, how often deploys fail, how fast you recover
from a failure).

Honest note: `prod` shows "Awaiting promotion" — we deliberately never
faked a production deployment that didn't really happen. Promoting to
prod is a manual, deliberate step (`scripts/promote.mjs`), never automatic.

### Code Reviews

Every real commit from tonight, run through the AI risk-assessment step:
a 0-100 risk score, *why* it's risky (or not), what tests are recommended,
and a recommendation (safe to auto-deploy, vs. needs a human to approve).
This used to be called "Pull Requests" but we renamed it — these are real
commits reviewed by our AI step, not actual GitHub pull requests (we
didn't have those tonight), so the old name was misleading.

### AI Insights

- **Pipeline failure prediction** — a donut chart of how likely a future run is to fail (low/medium/high)
- **Top failure causes** — ranked list of what tends to break pipelines
- **"Verified live: self-healing rollout"** — the actual real event log from when we broke the canary deployment on purpose tonight and watched Argo Rollouts catch it and roll back, with the real measurement values
- **"Simulate deployment failure"** — a click-through walkthrough narrating that same real mechanism, for anyone who wants to see the story without touching the live cluster

### Security

- **Trivy scan results** — real: 0 critical, 0 high, 0 medium, 0 low vulnerabilities in the built app (shown as a green "No vulnerabilities found," not an empty chart)
- **SBOM** — real: 72 packages listed (generated by Syft)
- **Cosign signature** — the image-signing mechanics were verified for real locally; genuine production signing only happens once this is pushed to GitHub (explained honestly on the page)
- **Secret scanning** — real: 0 secrets found by Gitleaks
- **SLOs (Service Level Objectives)** — target vs. actual numbers for availability, error rate, and response time, with an "error budget" showing how much room is left before those targets are missed

### Settings

Dark mode toggle, notification preference toggles (these actually hold
state now — flip one and it stays flipped), and account info. Nothing
fancy, but everything here is genuinely interactive (it used to not be —
see "Known history" below if curious).

---

## Part 4: How to actually run this yourself

### Just the dashboard (easiest, ~10 seconds)

```bash
cd app
npm install
npm run dev
```

Open the URL it prints. This alone gives you the entire dashboard with
all real data and the full Demo Simulation experience. No Docker, no
Kubernetes, nothing else required.

### The full real pipeline (optional, more setup)

Requires Docker Desktop, `kubectl`, `minikube`, and `helm`. Full,
step-by-step, **actually-tested** instructions are in
[`docs/RUNBOOK.md`](docs/RUNBOOK.md) — it documents the exact commands
that were run to build and verify this project, including how to
reproduce the live automatic-rollback demo yourself.

Short version if the cluster's already set up:
```bash
minikube start
cd control-api && npm install && npm start   # enables the Live Cluster tab
```

---

## Part 5: Project structure — what's in each folder

| Folder | What's in it |
|---|---|
| [`app/`](app) | The React dashboard — everything in Part 3 above |
| [`control-api/`](control-api) | The small local server that makes the "Live Cluster" tab real |
| [`.github/workflows/`](.github/workflows) | The actual CI/CD pipeline definitions (`ci.yml`, `cd.yml`) — what would run on GitHub if this were pushed there |
| [`scripts/`](scripts) | Small helper scripts: the AI review bot, and the ones that bump/promote deployment versions |
| [`sonarqube/`](sonarqube) | Config to run SonarQube locally |
| [`k8s/`](k8s) | The Kubernetes configuration for how the app should run (the "Rollout," the canary steps, etc.) |
| [`argocd/`](argocd) | Configuration for ArgoCD (the GitOps piece) |
| [`monitoring/`](monitoring) | Prometheus/Grafana configuration |
| [`docs/`](docs) | The detailed technical docs — architecture, security model, and the full tested runbook |

---

## Part 6: The single most impressive thing to show someone

If you only have one minute to demo this to someone: go to
**Pipeline Control → Demo Simulation → pick "Canary failure — automatic
rollback" → Run scenario**. Watch it get all the way through a real-looking
deployment, watch the health check fail, and watch the system abort and
heal itself automatically — then look at the timeline, which shows this
was verified for real (not just simulated) with actual timestamps and
actual measured values.

That one sequence is the entire point of the project: **software that
catches its own mistakes and fixes them without a human in the loop.**
