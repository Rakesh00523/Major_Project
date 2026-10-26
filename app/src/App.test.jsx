import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

const MOCK_USER = { id: 1, name: 'Rakesh Engineer', email: 'rakesh@pipeline.local' }

function renderAt(path, user = MOCK_USER) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App initialUser={user} />
    </MemoryRouter>,
  )
}

describe('App routing & Authentication protection', () => {
  it('redirects the root path to the login screen for unauthenticated users', () => {
    renderAt('/', false)
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('renders the create account page at /register', () => {
    renderAt('/register', false)
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
  })

  it('redirects unauthenticated users trying to access /dashboard to /login', () => {
    renderAt('/dashboard', false)
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^dashboard$/i })).not.toBeInTheDocument()
  })

  it('renders the dashboard at /dashboard for authenticated users', () => {
    renderAt('/dashboard', MOCK_USER)
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByText(/recent pipeline runs/i)).toBeInTheDocument()
  })

  it('filters recent pipeline runs by the search box', () => {
    renderAt('/dashboard', MOCK_USER)
    const runsList = screen.getByText(/recent pipeline runs/i).closest('div')
    expect(within(runsList).getByText('7283185')).toBeInTheDocument()
    expect(within(runsList).getByText('012cf00')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/search commits/i), {
      target: { value: 'grafana' },
    })

    expect(within(runsList).getByText('e7350c7')).toBeInTheDocument()
    expect(within(runsList).queryByText('012cf00')).not.toBeInTheDocument()
  })

  it('renders the deployments table at /deployments', () => {
    renderAt('/deployments', MOCK_USER)
    expect(screen.getByText(/dev/i)).toBeInTheDocument()
    expect(screen.getByText(/prod/i)).toBeInTheDocument()
  })

  it('renders AI review history at /pull-requests', () => {
    renderAt('/pull-requests', MOCK_USER)
    expect(screen.getByRole('heading', { name: /code reviews/i })).toBeInTheDocument()
    expect(screen.getByText('32d32cc')).toBeInTheDocument()
  })

  it('renders failure prediction and top causes at /ai-insights', () => {
    renderAt('/ai-insights', MOCK_USER)
    expect(screen.getByRole('heading', { name: /ai insights/i })).toBeInTheDocument()
    expect(screen.getByText(/top failure causes/i)).toBeInTheDocument()
  })

  it('renders scan results and SLOs at /security', () => {
    renderAt('/security', MOCK_USER)
    expect(screen.getByRole('heading', { name: /^security$/i })).toBeInTheDocument()
    expect(screen.getByText(/service-level objectives/i)).toBeInTheDocument()
  })

  it('runs a demo scenario at /pipeline-control and reaches a blocked gate', () => {
    vi.useFakeTimers()
    renderAt('/pipeline-control', MOCK_USER)
    expect(screen.getByRole('heading', { name: /pipeline control/i })).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue(/successful deployment/i), {
      target: { value: 'security_failure' },
    })
    fireEvent.click(screen.getByRole('button', { name: /run scenario/i }))

    act(() => vi.advanceTimersByTime(20_000))

    expect(screen.getByText(/not safe to promote/i)).toBeInTheDocument()
    expect(screen.getByText(/critical: 1 finding/i)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('falls back to the dashboard for unknown routes when authenticated', () => {
    renderAt('/does-not-exist', MOCK_USER)
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })
})
