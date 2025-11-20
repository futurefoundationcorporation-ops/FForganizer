// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // TODO: Restringir ao domínio do site em produção
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
