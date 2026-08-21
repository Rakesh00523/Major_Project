import { CheckCircle2, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { timeAgo } from '../lib/format'

export default function SelfHealingLog({ selfHealing }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Verified live: self-healing rollout
        </h3>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          Real event log
        </span>
      </div>
      <p className="mb-4 text-xs text-slate-400">{selfHealing.description}</p>

      <ol className="space-y-3">
        {selfHealing.events.map((event) => {
          const ok = event.phase === 'Successful'
          return (
            <li
              key={event.analysisRun}
              className={clsx(
                'rounded-xl border-l-4 p-3',
                ok
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5'
                  : 'border-red-500 bg-red-50 dark:bg-red-500/5',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  {ok ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {event.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {event.detail}
                    </p>
                  </div>
                </div>
                <span className="font-data shrink-0 text-xs text-slate-400">
                  {timeAgo(event.at)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 pl-6 text-[11px] text-slate-400">
                <span className="font-data">{event.analysisRun}</span>
                <span>·</span>
                <span className="font-data">metric value = {event.metricValue}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
