import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PipelineControl from './pages/PipelineControl'
import Deployments from './pages/Deployments'
import PullRequests from './pages/PullRequests'
import AiInsights from './pages/AiInsights'
import Security from './pages/Security'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pipeline-control" element={<PipelineControl />} />
        <Route path="/deployments" element={<Deployments />} />
        <Route path="/pull-requests" element={<PullRequests />} />
        <Route path="/ai-insights" element={<AiInsights />} />
        <Route path="/security" element={<Security />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
