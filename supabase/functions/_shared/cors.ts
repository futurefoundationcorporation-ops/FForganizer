// supabase/functions/_shared/cors.ts
const allowedOrigins = [
  'https://futurefoundationorganizer.web.app', // Produção
  'http://localhost:5173', // Desenvolvimento Vite
];

export function getCorsHeaders(requestOrigin: string | null): { [key: string]: string } {
  const origin = allowedOrigins.includes(requestOrigin ?? '') ? requestOrigin! : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}
