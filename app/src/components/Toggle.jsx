import { Check } from 'lucide-react'
import clsx from 'clsx'

export default function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={clsx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-out',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
          checked
            ? 'bg-gradient-to-r from-indigo-500 to-violet-600 shadow-[0_0_12px_-2px_rgba(99,102,241,0.7)]'
            : 'bg-slate-200 dark:bg-slate-700',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-200 ease-out',
            checked && 'translate-x-5',
          )}
        >
          {checked && <Check size={12} strokeWidth={3} className="text-indigo-600" />}
        </span>
      </button>
    </div>
  )
}
