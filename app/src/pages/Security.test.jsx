import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Security from './Security'
import ScanResultsPanel from '../components/ScanResultsPanel'
import SloPanel from '../components/SloPanel'

import { AuthProvider } from '../lib/AuthContext'

const MOCK_USER = {
  id: 1,
  name: 'Security Tester',
  email: 'sec-tester@pipeline.local',
}

function renderSecurity() {
  return render(
    <MemoryRouter>
      <AuthProvider initialUser={MOCK_USER}>
        <Security />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Security Page Component', () => {
  it('renders topbar title and subtitle', () => {
    renderSecurity()
    expect(screen.getByRole('heading', { level: 1, name: /security/i })).toBeInTheDocument()
    expect(
      screen.getByText(/supply-chain security, secret scanning, and reliability objectives/i),
    ).toBeInTheDocument()
  })

  it('renders supply-chain security & code quality card', () => {
    renderSecurity()
    expect(screen.getByText(/supply-chain security & code quality/i)).toBeInTheDocument()
    expect(screen.getByText(/trivy vulnerability scan/i)).toBeInTheDocument()
    expect(screen.getByText(/^critical$/i)).toBeInTheDocument()
    expect(screen.getByText(/^high$/i)).toBeInTheDocument()
    expect(screen.getByText(/^medium$/i)).toBeInTheDocument()
    expect(screen.getByText(/^low$/i)).toBeInTheDocument()
    expect(screen.getByText(/sbom:/i)).toBeInTheDocument()
    expect(screen.getByText(/cosign signed/i)).toBeInTheDocument()
    expect(screen.getByText(/sonarqube: passed/i)).toBeInTheDocument()
  })

  it('renders secret scanning card with Gitleaks details', () => {
    renderSecurity()
    expect(screen.getByRole('heading', { level: 3, name: /secret scanning/i })).toBeInTheDocument()
    expect(screen.getByText(/no secrets detected/i)).toBeInTheDocument()
    expect(screen.getByText(/gitleaks/i)).toBeInTheDocument()
  })

  it('renders image provenance card with registry and signature', () => {
    renderSecurity()
    expect(screen.getByRole('heading', { level: 3, name: /image provenance/i })).toBeInTheDocument()
    expect(screen.getByText('Registry')).toBeInTheDocument()
    expect(screen.getByText('Signature')).toBeInTheDocument()
    expect(screen.getByText(/keyless via sigstore\/fulcio/i)).toBeInTheDocument()
    expect(screen.getByText(/deploy-time verification/i)).toBeInTheDocument()
  })

  it('renders service-level objectives (SLO) panel', () => {
    renderSecurity()
    expect(screen.getByRole('heading', { level: 3, name: /service-level objectives/i })).toBeInTheDocument()
    expect(screen.getByText(/error budget remaining: 78%/i)).toBeInTheDocument()
    expect(screen.getByText(/availability/i)).toBeInTheDocument()
    expect(screen.getByText(/http success rate/i)).toBeInTheDocument()
    expect(screen.getByText(/p95 latency/i)).toBeInTheDocument()
    expect(screen.getByText(/deployment success rate/i)).toBeInTheDocument()
  })

  it('renders non-zero vulnerabilities in ScanResultsPanel when findings exist', () => {
    const mockSecurity = {
      trivy: { critical: 2, high: 4, medium: 1, low: 0 },
      sbom: { packageCount: 50, format: 'SPDX JSON' },
      cosign: { signed: false },
    }
    const mockSonar = { qualityGate: 'Failed' }

    render(<ScanResultsPanel security={mockSecurity} sonarqube={mockSonar} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText(/unsigned/i)).toBeInTheDocument()
    expect(screen.getByText(/sonarqube: failed/i)).toBeInTheDocument()
  })

  it('renders SloPanel correctly with custom metrics', () => {
    const mockSlo = {
      errorBudgetRemainingPct: 45,
      availabilityPct: { current: 98.5, target: 99.0 },
      httpSuccessPct: { current: 99.1, target: 99.5 },
      p95LatencyMs: { current: 620, target: 500 },
      deploymentSuccessPct: { current: 92.0, target: 95.0 },
    }
    render(<SloPanel slo={mockSlo} />)
    expect(screen.getByText(/error budget remaining: 45%/i)).toBeInTheDocument()
    expect(screen.getByText('98.5%')).toBeInTheDocument()
    expect(screen.getByText('620ms')).toBeInTheDocument()
  })
})
