// /api/session.js - VERSÃO SEM RPC

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
        isAdmin: false
      })
    }

    // ✅ Buscar sessão diretamente na tabela (SEM RPC)
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('session_token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !session) {
      return res.status(200).json({
        valid: false,
        logged: false,
        isAdmin: false
      })
    }

    // ✅ Sessão válida
    return res.status(200).json({
      valid: true,
      logged: true,
      isAdmin: session.is_admin,
      expiresAt: session.expires_at
    })

  } catch (err) {
    console.error('Erro inesperado no /api/session:', err)
    return res.status(500).json({ 
      valid: false, 
      logged: false,
      isAdmin: false,
      error: 'Erro interno no servidor' 
    })
  }
}
