import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';

// Inicializa o Sentry
Sentry.init({
  dsn: 'https://fafb7f73d005a03fbd9bb3aea4900241@o4510401385660416.ingest.us.sentry.io/4510401401651200',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

function Fallback({ error }) {
  // O Sentry já capturou o erro automaticamente com a integração do React.
  // Podemos adicionar mais contexto se quisermos.
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
    <Sentry.ErrorBoundary fallback={<Fallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
