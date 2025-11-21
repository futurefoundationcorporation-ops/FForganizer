import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import admin from 'npm:firebase-admin@12.0.0'; // Importação default para melhor compatibilidade com CJS
import * as Sentry from 'https://deno.land/x/sentry/index.mjs';

Sentry.init({ dsn: 'https://c0aa56b1fe695afef78afa9214c6f26f@o4510401385660416.ingest.us.sentry.io/4510401409384448' });

// --- INICIALIZAÇÃO SINGLETON IMEDIATA ---
let db: admin.firestore.Firestore;
let initializationError: Error | null = null;

try {
  const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY não configurada.');
  }
  
  const serviceAccount = JSON.parse(serviceAccountKey);

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  db = admin.firestore();
} catch (e) {
  initializationError = e;
  console.error("ERRO CRÍTICO NA INICIALIZAÇÃO DO FIREBASE ADMIN:", e);
  Sentry.captureException(e, { level: 'fatal' });
}
// -----------------------------------------

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Se a inicialização falhou no cold start, rejeita todas as requisições.
  if (initializationError || !db) {
    return new Response(
      JSON.stringify({ error: 'Erro crítico na configuração do servidor.', details: initializationError?.message || "Instância do DB não disponível." }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  try {
    const foldersRef = db.collection('folders');
    const query = foldersRef.orderBy('created_at', 'desc').limit(10).get();
    
    // AbortSignal para timeout de 2 segundos.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    // Infelizmente, o SDK Admin do Firebase não suporta AbortSignal diretamente na query.
    // O timeout via Promise.race é a melhor alternativa.
    const snapshot = await Promise.race([
        query,
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 2000))
    ]);
    clearTimeout(timeoutId);

    const foldersData = (snapshot as admin.firestore.QuerySnapshot).docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const responseBody = JSON.stringify(foldersData);

    return new Response(responseBody, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na Edge Function fetch-folders:', error);
    Sentry.captureException(error);

    const status = error.message === 'TIMEOUT' ? 504 : 500;
    const message = error.message === 'TIMEOUT' ? 'A requisição demorou muito.' : 'Erro interno do servidor.';

    return new Response(
      JSON.stringify({ error: message, details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    );
  }
});
