import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'
import Register from './Register'
import { AuthProvider } from '../lib/AuthContext'

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider initialUser={false}>
        <Login />
      </AuthProvider>
    </MemoryRouter>,
  )
}

function renderRegister() {
  return render(
    <MemoryRouter>
      <AuthProvider initialUser={false}>
        <Register />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Login Page Component', () => {
  it('renders all required form elements and placeholders', () => {
    renderLogin()
    expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password \*/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('xxxxxxxx')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create an account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/remember me for 30 days/i)).toBeInTheDocument()
  })

  it('masks the password by default and toggles visibility on click', () => {
    renderLogin()
    const passwordInput = screen.getByPlaceholderText('xxxxxxxx')
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleBtn = screen.getByLabelText(/show password/i)
    fireEvent.click(toggleBtn)
    expect(passwordInput).toHaveAttribute('type', 'text')

    fireEvent.click(screen.getByLabelText(/hide password/i))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('displays inline validation errors when submitting empty fields', () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
  })
})

describe('Register Page Component', () => {
  it('renders all required registration fields', () => {
    renderRegister()
    expect(screen.getByLabelText(/full name \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password \* \(min\. 8 characters\)/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password \*/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })

  it('validates password length and confirmation match', () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText(/full name \*/i), { target: { value: 'Alice Engineer' } })
    fireEvent.change(screen.getByLabelText(/email address \*/i), { target: { value: 'alice@pipeline.local' } })
    fireEvent.change(screen.getByLabelText(/password \* \(min\. 8 characters\)/i), { target: { value: 'short' } })
    fireEvent.change(screen.getByLabelText(/confirm password \*/i), { target: { value: 'different' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument()
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
  })
})
