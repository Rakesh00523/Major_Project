import { useNavigate } from 'react-router-dom'
import { GitBranch, ShieldCheck, Rocket, LineChart } from 'lucide-react'

const FEATURES = [
  { icon: GitBranch, text: 'AI-reviewed pull requests before they ever merge' },
  { icon: ShieldCheck, text: 'Trivy + Syft + Cosign on every image, automatically' },
  { icon: Rocket, text: 'GitOps delivery to Kubernetes via ArgoCD' },
  { icon: LineChart, text: 'Live build, security, and deployment telemetry' },
]

export default function Login() {
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-50 dark:bg-slate-950 lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <GitBranch size={20} />
          </div>
          <span className="text-lg font-semibold">Pipeline Dashboard</span>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold leading-tight">
            One pane of glass for your entire AI-augmented CI/CD pipeline.
          </h2>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-indigo-100">
                <Icon size={18} className="mt-0.5 shrink-0" />
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-indigo-200/70">
          Built with open-source, zero-cost tooling end to end.
        </p>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Sign in to view your pipeline&apos;s live status.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              defaultValue="siri@amotion.ai"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500/40 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500/40 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Sign in
          </button>

          <p className="text-center text-xs text-slate-400">
            Demo only — no real authentication is performed.
          </p>
        </form>
      </div>
    </div>
  )
}
