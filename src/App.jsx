import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ChatPage from './pages/ChatPage'
import AdminDashboard from './pages/AdminDashboard'
import StudentDashboard from './pages/StudentDashboard'
import LoginPage from './pages/LoginPage'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient()

function ProtectedRoute({ children }) {
  // Allow access to chat without authentication
  return children
}

function StudentRoute({ children }) {
  const { user, isAuthenticated } = useAuthStore()
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
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
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App

