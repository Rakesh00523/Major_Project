import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MobileNav from './MobileNav'

describe('MobileNav', () => {
  it('opens the drawer and shows all nav links when the menu button is clicked', () => {
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Pull Requests')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /open navigation/i }))

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Deployments')).toBeInTheDocument()
    expect(screen.getByText('Pull Requests')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('closes the drawer when the close button is clicked', () => {
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /open navigation/i }))
    expect(screen.getByText('Dashboard')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /close navigation/i }))
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })
})
