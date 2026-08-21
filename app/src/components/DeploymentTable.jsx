import StatusBadge from './StatusBadge'
import CanaryProgress from './CanaryProgress'
import { shortSha, timeAgo } from '../lib/format'

export default function DeploymentTable({ environments }) {
  return (
    <div className="space-y-4">
      {environments.map((env) => (
        <div
          key={env.name}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold capitalize text-slate-900 dark:text-white">
                {env.name}
              </span>
              <StatusBadge status={env.status} />
              <StatusBadge status={env.health} />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono">{shortSha(env.imageTag)}</span>
              <span>{env.replicas} replica{env.replicas === 1 ? '' : 's'}</span>
              <span>synced {timeAgo(env.lastSync)}</span>
            </div>
          </div>

          <CanaryProgress rollout={env.rollout} />
        </div>
      ))}
    </div>
  )
}
