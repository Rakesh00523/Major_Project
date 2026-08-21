import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Menu,
  X,
  LayoutDashboard,
  Rocket,
  Settings,
  GitBranch,
  GitPullRequest,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/deployments', label: 'Deployments', icon: Rocket },
  { to: '/pull-requests', label: 'Code Reviews', icon: GitPullRequest },
  { to: '/ai-insights', label: 'AI Insights', icon: Sparkles },
  { to: '/security', label: 'Security', icon: ShieldCheck },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-64 flex-col bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <GitBranch size={18} />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Pipeline Dashboard
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-3">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                    )
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
