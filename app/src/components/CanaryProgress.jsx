import clsx from 'clsx'

export default function CanaryProgress({ rollout }) {
  if (!rollout) return null

  const { phase, canaryWeightPct, steps, analysis } = rollout
  const isHealthy = phase === 'Healthy'
  const isPending = phase === 'Not started'

  return (
    <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500 dark:text-slate-400">
          Canary rollout · steps {steps.join('% → ')}%
        </span>
        <span
          className={clsx(
            'font-semibold',
            isHealthy && 'text-emerald-600 dark:text-emerald-400',
            isPending && 'text-slate-400 dark:text-slate-500',
            !isHealthy && !isPending && 'text-amber-600 dark:text-amber-400',
          )}
        >
          {phase}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${canaryWeightPct}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Auto-promote/rollback via Argo Rollouts analysis: {analysis}
      </p>
    </div>
  )
}
