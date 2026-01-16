import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ChatPage from './pages/ChatPage'
import AdminRouter from './pages/admin/AdminRouter'
import StudentDashboard from './pages/StudentDashboard'
import PartnerDashboard from './pages/PartnerDashboard'
import LoginPage from './pages/LoginPage'
import OpsDashboard from './pages/OpsDashboard'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient()

function ProtectedRoute({ children }) {
  // Allow access to chat without authentication
  return children
}

function StudentRoute({ children }) {
  const { user, isAuthenticated } = useAuthStore()
  const location = useLocation()
  
  // Check for admin/partner view mode in URL params
  const params = new URLSearchParams(location.search)
  const adminView = params.get('admin_view') === 'true'
  const partnerView = params.get('partner_view') === 'true'
  const studentId = params.get('student_id')
  
  // Allow admin access if admin_view=true and student_id is provided
  if (adminView && studentId) {
    if (isAuthenticated && user?.role === 'admin') {
      return children
    } else {
      // Admin must be logged in to view student dashboard
      return <Navigate to="/login" replace />
    }
  }
  
  // Allow partner access if partner_view=true and student_id is provided
  if (partnerView && studentId) {
    if (isAuthenticated && user?.role === 'partner') {
      return children
    } else {
      // Partner must be logged in to view student dashboard
      return <Navigate to="/login" replace />
    }
  }
  
  // Normal student access
  if (!isAuthenticated || user?.role !== 'student') {
    return <Navigate to="/login" replace />
  }
  return children
}

function AdminRoute({ children }) {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return children
}

function PartnerRoute({ children }) {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated || user?.role !== 'partner') {
    return <Navigate to="/login" replace />
  }
  return children
}

function OpsRoute({ children }) {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated || user?.role !== 'ops') {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/login"
            element={<LoginPage />}
          />
          <Route
            path="/dashboard"
            element={
              <StudentRoute>
                <StudentDashboard />
              </StudentRoute>
            }
          />
          <Route
            path="/"
            element={<ChatPage />}
          />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminRouter />
              </AdminRoute>
            }
          />
          <Route
            path="/partner"
            element={
              <PartnerRoute>
                <PartnerDashboard />
              </PartnerRoute>
            }
          />
          <Route
            path="/ops"
            element={
              <OpsRoute>
                <OpsDashboard />
              </OpsRoute>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App

