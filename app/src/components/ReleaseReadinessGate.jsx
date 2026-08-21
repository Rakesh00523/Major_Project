import { CheckCircle2, XCircle, MinusCircle, ShieldCheck, ShieldAlert } from 'lucide-react'
import clsx from 'clsx'
import { READINESS_LABELS } from '../data/scenarios'

function RowIcon({ value }) {
  if (value === true) return <CheckCircle2 size={16} className="text-emerald-500" />
  if (value === false) return <XCircle size={16} className="text-red-500" />
  return <MinusCircle size={16} className="text-slate-300 dark:text-slate-600" />
}

export default function ReleaseReadinessGate({ readiness, blocked, blockedReason, blockedActions }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border p-5 shadow-sm',
        blocked
          ? 'border-red-200 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/5'
          : 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5',
      )}
    >
      <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
        Release readiness
      </h3>
      <ul className="mb-4 space-y-2">
        {READINESS_LABELS.map(({ key, label }) => (
          <li key={key} className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-300">{label}</span>
            <RowIcon value={readiness[key]} />
          </li>
        ))}
      </ul>

      <div
        className={clsx(
          'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold',
          blocked
            ? 'bg-red-600 text-white'
            : 'bg-emerald-600 text-white',
        )}
      >
        {blocked ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
        {blocked ? 'NOT SAFE TO PROMOTE' : 'SAFE TO PROMOTE'}
      </div>

      {blocked && blockedReason && (
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          <p>
            <span className="font-medium text-slate-700 dark:text-slate-300">Reason: </span>
            {blockedReason}
          </p>
          {blockedActions?.length > 0 && (
            <p className="mt-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Blocked: </span>
              {blockedActions.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
