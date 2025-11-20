// /api/login.js - VERSÃO CORRIGIDA

import { createClient } from '@supabase/supabase-js'
import { serialize } from 'cookie'
import { randomBytes } from 'crypto'

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

    // ✅ PASSO 1: Validar a chave usando a função correta
    const { data: validation, error: validationError } = await supabase.rpc('validate_master_or_access_key', {
      input_key: key
    })

    if (validationError) {
      console.error("Erro ao validar chave:", validationError)
      return res.status(500).json({ error: 'Erro ao validar chave.' })
    }

    if (!validation || !validation.valid) {
      return res.status(400).json({ error: 'Chave inválida.' })
    }

    // ✅ PASSO 2: Gerar token de sessão seguro
    const sessionToken = randomBytes(32).toString('hex')

    // ✅ PASSO 3: Criar sessão no Supabase com os parâmetros CORRETOS
    const { data: sessionData, error: sessionError } = await supabase.rpc('create_admin_session', {
      session_token: sessionToken,
      user_is_admin: validation.is_admin
    })

    if (sessionError) {
      console.error("Erro ao criar sessão:", sessionError)
      return res.status(500).json({ error: 'Erro ao criar sessão.' })
    }

    // ✅ PASSO 4: Configurar cookie HTTP-only
    const cookie = serialize("session_token", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    })

    res.setHeader("Set-Cookie", cookie)

    // ✅ PASSO 5: Retornar sucesso
    return res.status(200).json({
      success: true,
      session: {
        token: sessionToken,
        is_admin: validation.is_admin,
        type: validation.type
      }
    })

  } catch (err) {
    console.error("Erro inesperado no /api/login:", err)
    return res.status(500).json({ error: "Erro interno." })
  }
}
