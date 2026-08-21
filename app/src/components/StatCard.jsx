import clsx from 'clsx'

export default function StatCard({ label, value, icon: Icon, trendLabel, tone = 'default' }) {
  const toneStyles = {
    default: 'text-slate-500 dark:text-slate-400',
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-red-600 dark:text-red-400',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>
      {trendLabel && (
        <p className={clsx('mt-3 text-xs font-medium', toneStyles[tone])}>{trendLabel}</p>
      )}
    </div>
  )
}
