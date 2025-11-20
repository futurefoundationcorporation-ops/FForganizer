// supabase/functions/_shared/admin.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parse } from 'https://deno.land/std@0.177.0/flags/mod.ts';
import { corsHeaders } from './cors.ts'

// Retorna null se for admin, ou uma resposta de erro se não for.
export async function requireAdmin(req: Request): Promise<Response | null> {
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = parse(cookieHeader.replaceAll('; ', '&'))
  const token = cookies.session_token

  if (!token) {
    return new Response(JSON.stringify({ error: 'Autenticação necessária' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )

  const { data, error } = await supabaseClient.from('sessions').select('is_admin').eq('session_token', token).single()

  if (error || !data) {
    if (error) console.error('Erro ao verificar admin:', error)
    return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!data.is_admin) {
    return new Response(JSON.stringify({ error: 'Acesso negado: requer privilégios de administrador' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Se tudo estiver OK, o usuário é um admin
  return null
}
