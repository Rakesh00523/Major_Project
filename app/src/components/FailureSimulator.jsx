import { useState, useRef } from 'react'
import { Flame, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

// Client-side narrated walkthrough of what Argo Rollouts + the Prometheus
// AnalysisTemplate actually do in the cluster when a canary regresses:
// ramp traffic, detect the error-rate breach, abort, and roll back. This
// panel doesn't touch the live cluster — it's a demo of the decision logic
// that's really running in k8s/base/rollout.yaml's analysis step.
const STEPS = [
  { id: 'deploy', label: 'Deploying canary at 25% traffic', duration: 1400 },
  { id: 'monitor', label: 'Monitoring error rate via Prometheus', duration: 1600 },
  { id: 'breach', label: 'Error rate 8.4% exceeds 5% threshold', duration: 1400 },
  { id: 'rollback', label: 'Aborting rollout, reverting to stable', duration: 1600 },
  { id: 'recovered', label: 'Production restored to previous version', duration: 0 },
]

export default function FailureSimulator() {
  const [stepIndex, setStepIndex] = useState(-1)
  const timeoutRef = useRef(null)

  function run(index) {
    if (index >= STEPS.length) return
    setStepIndex(index)
    if (STEPS[index].duration > 0) {
      timeoutRef.current = setTimeout(() => run(index + 1), STEPS[index].duration)
    }
  }

  function start() {
    clearTimeout(timeoutRef.current)
    run(0)
  }

  function reset() {
    clearTimeout(timeoutRef.current)
    setStepIndex(-1)
  }

  const isRunning = stepIndex >= 0 && stepIndex < STEPS.length - 1
  const isDone = stepIndex === STEPS.length - 1

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Simulate deployment failure
        </h3>
        {isDone ? (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw size={13} /> Reset
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={isRunning}
            className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Flame size={13} /> Inject failure
          </button>
        )}
      </div>

      <p className="mb-4 text-xs text-slate-400">
        Walks through what the Argo Rollouts + Prometheus analysis step actually does
        in the cluster when a canary regresses (see{' '}
        <code className="text-[11px]">k8s/base/rollout.yaml</code>).
      </p>

      <ol className="space-y-2">
        {STEPS.map((step, i) => {
          const active = i === stepIndex
          const done = stepIndex > i || isDone
          const isBreach = step.id === 'breach'
          return (
            <li
              key={step.id}
              className={clsx(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                active && (isBreach ? 'bg-red-50 dark:bg-red-500/10' : 'bg-indigo-50 dark:bg-indigo-500/10'),
                !active && done && 'opacity-60',
              )}
            >
              {done && !active ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              ) : active && isBreach ? (
                <AlertTriangle size={16} className="shrink-0 animate-pulse text-red-500" />
              ) : active ? (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-200 dark:border-slate-700" />
              )}
              <span
                className={clsx(
                  active || done ? 'text-slate-900 dark:text-white' : 'text-slate-400',
                )}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
