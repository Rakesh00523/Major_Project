import Topbar from '../components/Topbar'
import DeploymentTable from '../components/DeploymentTable'
import pipelineStatus from '../data/pipeline-status.json'

export default function Deployments() {
  const { environments, security } = pipelineStatus

  return (
    <>
      <Topbar
        title="Deployments"
        subtitle="GitOps sync status per environment, managed by ArgoCD"
      />

      <main className="flex-1 space-y-6 p-6">
        <DeploymentTable environments={environments} />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            Image provenance
          </h3>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Registry</dt>
              <dd className="mt-1 font-mono text-slate-700 dark:text-slate-300">
                {pipelineStatus.pipeline.registry}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Signature</dt>
              <dd className="mt-1 text-slate-700 dark:text-slate-300">
                Keyless via Sigstore/Fulcio, issuer {security.cosign.issuer}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">SBOM format</dt>
              <dd className="mt-1 text-slate-700 dark:text-slate-300">{security.sbom.format}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Last scan</dt>
              <dd className="mt-1 text-slate-700 dark:text-slate-300">
                {security.trivy.high} high, {security.trivy.medium} medium, {security.trivy.low} low
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </>
  )
}
