import { useEffect } from 'react'
import { Rocket, Flame, RotateCcw, Radio } from 'lucide-react'
import clsx from 'clsx'
import ReleaseReadinessGate from './ReleaseReadinessGate'
import { useLiveCluster } from '../lib/useLiveCluster'

const PHASE_TONE = {
  Healthy: 'text-emerald-600 dark:text-emerald-400',
  Progressing: 'text-indigo-600 dark:text-indigo-400',
  Paused: 'text-amber-600 dark:text-amber-400',
  Degraded: 'text-red-600 dark:text-red-400',
}

export default function LiveClusterPanel() {
  const cluster = useLiveCluster()

  useEffect(() => {
    if (cluster.available) cluster.startPolling()
    return () => cluster.stopPolling()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cluster.available])

  if (cluster.available === null) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900">
        Checking for a live cluster connection…
      </div>
    )
  }

  if (cluster.available === false) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
        <p className="font-medium text-slate-700 dark:text-slate-300">
          Live cluster mode is unavailable right now.
        </p>
        <p className="mt-1 text-xs">
          Couldn't reach the control API at <code className="font-data">127.0.0.1:4001</code>. Run{' '}
          <code className="font-data">npm start</code> in <code className="font-data">control-api/</code>{' '}
          (with Minikube running) to enable it — falling back to the demo simulation above.
        </p>
        <button
          type="button"
          onClick={cluster.checkHealth}
          className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Retry
        </button>
      </div>
    )
  }

  const rollout = cluster.status?.rollout
  const analysisRun = cluster.status?.analysisRun
  const canaryHealthy =
    analysisRun?.phase === 'Successful' ? true : analysisRun?.phase === 'Failed' ? false : null

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Live cluster — real kubectl status, polled every 3s
          </h3>
        </div>

        {rollout && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Rollout phase" value={rollout.phase} tone={PHASE_TONE[rollout.phase]} />
            <Stat label="Current step" value={rollout.currentStepIndex ?? '—'} />
            <Stat
              label="Analysis"
              value={analysisRun?.phase ?? 'none'}
              tone={
                analysisRun?.phase === 'Successful'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : analysisRun?.phase === 'Failed'
                    ? 'text-red-600 dark:text-red-400'
                    : undefined
              }
            />
            <Stat label="Metric value" value={analysisRun?.value ?? '—'} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={cluster.busy}
            onClick={() => cluster.deploy(false)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:brightness-110 disabled:opacity-50"
          >
            <Rocket size={15} />
            Deploy for real
          </button>
          <button
            type="button"
            disabled={cluster.busy}
            onClick={() => cluster.deploy(true)}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/20 hover:brightness-110 disabled:opacity-50"
          >
            <Flame size={15} />
            Inject real failure
          </button>
          <button
            type="button"
            disabled={cluster.busy}
            onClick={cluster.restore}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw size={14} />
            Restore healthy
          </button>
        </div>

        {cluster.status?.pods && (
          <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 dark:border-slate-800">
            {cluster.status.pods.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <span className="font-data text-slate-500 dark:text-slate-400">{p.name}</span>
                <span
                  className={clsx(
                    'font-medium',
                    p.ready ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                  )}
                >
                  {p.phase} {p.ready ? '· ready' : '· not ready'}
                </span>
              </div>
            ))}
          </div>
        )}

        {cluster.error && (
          <p className="mt-3 flex items-center gap-1 text-xs text-red-500">
            <Radio size={12} /> {cluster.error}
          </p>
        )}
      </div>

      {rollout && (
        <>
          <p className="-mb-1 text-xs text-slate-400">
            Lint/test/Sonar/Trivy/SBOM/Cosign/GitOps rows below reflect tonight's verified CI
            run (not re-checked live) — only <strong>Canary healthy</strong> is driven by the
            live poll above.
          </p>
          <ReleaseReadinessGate
          readiness={{
            lint: true,
            test: true,
            sonar: true,
            trivy: true,
            sbom: true,
            cosign: true,
            gitops: true,
            canary: canaryHealthy,
          }}
          blocked={canaryHealthy === false || rollout.abort}
          blockedReason={
            canaryHealthy === false
              ? `Live AnalysisRun ${analysisRun?.name}: metric value ${analysisRun?.value}, phase Failed`
              : undefined
          }
          blockedActions={canaryHealthy === false ? ['Promotion to 50%/100%'] : undefined}
          />
        </>
      )}
    </div>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={clsx('font-data text-sm font-semibold text-slate-900 dark:text-white', tone)}>
        {value}
      </p>
    </div>
  )
}
