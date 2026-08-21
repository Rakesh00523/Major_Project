import Topbar from '../components/Topbar'
import DeploymentTable from '../components/DeploymentTable'
import DoraMetrics from '../components/DoraMetrics'
import pipelineStatus from '../data/pipeline-status.json'

export default function Deployments() {
  const { environments, dora } = pipelineStatus

  return (
    <>
      <Topbar
        title="Deployments"
        subtitle="GitOps sync status per environment, managed by ArgoCD + Argo Rollouts"
      />

      <main className="flex-1 space-y-6 p-6">
        <DeploymentTable environments={environments} />
        <DoraMetrics dora={dora} />
      </main>
    </>
  )
}
