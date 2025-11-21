// supabase/functions/_shared/admin.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from './cors.ts';

export async function requireAdmin(req: Request): Promise<Response | null> {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  const authHeader = req.headers.get('Authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    return new Response(JSON.stringify({ error: 'Autenticação necessária (token ausente)' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const { data, error } = await supabaseClient
    .from('sessions')
    .select('is_admin')
    .eq('session_token', token)
    .single();

  if (error || !data) {
    if (error) console.error('Erro ao verificar admin:', error);
    return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!data.is_admin) {
    return new Response(JSON.stringify({ error: 'Acesso negado: requer privilégios de administrador' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return null; // Usuário é admin
}
