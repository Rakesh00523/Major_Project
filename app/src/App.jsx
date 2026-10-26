import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import PipelineControl from './pages/PipelineControl'
import Deployments from './pages/Deployments'
import PullRequests from './pages/PullRequests'
import AiInsights from './pages/AiInsights'
import Security from './pages/Security'
import Settings from './pages/Settings'

function App({ initialUser }) {
  return (
    <AuthProvider initialUser={initialUser}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-account" element={<Navigate to="/register" replace />} />

        {/* Protected Dashboard Views */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pipeline-control" element={<PipelineControl />} />
            <Route path="/deployments" element={<Deployments />} />
            <Route path="/pull-requests" element={<PullRequests />} />
            <Route path="/ai-insights" element={<AiInsights />} />
            <Route path="/security" element={<Security />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
