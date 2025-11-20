
// supabase/functions/session/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { parse } from 'https://deno.land/std@0.177.0/flags/mod.ts';

// Função de resposta padronizada para garantir CORS
function createJsonResponse(body: any, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  // Responde imediatamente a preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'GET') {
      return createJsonResponse({ valid: false, error: 'Método não permitido' }, 405);
    }

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')?.[1];

    if (!token) {
      // Se não há token, a sessão não é válida. Isso não é um erro, é um estado esperado.
      return createJsonResponse({ valid: false }, 200);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data, error } = await supabaseClient.from('sessions').select('is_admin, created_at').eq('session_token', token).single();

    if (error || !data) {
      if (error) console.error('Erro ao buscar sessão:', error);
      // Token inválido ou não encontrado.
      return createJsonResponse({ valid: false }, 200);
    }
    
    // Opcional: Verificar se a sessão expirou (ex: 24 horas)
    const sessionAgeHours = (new Date().getTime() - new Date(data.created_at).getTime()) / 3600000;
    if (sessionAgeHours > 24) {
        console.log(`Sessão expirada para o token: ${token}`);
        // Deleta a sessão expirada do banco de dados
        await supabaseClient.from('sessions').delete().eq('session_token', token);
        return createJsonResponse({ valid: false, error: 'Sessão expirada' }, 401);
    }

    // Atualiza o timestamp de último uso
    await supabaseClient.from('sessions').update({ last_used_at: new Date().toISOString() }).eq('session_token', token);

    return createJsonResponse({ valid: true, isAdmin: !!data.is_admin }, 200);

  } catch (err) {
    console.error('Erro na função de sessão:', err);
    return createJsonResponse({ valid: false, error: 'Erro interno no servidor' }, 500);
  }
});
