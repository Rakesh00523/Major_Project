import { Sparkles } from 'lucide-react'
import Topbar from '../components/Topbar'
import { timeAgo } from '../lib/format'
import pipelineStatus from '../data/pipeline-status.json'

const VERDICT_STYLES = {
  clean: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  advisory: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
}

export default function PullRequests() {
  const { history, provider, model } = pipelineStatus.aiReview

  return (
    <>
      <Topbar
        title="Pull Requests"
        subtitle={`AI review history via ${provider} (${model})`}
      />

      <main className="flex-1 space-y-4 p-6">
        {history.map((entry) => (
          <div
            key={entry.pr}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {entry.pr}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${VERDICT_STYLES[entry.verdict]}`}
                  >
                    {entry.verdict}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{entry.title}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                <Sparkles size={14} />
                {entry.findingsCount} findings
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{entry.summary}</p>

            <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
              <span>{entry.author}</span>
              <span>·</span>
              <span>{timeAgo(entry.reviewedAt)}</span>
            </div>
          </div>
        ))}
      </main>
    </>
  )
}
