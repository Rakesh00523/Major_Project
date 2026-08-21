# Supply-chain security

Three tools cover the software supply chain end to end, all open-source and
free to run:

## Trivy — vulnerability scanning

Scans the built container image for known CVEs in OS packages and app
dependencies. Runs in `cd.yml` right after the image is built and fails the
pipeline on any `CRITICAL` or `HIGH` finding. Results are also uploaded to
GitHub's code-scanning tab (free, built into every repo) so findings show up
alongside normal code review.

Run it locally against the image you just built:

```bash
trivy image pipeline-dashboard:local
```

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

## Why this order matters

Scan → SBOM → push → sign is deliberate: the image is fully vetted *before*
it's pushed anywhere, and it's only signed *after* it's pushed, so the
signature covers the exact digest that ends up in the registry.
