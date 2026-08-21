import clsx from 'clsx'

const STYLES = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Synced: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Healthy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Passed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  OutOfSync: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  Degraded: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400',
}

export default function StatusBadge({ status }) {
  const style = STYLES[status] ?? STYLES.default
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        style,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}
