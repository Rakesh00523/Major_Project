import { ArrowDown } from 'lucide-react'

const REAL_STORY = [
  'Commit e7350c7 pushed to main',
  'CI pipeline triggered',
  'Lint passed (oxlint)',
  'Unit tests passed (Vitest)',
  'AI risk review completed — low risk, auto-deploy',
  'SonarQube quality gate passed',
  'Trivy found 0 CRITICAL/HIGH vulnerabilities',
  'SBOM generated (72 packages, Syft)',
  'Docker image signed (Cosign)',
  'GitOps manifest updated (scripts/bump-image-tag.mjs)',
  'Rollout applied to the cluster',
  'Canary started at 25% traffic',
  'Prometheus analysis passed (exporter-up = 1)',
  'Canary promoted to 50%, then 100%',
  'Deployment marked HEALTHY',
]

export default function DeploymentStory({ tag = 'e7350c7' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Why was <span className="font-data">{tag}</span> deployed?
        </h3>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          Real sequence
        </span>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        This is the actual sequence tonight's dev deploy went through — every step here really happened.
      </p>

      <ol className="space-y-0">
        {REAL_STORY.map((line, i) => (
          <li key={line} className="flex flex-col items-start">
            <div className="flex items-center gap-3">
              <span className="font-data flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                {i + 1}
              </span>
              <span className="py-1.5 text-sm text-slate-700 dark:text-slate-300">{line}</span>
            </div>
            {i < REAL_STORY.length - 1 && (
              <ArrowDown size={12} className="ml-[11px] my-0.5 text-slate-300 dark:text-slate-700" />
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
