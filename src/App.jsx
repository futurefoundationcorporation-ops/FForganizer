import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { SharedPrompt } from './pages/SharedPrompt';
import { Admin } from './pages/Admin';

/**
 * Componente de nível superior que busca o estado de autenticação uma vez
 * e renderiza as rotas apropriadas com base nesse estado.
 */
function AppRoutes() {
  const { user, loading } = useAuth();

  // Exibe um indicador de carregamento enquanto o estado de autenticação é verificado.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Após o carregamento, define as rotas.
  return (
    <Routes>
      {/* Rota de Autenticação:
          - Se o usuário estiver logado, redireciona para o dashboard.
          - Se não, exibe a página de login. */}
      <Route
        path="/auth"
        element={user ? <Navigate to="/" /> : <Auth />}
      />

      {/* Rota de Compartilhamento Público */}
      <Route path="/share/:token" element={<SharedPrompt />} />

      {/* Rota Principal (Dashboard):
          - Requer que o usuário esteja logado. */}
      <Route
        path="/"
        element={user ? <Dashboard /> : <Navigate to="/auth" />}
      />

      {/* Rota de Administração:
          - Requer que o usuário esteja logado. */}
      <Route
        path="/admin"
        element={user ? <Admin /> : <Navigate to="/auth" />}
      />

      {/* Rota Curinga:
          - Redireciona qualquer caminho não correspondido para a rota principal. */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
