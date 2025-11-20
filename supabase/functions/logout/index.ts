// supabase/functions/logout/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { parse } from 'https://deno.land/std@0.177.0/flags/mod.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Método não permitido' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = parse(cookieHeader.replaceAll('; ', '&'))
    const token = cookies.session_token

    if (token) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      )
      // O `delete` não falha se o token não existir, então o .catch é desnecessário
      await supabaseClient.from('sessions').delete().eq('session_token', token)
    }

    // Criar um cookie que expira imediatamente
    const expiredCookie = 'session_token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0'

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Set-Cookie': expiredCookie },
    })

  } catch (err) {
    console.error('Erro na função de logout:', err)
    return new Response(JSON.stringify({ success: false, error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
