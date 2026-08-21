import Topbar from '../components/Topbar'
import FailurePredictionChart from '../components/FailurePredictionChart'
import FailureSimulator from '../components/FailureSimulator'
import pipelineStatus from '../data/pipeline-status.json'

export default function AiInsights() {
  const { aiInsights, aiReview } = pipelineStatus
  const avgRisk = Math.round(
    aiReview.history.reduce((sum, h) => sum + h.riskScore, 0) / aiReview.history.length,
  )

  return (
    <>
      <Topbar
        title="AI Insights"
        subtitle={`Pipeline intelligence over the last ${aiInsights.windowDays} days`}
      />

      <main className="flex-1 space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
              Pipeline failure prediction
            </h3>
            <FailurePredictionChart prediction={aiInsights.failurePrediction} />
            <p className="mt-2 text-center text-xs text-slate-400">
              Avg. PR risk score: {avgRisk}/100
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              Top failure causes
            </h3>
            <ul className="space-y-3">
              {aiInsights.topFailureCauses.map((c, i) => (
                <li key={c.cause}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">
                      {i + 1}. {c.cause}
                    </span>
                    <span className="font-medium text-slate-400">{c.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <FailureSimulator />

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
          The current risk score is a weighted heuristic (change size + test-failure
          history + security findings + code-quality signals). See{' '}
          <code>docs/ARCHITECTURE.md</code> for the formula and the path to swapping it
          for a trained classifier once enough labeled deploy outcomes exist.
        </div>
      </main>
    </>
  )
}
