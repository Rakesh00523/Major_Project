import clsx from 'clsx'

const LEVEL_STYLES = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
}

const LEVEL_TEXT = {
  low: 'text-emerald-600 dark:text-emerald-400',
  medium: 'text-amber-600 dark:text-amber-400',
  high: 'text-red-600 dark:text-red-400',
}

export default function RiskScoreBar({ score, level }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500 dark:text-slate-400">AI deployment risk</span>
        <span className={clsx('font-semibold uppercase', LEVEL_TEXT[level])}>
          {score}/100 · {level}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={clsx('h-full rounded-full transition-all', LEVEL_STYLES[level])}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
