import { CheckCircle2, XCircle, Loader2, Circle } from 'lucide-react'
import clsx from 'clsx'

export default function PipelineRunTimeline({ steps, currentIndex, status }) {
  if (steps.length === 0) return null

  return (
    <ol className="space-y-1.5">
      {steps.map((step, i) => {
        const isPast = i < currentIndex || (i === currentIndex && status === 'done')
        const isCurrent = i === currentIndex && status === 'running'
        const failed = step.fails && (isPast || isCurrent)

        let Icon = Circle
        let iconClass = 'text-slate-300 dark:text-slate-700'
        if (failed) {
          Icon = XCircle
          iconClass = 'text-red-500'
        } else if (isCurrent) {
          Icon = Loader2
          iconClass = 'animate-spin text-indigo-500'
        } else if (isPast) {
          Icon = CheckCircle2
          iconClass = 'text-emerald-500'
        }

        return (
          <li
            key={step.key}
            className={clsx(
              'flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isCurrent && 'bg-indigo-50 dark:bg-indigo-500/10',
              failed && 'bg-red-50 dark:bg-red-500/10',
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon size={16} className={clsx('shrink-0', iconClass)} />
              <span
                className={clsx(
                  isPast || isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400',
                )}
              >
                {step.label}
              </span>
            </div>
            {step.tool && (
              <span className="font-data shrink-0 text-xs text-slate-400">
                {step.tool}
                {step.realSeconds > 0 && ` · ${step.realSeconds}s real`}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
