# Supply-chain security

Four tools cover secrets and the software supply chain end to end, all
open-source and free to run.

## Gitleaks — secret scanning

Runs first, before anything else, on every pull request. A leaked API key,
password, or private key blocks the merge — the same severity as a
CRITICAL vulnerability. No license or account needed; the free scan covers
the standard rule set.

Run it locally against your working tree:

```bash
gitleaks detect --source . --verbose
```

## Trivy — vulnerability scanning

Scans the built container image for known CVEs in OS packages and app
dependencies. Runs in `cd.yml` right after the image is built and fails the
pipeline on any `CRITICAL` or `HIGH` finding. Results are also uploaded to
GitHub's code-scanning tab (free, built into every repo) so findings show up
alongside normal code review.

Run it locally against the image you just built:

```bash
trivy image --severity CRITICAL,HIGH pipeline-dashboard:local
```

If this turns up findings, the fix that actually worked here was running
`apk update && apk upgrade --no-cache` in the Dockerfile before installing
anything else — that pulls the latest Alpine security patches at build
time instead of trusting whatever the base image tag happened to ship
with. Bumping the base image tag alone was not sufficient; the CVEs
disclosed after that tag was published were still present until the
`apk upgrade` step was added.

## Syft — SBOM generation

Produces a Software Bill of Materials (SPDX 2.3 JSON) listing every package
that went into the final image. This is what lets you answer "are we
affected by CVE-XXXX-YYYY" without re-scanning from scratch — you just grep
the SBOM.

```bash
syft pipeline-dashboard:local -o spdx-json > sbom.spdx.json
```

## Cosign — keyless image signing

Signs the pushed image using **Sigstore's keyless flow**: GitHub Actions'
OIDC token vouches for the workflow's identity to Sigstore's Fulcio CA, which
issues a short-lived certificate used to sign the image. The signature and
certificate are recorded in the public Rekor transparency log. No private
key ever has to be generated, stored, or rotated.

Verify a signed image (works for anyone, no shared secret required):

```bash
cosign verify \
  --certificate-identity-regexp "https://github.com/your-org/ai-cicd-pipeline/.github/workflows/cd.yml@.*" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/your-org/pipeline-dashboard:<tag>
```

The SBOM is also attached to the image as a signed **attestation**
(`cosign attest --type spdxjson`), so the SBOM itself is tamper-evident too.
Both the signature and the attestation were validated locally end-to-end
against a throwaway key pair and a local registry container before this was
wired into `cd.yml` — see the commit history for the exact commands.

### Admission-time verification (designed, not deployed here)

The natural next step is to make the cluster itself refuse to run an image
that isn't signed by this pipeline, rather than trusting that CI always ran.
In a real deployment this means an admission controller — **Kyverno** or
**OPA Gatekeeper** — with a policy roughly like:

```yaml
# Kyverno ClusterPolicy sketch, not applied in this local demo
verifyImages:
  - imageReferences: ["ghcr.io/your-org/pipeline-dashboard:*"]
    attestors:
      - keyless:
          issuer: https://token.actions.githubusercontent.com
          subject: "https://github.com/your-org/ai-cicd-pipeline/.github/workflows/cd.yml@*"
```

This wasn't installed in the local Minikube cluster used for this project —
it's a real chunk of additional infrastructure, and the priority for the
constrained local environment was getting Argo Rollouts + Prometheus-gated
rollback genuinely running instead.

## Why the CI/CD order matters

Gitleaks → lint/test → AI review → Sonar → build, then (on merge) Docker
build → Trivy → Syft → push → Cosign sign/attest → GitOps bump. Scanning
happens *before* the image is pushed anywhere, and signing happens *after*
it's pushed, so the signature covers the exact digest that ends up in the
registry — and a secret leak or CRITICAL CVE never even reaches that far.
