import { NavLink } from 'react-router-dom'
import {
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

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex md:flex-col">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <GitBranch size={18} />
        </div>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          Pipeline Dashboard
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
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

      <div className="border-t border-slate-200 p-4 text-xs text-slate-400 dark:border-slate-800">
        AI-Augmented CI/CD Pipeline
      </div>
    </aside>
  )
}
