import { useState } from 'react'
import { Rocket, FlaskConical, RotateCcw } from 'lucide-react'
import Topbar from '../components/Topbar'
import PipelineRunTimeline from '../components/PipelineRunTimeline'
import ReleaseReadinessGate from '../components/ReleaseReadinessGate'
import DeploymentStory from '../components/DeploymentStory'
import { useScenarioRunner } from '../lib/useScenarioRunner'
import { SCENARIOS } from '../data/scenarios'

const SCENARIO_OPTIONS = Object.entries(SCENARIOS).map(([key, s]) => ({ key, label: s.label }))

export default function PipelineControl() {
  const [scenarioKey, setScenarioKey] = useState('successful_deployment')
  const runner = useScenarioRunner()
  const scenario = SCENARIOS[scenarioKey]

  const isRunning = runner.status === 'running'
  const isDone = runner.status === 'done'
  const blocked = isDone && (runner.outcome === 'blocked' || runner.outcome === 'rolled_back')

  return (
    <>
      <Topbar
        title="Pipeline Control"
        subtitle="Run the real stage sequence and demo scenarios — clearly-labeled simulation, not a live cluster action"
      />

      <main className="flex-1 space-y-6 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Run the pipeline
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Repository
              </label>
              <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                pipeline-dashboard
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Branch
              </label>
              <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                main
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Environment
              </label>
              <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                dev (pipeline-dev)
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isRunning}
            onClick={() => {
              setScenarioKey('successful_deployment')
              runner.run(SCENARIOS.successful_deployment)
            }}
            className="mt-4 flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-transform hover:brightness-110 disabled:opacity-50"
          >
            <Rocket size={16} />
            Run pipeline
          </button>
        </div>

        <div className="rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/40 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/5">
          <div className="mb-1 flex items-center gap-2">
            <FlaskConical size={16} className="text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Demo lab</h3>
          </div>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            {scenario.description}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={scenarioKey}
              onChange={(e) => setScenarioKey(e.target.value)}
              disabled={isRunning}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-indigo-500/40 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {SCENARIO_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => runner.run(scenario)}
              className="flex items-center gap-2 rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-500/40 dark:bg-slate-900 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
            >
              <FlaskConical size={15} />
              Run scenario
            </button>
            {isDone && (
              <button
                type="button"
                onClick={runner.reset}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
        </div>

        {runner.steps.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                {isRunning ? 'Running…' : 'Run complete'}
              </h3>
              <PipelineRunTimeline
                steps={runner.steps}
                currentIndex={runner.currentIndex}
                status={runner.status}
              />
            </div>

            {isDone && (
              <ReleaseReadinessGate
                readiness={scenario.readiness}
                blocked={blocked}
                blockedReason={scenario.blockedReason}
                blockedActions={scenario.blockedActions}
              />
            )}
          </div>
        )}

        {isDone && scenarioKey === 'successful_deployment' && <DeploymentStory />}
      </main>
    </>
  )
}
