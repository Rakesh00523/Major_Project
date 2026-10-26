import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { GitBranch, UserPlus, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import FloatingBackground from '../components/FloatingBackground'
import { useAuth } from '../lib/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register, isAuthenticated, loading: authLoading } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  function validate() {
    const errors = {}
    if (!name.trim()) {
      errors.name = 'Full name is required'
    }

    if (!email.trim()) {
      errors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setSuccessMessage('')

    if (!validate()) return
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      })
      setSuccessMessage('Account created successfully! Redirecting to dashboard…')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please check your information.')
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

          <div className="max-w-md space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300">
              <UserPlus size={14} />
              New User Registration
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-white text-balance">
              Join your DevOps team and access real-time pipeline telemetry.
            </h1>
            <p className="text-sm text-slate-300">
              Create an account with persistent backend authentication. Your credentials are protected
              using salted bcrypt hashing with strict server-side validation.
            </p>
          </div>

          <p className="font-data text-xs text-slate-500">
            Self-contained &bull; Zero external data tracking &bull; Complete privacy
          </p>
        </div>

        {/* Register form card */}
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

            <h2 className="text-xl font-semibold text-white">Create an account</h2>
            <p className="mt-1 text-sm text-slate-400">
              Register to access pipeline controls and deployment telemetry.
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

            {successMessage && (
              <div
                role="status"
                className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300"
              >
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="mt-6 space-y-3.5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300" htmlFor="name">
                  Full name <span className="text-red-400">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (validationErrors.name) setValidationErrors((prev) => ({ ...prev, name: null }))
                  }}
                  placeholder="John Doe"
                  disabled={isSubmitting}
                  className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white outline-none ring-indigo-500/50 placeholder:text-slate-500 focus:ring-2 ${
                    validationErrors.name ? 'border-red-500/50' : 'border-white/10'
                  }`}
                />
                {validationErrors.name && (
                  <p className="text-xs text-red-400">{validationErrors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300" htmlFor="register-email">
                  Email address <span className="text-red-400">*</span>
                </label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: null }))
                  }}
                  placeholder="user@example.com"
                  disabled={isSubmitting}
                  className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white outline-none ring-indigo-500/50 placeholder:text-slate-500 focus:ring-2 ${
                    validationErrors.email ? 'border-red-500/50' : 'border-white/10'
                  }`}
                />
                {validationErrors.email && (
                  <p className="text-xs text-red-400">{validationErrors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300" htmlFor="register-password">
                  Password <span className="text-red-400">*</span> (min. 8 characters)
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (validationErrors.password) setValidationErrors((prev) => ({ ...prev, password: null }))
                    }}
                    placeholder="xxxxxxxx"
                    disabled={isSubmitting}
                    className={`w-full rounded-lg border bg-white/5 px-3 py-2 pr-10 text-sm text-white outline-none ring-indigo-500/50 placeholder:text-slate-500 focus:ring-2 ${
                      validationErrors.password ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-xs text-red-400">{validationErrors.password}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300" htmlFor="confirmPassword">
                  Confirm password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (validationErrors.confirmPassword) {
                        setValidationErrors((prev) => ({ ...prev, confirmPassword: null }))
                      }
                    }}
                    placeholder="xxxxxxxx"
                    disabled={isSubmitting}
                    className={`w-full rounded-lg border bg-white/5 px-3 py-2 pr-10 text-sm text-white outline-none ring-indigo-500/50 placeholder:text-slate-500 focus:ring-2 ${
                      validationErrors.confirmPassword ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-xs text-red-400">{validationErrors.confirmPassword}</p>
                )}
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
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <div className="mt-6 border-t border-white/10 pt-4 text-center">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
