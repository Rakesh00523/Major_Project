import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, ShieldCheck, Rocket, LineChart, Eye, EyeOff, ArrowRight } from 'lucide-react'
import FloatingBackground from '../components/FloatingBackground'

const FEATURES = [
  { icon: GitBranch, text: 'AI-reviewed commits before they ever merge' },
  { icon: ShieldCheck, text: 'Trivy + Syft + Cosign on every image, automatically' },
  { icon: Rocket, text: 'Canary rollout with automatic rollback via ArgoCD + Argo Rollouts' },
  { icon: LineChart, text: 'Live build, security, and deployment telemetry' },
]

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0F19]">
      <FloatingBackground />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        {/* Brand / feature panel */}
        <div className="hidden flex-col justify-between p-12 lg:flex">
          <div className="flex items-center gap-3">
            <div className="icon-glow flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
              <GitBranch size={20} />
            </div>
            <span className="text-lg font-semibold text-white">Pipeline Dashboard</span>
          </div>

          <div className="max-w-md space-y-8">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                All systems operational
              </div>
              <h1 className="text-3xl font-semibold leading-tight text-white text-balance">
                One control center for your entire AI-augmented CI/CD pipeline.
              </h1>
            </div>

            <ul className="space-y-4">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="icon-glow mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
                    <Icon size={15} />
                  </div>
                  <span className="pt-1 text-sm text-slate-300">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="font-data text-xs text-slate-500">
            Built with open-source, zero-cost tooling end to end.
          </p>
        </div>

        {/* Sign-in card */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="icon-glow flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <GitBranch size={18} />
              </div>
              <span className="text-base font-semibold text-white">Pipeline Dashboard</span>
            </div>

            <h2 className="text-xl font-semibold text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-400">
              Sign in to view your pipeline&apos;s live status.
            </p>

            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  defaultValue="JohnDoe@gmail.com"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-indigo-500/50 placeholder:text-slate-500 focus:ring-2"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-sm text-white outline-none ring-indigo-500/50 placeholder:text-slate-500 focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:brightness-110 active:scale-[0.99]"
            >
              Sign in
              <ArrowRight size={15} />
            </button>

            <p className="mt-4 text-center text-xs text-slate-500">
              Demo only — any input signs you in, no real authentication is performed.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
