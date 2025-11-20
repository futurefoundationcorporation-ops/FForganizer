const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

// Suporte para ambas as variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { key } = req.body

    if (!key) {
      return res.status(400).json({ ok: false, error: 'Chave não fornecida' })
    }

    // MASTER KEY
    const masterKey = process.env.MASTER_KEY

    if (!masterKey) {
      return res.status(500).json({ ok: false, error: 'MASTER_KEY não configurada' })
    }

    let isAdmin = false
    let isValidAccessKey = false

    // Verificar MASTER_KEY direto
    if (key.trim() === masterKey.trim()) {
      isAdmin = true
      isValidAccessKey = true
    } else {
      // Verificar Access Key no Supabase
      if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(401).json({ ok: false, error: 'Chave inválida' })
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const { data, error } = await supabase.rpc(
        'validate_master_or_access_key',
        { input_key: key }
      )

      if (error || !data?.valid) {
        return res.status(401).json({ ok: false, error: 'Chave inválida' })
      }

      isAdmin = data.is_admin
      isValidAccessKey = true
    }

    if (!isValidAccessKey) {
      return res.status(401).json({ ok: false, error: 'Chave inválida' })
    }

    // Criar Token
    const sessionToken = crypto.randomBytes(64).toString('hex')
    let expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // Criar sessão no Supabase (se configurado)
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      try {
        const { data: sessionData, error: sessionError } = await supabase.rpc(
          'create_admin_session',
          {
            session_token: sessionToken,
            user_is_admin: isAdmin
          }
        )

        if (!sessionError && sessionData?.expires_at) {
          expiresAt = sessionData.expires_at
        }
      } catch (_) {}
    }

    // Cookie seguro
    const cookie = [
      `session_token=${sessionToken}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${7 * 24 * 60 * 60}`,
      process.env.NODE_ENV === 'production' ? 'Secure' : '',
      'SameSite=Strict'
    ].filter(Boolean).join('; ')

    res.setHeader('Set-Cookie', cookie)

    return res.status(200).json({
      ok: true,
      isAdmin,
      expiresAt
    })

  } catch (error) {
    console.error('Erro inesperado no login:', error)
    return res.status(500).json({ ok: false, error: 'Erro interno do servidor' })
  }
}
