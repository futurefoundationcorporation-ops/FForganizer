import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { Auth } from './pages/Auth';

// FIX: Correctly handle named exports for lazy loading
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const SharedPrompt = lazy(() => import('./pages/SharedPrompt').then(module => ({ default: module.SharedPrompt })));
const Admin = lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/" /> : <Auth />}
      />
      <Route 
        path="/share/:token" 
        element={<SharedPrompt />} 
      />
      <Route
        path="/"
        element={user ? <Dashboard /> : <Navigate to="/auth" />}
      />
      <Route
        path="/admin"
        element={user ? <Admin /> : <Navigate to="/auth" />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
