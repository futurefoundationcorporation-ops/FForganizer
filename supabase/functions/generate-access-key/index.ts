// supabase/functions/generate-access-key/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { requireAdmin } from '../_shared/admin.ts'
import crypto from 'https://deno.land/std@0.177.0/node/crypto.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verificar se o solicitante é um administrador
    const adminCheck = await requireAdmin(req)
    if (adminCheck) {
      return adminCheck // Retorna a resposta de erro se não for admin
    }

    // 2. Processar a solicitação
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Método não permitido' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { label = '', isAdmin = false } = await req.json()

    // 3. Gerar a nova chave
    const salt = crypto.randomBytes(16).toString('hex')
    const raw = crypto.randomBytes(32).toString('hex')
    const plainKey = `ACCESS-${raw}`
    const keyHash = crypto.createHash('sha256').update(plainKey + salt).digest('hex')

    // 4. Inserir a nova chave no banco de dados
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Usar chave de serviço para inserir dados
    )

    const { data, error } = await supabaseClient.from('access_keys').insert({
      key_hash: keyHash,
      salt,
      label,
      is_admin: !!isAdmin,
    }).select('id').single()

    if (error) {
      console.error('Erro ao gerar chave de acesso:', error)
      throw new Error('Erro ao salvar nova chave de acesso')
    }

    // 5. Retornar a chave em texto plano para o admin
    return new Response(JSON.stringify({
      success: true,
      key: plainKey,
      keyId: data.id,
      label,
      isAdmin: !!isAdmin,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Erro na função generateAccessKey:', err)
    return new Response(JSON.stringify({ success: false, error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
