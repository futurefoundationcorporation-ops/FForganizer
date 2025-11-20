// /api/session.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const token = req.cookies['session_token']

    if (!token) {
      return res.status(200).json({
        valid: false,
        logged: false,
        error: 'Nenhuma sessão ativa'
      })
    }

    // 🔥 ESTA É A LINHA CORRIGIDA (NÃO MUDEI NADA ALÉM DELA)
    const { data, error } = await supabase.rpc('validate_admin_session', {
      session_token: token    //  <<<<<< AQUI! OBRIGATÓRIO TER UNDERSCORE
    })

    if (error) {
      console.error('Erro ao validar sessão:', error)
      return res.status(500).json({ valid: false, error })
    }

    return res.status(200).json({
      valid: data?.valid || false,
      logged: data?.valid || false,
      isAdmin: data?.is_admin || false,
      expiresAt: data?.expires_at || null,
    })

  } catch (err) {
    console.error('Erro inesperado no /api/session:', err)
    return res.status(500).json({ valid: false, error: 'Erro interno no servidor' })
  }
}
