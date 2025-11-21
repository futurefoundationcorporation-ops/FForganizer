import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// Create a client
const queryClient = new QueryClient();

function Fallback({ error }) {
  console.error(error);
  return (
    <div role="alert" style={{ color: 'white', padding: '20px' }}>
      <h2>Algo deu terrivelmente errado.</h2>
      <p>Nossa equipe de engenharia já foi notificada e está trabalhando para corrigir o problema.</p>
      <button onClick={() => window.location.reload()}>Recarregar a Página</button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary FallbackComponent={Fallback}>
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
);
