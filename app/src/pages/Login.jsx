import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { GitBranch, ShieldCheck, Rocket, LineChart, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import FloatingBackground from '../components/FloatingBackground'
import { useAuth } from '../lib/AuthContext'

const FEATURES = [
  { icon: GitBranch, text: 'AI-reviewed commits before they ever merge' },
  { icon: ShieldCheck, text: 'Trivy + Syft + Cosign on every image, automatically' },
  { icon: Rocket, text: 'Canary rollout with automatic rollback via ArgoCD + Argo Rollouts' },
  { icon: LineChart, text: 'Live build, security, and deployment telemetry' },
]

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated, loading: authLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [forgotModalOpen, setForgotModalOpen] = useState(false)

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  function validate() {
    const errors = {}
    if (!email.trim()) {
      errors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address'
    }

    if (!password) {
      errors.password = 'Password is required'
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!validate()) return
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await login(email.trim(), password, rememberMe)
      navigate('/dashboard')
    } catch (err) {
      setFormError(err.message || 'Invalid email or password.')
    } finally {
      setIsSubmitting(false)
    }
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
            Enterprise Grade Security &bull; Argon2id / bcrypt Password Hashing &bull; Real Auth Backend
          </p>
        </div>

        {/* Sign-in card */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <form
            onSubmit={handleSubmit}
            noValidate
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
              Sign in with your registered account to access your live pipeline.
            </p>

            {formError && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"
              >
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-sm font-medium text-slate-300" htmlFor="email">
                  <span>
                    Email <span className="text-red-400">*</span>
                  </span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: null }))
                  }}
                  placeholder="user@example.com"
                  disabled={isSubmitting}
                  className={`w-full rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-indigo-500/50 placeholder:text-slate-500 focus:ring-2 ${
                    validationErrors.email ? 'border-red-500/50' : 'border-white/10'
                  }`}
                />
                {validationErrors.email && (
                  <p className="text-xs text-red-400">{validationErrors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300" htmlFor="password">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (validationErrors.password) setValidationErrors((prev) => ({ ...prev, password: null }))
                    }}
                    placeholder="xxxxxxxx"
                    disabled={isSubmitting}
                    className={`w-full rounded-lg border bg-white/5 px-3 py-2.5 pr-10 text-sm text-white outline-none ring-indigo-500/50 placeholder:text-slate-500 focus:ring-2 ${
                      validationErrors.password ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-xs text-red-400">{validationErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <span>Remember me for 30 days</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <div className="mt-6 border-t border-white/10 pt-4 text-center">
              <p className="text-xs text-slate-400">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Password Reset</h3>
            <p className="mt-2 text-xs text-slate-400">
              Password reset via self-service email token delivery is currently marked as not yet configured in this deployment environment.
              Please contact your pipeline administrator or register a new account.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
