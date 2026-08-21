import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, Sparkles, Boxes, ArrowUpRight } from 'lucide-react'
import Topbar from '../components/Topbar'
import StatCard from '../components/StatCard'
import BuildTrendChart from '../components/BuildTrendChart'
import ScanResultsPanel from '../components/ScanResultsPanel'
import StatusBadge from '../components/StatusBadge'
import { formatDuration, shortSha, timeAgo } from '../lib/format'
import pipelineStatus from '../data/pipeline-status.json'

export default function Dashboard() {
  const { builds, aiReview, sonarqube, security } = pipelineStatus
  const latest = builds[0]
  const latestReview = aiReview.history[0]
  const successRate = Math.round(
    (builds.filter((b) => b.status === 'success').length / builds.length) * 100,
  )
  const avgDuration = Math.round(
    builds.reduce((sum, b) => sum + b.durationSeconds, 0) / builds.length,
  )

  return (
    <>
      <Topbar title="Dashboard" subtitle={`Last updated ${timeAgo(pipelineStatus.generatedAt)}`} />

      <main className="flex-1 space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Latest build"
            value={latest.status === 'success' ? 'Passing' : 'Failing'}
            icon={CheckCircle2}
            tone={latest.status === 'success' ? 'positive' : 'negative'}
            trendLabel={`#${latest.id} · ${shortSha(latest.commitSha)}`}
          />
          <StatCard
            label="Success rate (7 runs)"
            value={`${successRate}%`}
            icon={Sparkles}
            trendLabel="Across all branches"
          />
          <StatCard
            label="Avg. pipeline duration"
            value={formatDuration(avgDuration)}
            icon={Clock}
            trendLabel="Lint → test → scan → build"
          />
          <StatCard
            label="SBOM packages tracked"
            value={security.sbom.packageCount}
            icon={Boxes}
            trendLabel={`via ${security.sbom.tool}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BuildTrendChart builds={builds} />
          </div>

          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                AI code review
              </h3>
              <Link
                to="/pull-requests"
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                View all <ArrowUpRight size={12} />
              </Link>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              {aiReview.provider} · {aiReview.model}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{latestReview.summary}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>{latestReview.pr}</span>
              <span>{latestReview.findingsCount} findings</span>
            </div>
          </div>
        </div>

        <ScanResultsPanel security={security} sonarqube={sonarqube} />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Recent pipeline runs
          </h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {builds.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-3">
                  <StatusBadge status={b.status} />
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {shortSha(b.commitSha)}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">{b.branch}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{formatDuration(b.durationSeconds)}</span>
                  <span>{timeAgo(b.startedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  )
}
