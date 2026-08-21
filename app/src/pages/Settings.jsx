import { useTheme } from '../lib/useTheme'
import Topbar from '../components/Topbar'

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onChange}
        role="switch"
        aria-checked={checked}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <Topbar title="Settings" subtitle="Preferences for this dashboard" />

      <main className="flex-1 space-y-6 p-6">
        <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Appearance</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <Toggle
              checked={theme === 'dark'}
              onChange={toggleTheme}
              label="Dark mode"
              description="Switch between light and dark theme"
            />
          </div>
        </div>

        <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
            Notifications
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <Toggle checked label="Failed build alerts" description="Notify on pipeline failure" onChange={() => {}} />
            <Toggle checked label="Security scan alerts" description="Notify on new critical/high CVEs" onChange={() => {}} />
            <Toggle label="Weekly summary email" description="Digest of build/deploy activity" onChange={() => {}} />
          </div>
        </div>

        <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Account</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">siri@amotion.ai</p>
        </div>
      </main>
    </>
  )
}
