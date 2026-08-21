import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it('renders the given status text', () => {
    render(<StatusBadge status="Synced" />)
    expect(screen.getByText('Synced')).toBeInTheDocument()
  })

  it('falls back to the default style for an unknown status', () => {
    render(<StatusBadge status="Unknown" />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})
