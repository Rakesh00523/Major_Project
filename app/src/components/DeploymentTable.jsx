import StatusBadge from './StatusBadge'
import { shortSha, timeAgo } from '../lib/format'

export default function DeploymentTable({ environments }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
          <tr>
            <th className="px-5 py-3">Environment</th>
            <th className="px-5 py-3">Sync status</th>
            <th className="px-5 py-3">Health</th>
            <th className="px-5 py-3">Image tag</th>
            <th className="px-5 py-3">Replicas</th>
            <th className="px-5 py-3">Last sync</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {environments.map((env) => (
            <tr key={env.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-5 py-3 font-medium capitalize text-slate-900 dark:text-white">
                {env.name}
              </td>
              <td className="px-5 py-3">
                <StatusBadge status={env.status} />
              </td>
              <td className="px-5 py-3">
                <StatusBadge status={env.health} />
              </td>
              <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                {shortSha(env.imageTag)}
              </td>
              <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{env.replicas}</td>
              <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                {timeAgo(env.lastSync)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
