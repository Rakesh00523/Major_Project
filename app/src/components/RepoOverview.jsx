import { GitCommit, Users, GitPullRequest, Timer } from 'lucide-react'
import GaugeRing from './GaugeRing'
import { shortSha, timeAgo } from '../lib/format'

function MiniStat({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Icon size={13} />
        {label}
      </div>
      <p
        className="font-data mt-1 text-lg font-semibold"
        style={{ color: accent }}
      >
        {value}
      </p>
    </div>
  )
}

export default function RepoOverview({ repoOverview, generatedAt }) {
  const { contributors, commits, pullRequestsReviewed, devRelease, prodRelease, deployedPct, stageDurations } =
    repoOverview

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Repository overview
        </h3>
        <span className="font-data text-xs text-slate-400">
          synced {timeAgo(generatedAt)}
        </span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat icon={GitCommit} label="Dev release" value={shortSha(devRelease.tag)} accent="#6366f1" />
        <MiniStat
          icon={GitCommit}
          label="Prod release"
          value={prodRelease.tag ? shortSha(prodRelease.tag) : prodRelease.status}
          accent="#94a3b8"
        />
        <MiniStat icon={Users} label="Contributors" value={contributors} accent="#10b981" />
        <MiniStat icon={GitPullRequest} label="Reviewed today" value={pullRequestsReviewed} accent="#f59e0b" />
      </div>

      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Timer size={13} />
        Pipeline stage durations
        <span className="font-data text-slate-400">· {commits} commits · {deployedPct}% deployed</span>
      </div>
      <div className="flex flex-wrap justify-between gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40">
        {stageDurations.map((stage) => (
          <GaugeRing
            key={stage.key}
            label={stage.label}
            seconds={stage.seconds}
            tool={stage.tool}
            maxSeconds={stage.key === 'docker' || stage.key === 'canary' ? 90 : 30}
            warnAt={stage.key === 'docker' || stage.key === 'canary' ? 60 : 15}
          />
        ))}
      </div>
    </div>
  )
}
