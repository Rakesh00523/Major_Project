import { useState } from 'react'
import { useTheme } from '../lib/useTheme'
import Topbar from '../components/Topbar'
import Toggle from '../components/Toggle'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState({
    failedBuilds: true,
    securityAlerts: true,
    weeklySummary: false,
  })

  function setNotification(key) {
    return (value) => setNotifications((prev) => ({ ...prev, [key]: value }))
  }

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
            <Toggle
              checked={notifications.failedBuilds}
              onChange={setNotification('failedBuilds')}
              label="Failed build alerts"
              description="Notify on pipeline failure"
            />
            <Toggle
              checked={notifications.securityAlerts}
              onChange={setNotification('securityAlerts')}
              label="Security scan alerts"
              description="Notify on new critical/high CVEs"
            />
            <Toggle
              checked={notifications.weeklySummary}
              onChange={setNotification('weeklySummary')}
              label="Weekly summary email"
              description="Digest of build/deploy activity"
            />
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
