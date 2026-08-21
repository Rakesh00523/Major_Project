import { Rocket, Timer, TrendingDown, Wrench } from 'lucide-react'

export default function DoraMetrics({ dora }) {
  const items = [
    {
      label: 'Deployment frequency',
      value: `${dora.deploymentFrequencyPerMonth}/mo`,
      icon: Rocket,
    },
    { label: 'Lead time for changes', value: `${dora.leadTimeMinutes} min`, icon: Timer },
    {
      label: 'Change failure rate',
      value: `${dora.changeFailureRatePct}%`,
      icon: TrendingDown,
    },
    { label: 'Mean time to recovery', value: `${dora.mttrMinutes} min`, icon: Wrench },
  ]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
        DORA metrics
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label}>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Icon size={14} />
              {label}
            </div>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
