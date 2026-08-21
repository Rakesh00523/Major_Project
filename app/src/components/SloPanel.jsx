import clsx from 'clsx'

function SloRow({ label, current, target, unit = '%', higherIsBetter = true }) {
  const met = higherIsBetter ? current >= target : current <= target
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {current}
          {unit}
        </span>
        <span
          className={clsx(
            'text-xs',
            met ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
          )}
        >
          {met ? '✓' : '✗'} target {target}
          {unit}
        </span>
      </div>
    </div>
  )
}

export default function SloPanel({ slo }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
        Service-level objectives
      </h3>
      <p className="mb-2 text-xs text-slate-400">
        Error budget remaining: {slo.errorBudgetRemainingPct}%
      </p>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <SloRow label="Availability" current={slo.availabilityPct.current} target={slo.availabilityPct.target} />
        <SloRow label="HTTP success rate" current={slo.httpSuccessPct.current} target={slo.httpSuccessPct.target} />
        <SloRow
          label="P95 latency"
          current={slo.p95LatencyMs.current}
          target={slo.p95LatencyMs.target}
          unit="ms"
          higherIsBetter={false}
        />
        <SloRow
          label="Deployment success rate"
          current={slo.deploymentSuccessPct.current}
          target={slo.deploymentSuccessPct.target}
        />
      </div>
    </div>
  )
}
