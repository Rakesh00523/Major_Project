import { ShieldCheck, FileJson, Signature } from 'lucide-react'
import SeverityBarChart from './SeverityBarChart'

function Severity({ label, count, tone }) {
  const tones = {
    critical: 'text-red-600 dark:text-red-400',
    high: 'text-orange-600 dark:text-orange-400',
    medium: 'text-amber-600 dark:text-amber-400',
    low: 'text-slate-500 dark:text-slate-400',
  }
  return (
    <div className="flex flex-col items-center rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
      <span className={`text-lg font-semibold ${tones[tone]}`}>{count}</span>
      <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
    </div>
  )
}

export default function ScanResultsPanel({ security, sonarqube }) {
  const { trivy, sbom, cosign } = security

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
        Supply-chain security &amp; code quality
      </h3>

      <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        Trivy vulnerability scan
      </p>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-4 gap-2">
          <Severity label="Critical" count={trivy.critical} tone="critical" />
          <Severity label="High" count={trivy.high} tone="high" />
          <Severity label="Medium" count={trivy.medium} tone="medium" />
          <Severity label="Low" count={trivy.low} tone="low" />
        </div>
        <SeverityBarChart trivy={trivy} />
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-3">
        <div className="flex items-center gap-2 text-sm">
          <FileJson size={16} className="text-indigo-500" />
          <span className="text-slate-600 dark:text-slate-300">
            SBOM: {sbom.packageCount} pkgs ({sbom.format})
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Signature size={16} className="text-indigo-500" />
          <span className="text-slate-600 dark:text-slate-300">
            {cosign.signed ? 'Cosign signed (keyless)' : 'Unsigned'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck size={16} className="text-indigo-500" />
          <span className="text-slate-600 dark:text-slate-300">
            SonarQube: {sonarqube.qualityGate}
          </span>
        </div>
      </div>
    </div>
  )
}
