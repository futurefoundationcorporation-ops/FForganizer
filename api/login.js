// /api/login.js

import { createClient } from '@supabase/supabase-js'
import { serialize } from 'cookie'

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { key } = req.body

    if (!key) {
      return res.status(400).json({ error: 'Chave de acesso é obrigatória.' })
    }

    const { data, error } = await supabase.rpc('create_admin_session', {
      access_key: key
    })

    if (error) {
      console.error("Erro RPC:", error)
      return res.status(400).json({ error: 'Chave inválida.' })
    }

    // 🔥 AQUI ESTÁ A CORREÇÃO QUE FAZ O COOKIE FUNCIONAR NA VERCEL
    const cookie = serialize("session_token", data.session_token, {
      httpOnly: true,
      secure: true,         // obrigatório para Vercel
      sameSite: "lax",      // permite navegação normal
      path: "/",            // envia para todas rotas, inclusive /api/session
      maxAge: 60 * 60 * 24 * 7
    })

    res.setHeader("Set-Cookie", cookie)

    return res.status(200).json({
      success: true,
      session: data
    })

  } catch (err) {
    console.error("Erro inesperado no /api/login:", err)
    return res.status(500).json({ error: "Erro interno." })
  }
}
