import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'
import { SharedPrompt } from './pages/SharedPrompt'
import { Admin } from './pages/Admin'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return user ? children : <Navigate to="/auth" />
}

function AuthRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  return user ? <Navigate to="/" /> : <Auth />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthRoute />} />
        <Route path="/share/:token" element={<SharedPrompt />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
