import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Rocket,
  Settings,
  GitBranch,
  GitPullRequest,
  Sparkles,
  ShieldCheck,
  PlayCircle,
  LogOut,
  User,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../lib/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pipeline-control', label: 'Pipeline Control', icon: PlayCircle },
  { to: '/deployments', label: 'Deployments', icon: Rocket },
  { to: '/pull-requests', label: 'Code Reviews', icon: GitPullRequest },
  { to: '/ai-insights', label: 'AI Insights', icon: Sparkles },
  { to: '/security', label: 'Security', icon: ShieldCheck },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex md:flex-col">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
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
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User profile & Logout */}
      <div className="border-t border-slate-200 p-3.5 dark:border-slate-800">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
            </div>
            <div className="truncate">
              <p className="truncate text-xs font-medium text-slate-900 dark:text-white">
                {user?.name || 'Authorized User'}
              </p>
              <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                {user?.email || 'admin@pipeline.local'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
