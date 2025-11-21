// supabase/functions/list-access-keys/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { requireAdmin } from '../_shared/admin.ts'

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const adminCheck = await requireAdmin(req)
    if (adminCheck) {
      return adminCheck
    }

    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ success: false, error: 'Método não permitido' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: keys, error } = await supabaseClient.from('access_keys').select('id, created_at, label, is_admin, last_used_at, usage_count')

    if (error) {
      console.error('Erro ao listar chaves de acesso:', error)
      throw new Error('Erro ao buscar chaves de acesso')
    }

    return new Response(JSON.stringify({ success: true, keys }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Erro na função listAccessKeys:', err)
    return new Response(JSON.stringify({ success: false, error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
