import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App routing', () => {
  it('redirects the root path to the login screen', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('renders the dashboard at /dashboard', () => {
    renderAt('/dashboard')
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByText(/recent pipeline runs/i)).toBeInTheDocument()
  })

  it('renders the deployments table at /deployments', () => {
    renderAt('/deployments')
    expect(screen.getByText(/dev/i)).toBeInTheDocument()
    expect(screen.getByText(/prod/i)).toBeInTheDocument()
  })

  it('renders AI review history at /pull-requests', () => {
    renderAt('/pull-requests')
    expect(screen.getByRole('heading', { name: /pull requests/i })).toBeInTheDocument()
    expect(screen.getByText('#128')).toBeInTheDocument()
  })

  it('renders failure prediction and top causes at /ai-insights', () => {
    renderAt('/ai-insights')
    expect(screen.getByRole('heading', { name: /ai insights/i })).toBeInTheDocument()
    expect(screen.getByText(/top failure causes/i)).toBeInTheDocument()
  })

  it('renders scan results and SLOs at /security', () => {
    renderAt('/security')
    expect(screen.getByRole('heading', { name: /^security$/i })).toBeInTheDocument()
    expect(screen.getByText(/service-level objectives/i)).toBeInTheDocument()
  })

  it('falls back to the dashboard for unknown routes', () => {
    renderAt('/does-not-exist')
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })
})
