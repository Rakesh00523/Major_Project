# Pipeline Dashboard

The demo application for the [AI-Augmented CI/CD Pipeline](../README.md) —
a React + Vite SaaS-style dashboard that visualizes the pipeline's own build
history, security scan results, and deployment status.

## Development

```bash
npm install
npm run dev            # start the dev server
npm run lint           # oxlint
npm run test           # vitest
npm run test:coverage  # vitest with coverage report
npm run build          # production build to dist/
```

## Structure

- `src/pages/` — Login, Dashboard, Deployments, Pull Requests, Settings
- `src/components/` — Sidebar, Topbar, MobileNav, charts, tables
- `src/data/pipeline-status.json` — the mock/live data every page renders
- `src/lib/` — small theme and formatting helpers

See [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for how this app fits
into the rest of the pipeline, and [`Dockerfile`](Dockerfile) for how it's
containerized (multi-stage build, nginx-alpine runtime, non-root user).
