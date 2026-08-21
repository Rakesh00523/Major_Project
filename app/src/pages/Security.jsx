import { KeyRound, ShieldCheck, ShieldAlert } from 'lucide-react'
import Topbar from '../components/Topbar'
import ScanResultsPanel from '../components/ScanResultsPanel'
import SloPanel from '../components/SloPanel'
import pipelineStatus from '../data/pipeline-status.json'

export default function Security() {
  const { security, sonarqube, secretScanning, slo, pipeline } = pipelineStatus
  const isClean = secretScanning.secretsFound === 0

  return (
    <>
      <Topbar
        title="Security"
        subtitle="Supply-chain security, secret scanning, and reliability objectives"
      />

      <main className="flex-1 space-y-6 p-6">
        <ScanResultsPanel security={security} sonarqube={sonarqube} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              Secret scanning
            </h3>
            <div className="flex items-center gap-3">
              {isClean ? (
                <ShieldCheck size={28} className="text-emerald-500" />
              ) : (
                <ShieldAlert size={28} className="text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {isClean ? 'No secrets detected' : `${secretScanning.secretsFound} secret(s) found`}
                </p>
                <p className="text-xs text-slate-400">
                  {secretScanning.tool} · scanned every pull request
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <KeyRound size={14} />A leaked credential blocks the merge — same gate as a
              CRITICAL vulnerability.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
              Image provenance
            </h3>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Registry</dt>
                <dd className="mt-1 font-mono text-slate-700 dark:text-slate-300">
                  {pipeline.registry}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Signature</dt>
                <dd className="mt-1 text-slate-700 dark:text-slate-300">
                  Keyless via Sigstore/Fulcio, issuer {security.cosign.issuer}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Deploy-time verification
                </dt>
                <dd className="mt-1 text-slate-700 dark:text-slate-300">
                  Unsigned images are rejected before ArgoCD syncs them — see{' '}
                  <code className="text-xs">docs/SECURITY.md</code>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <SloPanel slo={slo} />
      </main>
    </>
  )
}
