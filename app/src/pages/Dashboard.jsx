import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, Sparkles, Boxes, ArrowUpRight } from 'lucide-react'
import Topbar from '../components/Topbar'
import StatCard from '../components/StatCard'
import BuildTrendChart from '../components/BuildTrendChart'
import ScanResultsPanel from '../components/ScanResultsPanel'
import StatusBadge from '../components/StatusBadge'
import RepoOverview from '../components/RepoOverview'
import { formatDuration, shortSha, timeAgo } from '../lib/format'
import pipelineStatus from '../data/pipeline-status.json'

export default function Dashboard() {
  const { builds, aiReview, sonarqube, security, repoOverview, generatedAt } = pipelineStatus
  const [query, setQuery] = useState('')

  const latest = builds[0]
  const latestReview = aiReview.history[0]
  const successRate = Math.round(
    (builds.filter((b) => b.status === 'success').length / builds.length) * 100,
  )
  const avgDuration = Math.round(
    builds.reduce((sum, b) => sum + b.durationSeconds, 0) / builds.length,
  )

  const q = query.trim().toLowerCase()
  const filteredBuilds = q
    ? builds.filter(
        (b) => b.commitSha.toLowerCase().includes(q) || b.message?.toLowerCase().includes(q),
      )
    : builds

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={`Last updated ${timeAgo(generatedAt)}`}
        search={{ value: query, onChange: setQuery, placeholder: 'Search commits…' }}
      />

      <main className="flex-1 space-y-6 p-6">
        <RepoOverview repoOverview={repoOverview} generatedAt={generatedAt} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Latest build"
            value={latest.status === 'success' ? 'Passing' : 'Failing'}
            icon={CheckCircle2}
            tone={latest.status === 'success' ? 'positive' : 'negative'}
            trendLabel={shortSha(latest.commitSha)}
          />
          <StatCard
            label={`Success rate (${builds.length} runs)`}
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
              <span className="font-data">{shortSha(latestReview.pr)}</span>
              <span>{latestReview.findingsCount} findings</span>
            </div>
          </div>
        </div>

        <ScanResultsPanel security={security} sonarqube={sonarqube} />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Recent pipeline runs
          </h3>
          {filteredBuilds.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No commits match "{query}".</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBuilds.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <StatusBadge status={b.status} />
                    <span className="font-data text-xs text-slate-500 dark:text-slate-400">
                      {shortSha(b.commitSha)}
                    </span>
                    <span className="min-w-0 truncate text-slate-600 dark:text-slate-300">
                      {b.message ?? b.branch}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-xs text-slate-400">
                    <span className="font-data">{formatDuration(b.durationSeconds)}</span>
                    <span>{timeAgo(b.startedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  )
}
